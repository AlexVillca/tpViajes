// ============================================================
// TpViajes — Backend propio (Express + MySQL)
// API REST propia contra MySQL. Mismas rutas y respuestas que consume el Angular.
// Seguridad: sesión con JWT en cookie httpOnly, contraseñas con bcrypt, permisos por dueño.
// Los secretos (DB, JWT) salen del entorno (.env); nada hardcodeado.
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// ---------- Configuración ----------
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'deruta-dev-secret-cambiar-en-produccion';
const JWT_EXPIRES_IN = '7d';
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

// El token viaja en una cookie httpOnly: el JavaScript de la página no puede leerlo.
const COOKIE_NOMBRE = 'deruta_token';
// En producción (frontend y backend en dominios distintos) la cookie necesita SameSite=None y Secure.
const COOKIE_CROSS_SITE = process.env.COOKIE_CROSS_SITE === 'true';
const OPCIONES_COOKIE = {
  httpOnly: true,
  sameSite: COOKIE_CROSS_SITE ? 'none' : 'lax',
  secure: COOKIE_CROSS_SITE,
  path: '/'
};
// Origen del frontend permitido por CORS. Sin valor (dev) se refleja el origen que llega.
const FRONTEND_URL = process.env.FRONTEND_URL;

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'tpviajes',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tpviajes',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL || true, credentials: true }));

// ---------- Utilidades ----------
const mismoId = (a, b) => String(a) === String(b);
const normalizar = (texto) => String(texto || '').trim().toLowerCase();
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nuevoId = () => crypto.randomUUID();

function parseJson(v, fallback = null) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'object') return v; // mysql2 ya puede devolver JSON parseado
  try { return JSON.parse(v); } catch { return fallback; }
}

function validarUsername(username) {
  if (typeof username !== 'string' || username.trim().length < 4 || username.trim().length > 20) {
    return 'El nombre de usuario debe tener entre 4 y 20 caracteres.';
  }
  if (username.includes('@')) {
    return 'El nombre de usuario no puede contener "@".';
  }
  return null;
}

// Lee una cookie del encabezado sin dependencias extra.
function leerCookies(req) {
  const cookies = {};
  for (const parte of (req.headers.cookie || '').split(';')) {
    const indice = parte.indexOf('=');
    if (indice > 0) {
      cookies[parte.slice(0, indice).trim()] = decodeURIComponent(parte.slice(indice + 1).trim());
    }
  }
  return cookies;
}

function leerToken(req) {
  const cookie = leerCookies(req)[COOKIE_NOMBRE];
  if (cookie) return cookie;
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

const datosSesion = (u) => ({ id: u.id, username: u.username, email: u.email });

function iniciarSesion(res, usuario) {
  const sesion = datosSesion(usuario);
  const token = jwt.sign(sesion, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie(COOKIE_NOMBRE, token, { ...OPCIONES_COOKIE, maxAge: SIETE_DIAS_MS });
  return sesion;
}

// ---------- Mapeos fila -> forma que espera el Angular ----------
const usuarioPublico = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  mejorPuntaje: row.mejor_puntaje,
  listasFavs: parseJson(row.listas_favs, [])
});

const comentarioPublico = (row) => ({
  id: row.id,
  mensaje: row.mensaje,
  ciudad: row.ciudad,
  usuarioId: row.usuario_id,
  usuario: row.usuario
});

const valoracionPublica = (row) => ({
  id: row.id,
  ciudad: row.ciudad,
  paisId: row.pais_id,
  usuarioId: row.usuario_id,
  puntaje: row.puntaje
});

const paisPublico = (row) => ({
  id: row.id,
  nombre: row.nombre,
  nombreOficial: row.nombre_oficial,
  capital: row.capital,
  codigo: row.codigo,
  latitud: row.latitud === null ? null : Number(row.latitud),
  longitud: row.longitud === null ? null : Number(row.longitud),
  bandera: row.bandera,
  idiomaOficial: row.idioma_oficial,
  moneda: row.moneda,
  continente: row.continente,
  clima: row.clima,
  gastronomia: row.gastronomia,
  cultura: row.cultura,
  seguridad: row.seguridad,
  transporte: row.transporte,
  visible: !!row.visible,
  visa: parseJson(row.visa),
  ciudades: parseJson(row.ciudades, []),
  en: parseJson(row.en)
});

// ---------- Acceso a datos ----------
async function buscarUsuarioPorIdentificador(identificador) {
  const buscado = normalizar(identificador);
  const [filas] = await pool.query(
    'SELECT * FROM usuarios WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1',
    [buscado, buscado]
  );
  return filas[0] || null;
}

async function usuarioPorId(id) {
  const [filas] = await pool.query('SELECT * FROM usuarios WHERE id = ? LIMIT 1', [id]);
  return filas[0] || null;
}

// column está en una lista blanca; nunca viene del usuario.
async function datoEnUso(column, valor, idExcluido = null) {
  const [filas] = await pool.query(
    `SELECT id FROM usuarios WHERE LOWER(${column}) = ? AND id <> ? LIMIT 1`,
    [normalizar(valor), idExcluido ?? '']
  );
  return filas.length > 0;
}

// ---------- Middleware de autenticación ----------
function requiereAuth(req, res, next) {
  const token = leerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Falta el token de autenticación.' });
  }
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// Envuelve un handler async y manda los errores al manejador global.
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ============================================================
// Sesión
// ============================================================

// Acepta email o nombre de usuario en "usuario". Se mantiene "email" por compatibilidad.
app.post('/login', h(async (req, res) => {
  const { usuario, email, password } = req.body || {};
  const identificador = usuario || email;

  if (!identificador || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  const encontrado = await buscarUsuarioPorIdentificador(identificador);
  if (!encontrado) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  if (!bcrypt.compareSync(password, encontrado.password || '')) {
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }
  return res.json({ user: iniciarSesion(res, encontrado) });
}));

app.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NOMBRE, OPCIONES_COOKIE);
  res.status(204).end();
});

// Devuelve el usuario de la cookie si sigue siendo válida (la usa el frontend al abrir la app).
app.get('/sesion', h(async (req, res) => {
  const token = leerToken(req);
  if (!token) return res.status(401).json({ error: 'No hay sesión activa.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const usuario = await usuarioPorId(payload.id);
    if (!usuario) return res.status(401).json({ error: 'La cuenta ya no existe.' });
    return res.json({ user: datosSesion(usuario) });
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}));

// Editar perfil: cambia nombre de usuario y/o email y renueva la sesión con los datos nuevos.
app.patch('/perfil', requiereAuth, h(async (req, res) => {
  const { username, email } = req.body || {};
  const usuario = await usuarioPorId(req.usuario.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

  const cambios = {};

  if (username !== undefined) {
    const errorUsername = validarUsername(username);
    if (errorUsername) return res.status(400).json({ error: errorUsername });
    if (await datoEnUso('username', username, req.usuario.id)) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso.', campo: 'username' });
    }
    cambios.username = username.trim();
  }

  if (email !== undefined) {
    if (!EMAIL_VALIDO.test(email)) return res.status(400).json({ error: 'El email no es válido.' });
    if (await datoEnUso('email', email, req.usuario.id)) {
      return res.status(409).json({ error: 'El email ya está en uso.', campo: 'email' });
    }
    cambios.email = email.trim();
  }

  if (Object.keys(cambios).length === 0) {
    return res.json({ user: iniciarSesion(res, usuario) });
  }

  const nombreAnterior = usuario.username;
  const sets = Object.keys(cambios).map(c => `${c} = ?`).join(', ');
  await pool.query(`UPDATE usuarios SET ${sets} WHERE id = ?`, [...Object.values(cambios), usuario.id]);

  // Los comentarios guardan el nombre del autor: se actualizan para que no quede el nombre viejo.
  if (cambios.username && cambios.username !== nombreAnterior) {
    await pool.query('UPDATE comentarios SET usuario = ? WHERE usuario_id = ?', [cambios.username, usuario.id]);
  }

  const actualizado = await usuarioPorId(usuario.id);
  return res.json({ user: iniciarSesion(res, actualizado) });
}));

// ============================================================
// Usuarios
// ============================================================

// Lista mínima (solo lo que el front usa para validar unicidad). Nunca expone la contraseña.
app.get('/usuarios', h(async (req, res) => {
  const [filas] = await pool.query('SELECT id, username, email FROM usuarios');
  return res.json(filas);
}));

// Ranking público del minijuego: top por mejor puntaje. Solo username y puntaje (sin email).
app.get('/ranking', h(async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 10, 1), 50);
  const [filas] = await pool.query(
    'SELECT username, mejor_puntaje FROM usuarios WHERE mejor_puntaje > 0 ORDER BY mejor_puntaje DESC, username ASC LIMIT ?',
    [limite]
  );
  return res.json(filas.map(f => ({ username: f.username, mejorPuntaje: f.mejor_puntaje })));
}));

app.get('/usuarios/:id', h(async (req, res) => {
  const usuario = await usuarioPorId(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
  return res.json(usuarioPublico(usuario));
}));

// Registro: valida el nombre de usuario y que el nombre y el email no estén en uso.
app.post('/usuarios', h(async (req, res) => {
  const { username, email, password, listasFavs } = req.body || {};

  const errorUsername = validarUsername(username);
  if (errorUsername) return res.status(400).json({ error: errorUsername });
  if (!EMAIL_VALIDO.test(email || '')) return res.status(400).json({ error: 'El email no es válido.' });
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'La contraseña es requerida.' });
  }
  if (await datoEnUso('username', username)) return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });
  if (await datoEnUso('email', email)) return res.status(409).json({ error: 'El email ya está en uso.' });

  const id = nuevoId();
  const hash = password.startsWith('$2') ? password : bcrypt.hashSync(password, SALT_ROUNDS);
  await pool.query(
    'INSERT INTO usuarios (id, username, email, password, mejor_puntaje, listas_favs) VALUES (?, ?, ?, ?, 0, ?)',
    [id, username.trim(), email.trim(), hash, JSON.stringify(Array.isArray(listasFavs) ? listasFavs : [])]
  );
  const creado = await usuarioPorId(id);
  return res.status(201).json(usuarioPublico(creado));
}));

// Cada usuario solo puede modificar su propia cuenta; el nombre/email se cambian por /perfil.
app.patch('/usuarios/:id', requiereAuth, h(async (req, res) => {
  if (!mismoId(req.params.id, req.usuario.id)) {
    return res.status(403).json({ error: 'No podés modificar otra cuenta.' });
  }
  const body = req.body || {};
  if ('username' in body || 'email' in body) {
    return res.status(400).json({ error: 'El nombre de usuario y el email se cambian desde /perfil.' });
  }

  const usuario = await usuarioPorId(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

  const cambios = {};
  if (body.listasFavs !== undefined) cambios.listas_favs = JSON.stringify(body.listasFavs ?? []);
  if (body.mejorPuntaje !== undefined) cambios.mejor_puntaje = Number(body.mejorPuntaje) || 0;
  if (typeof body.password === 'string' && body.password.length > 0) {
    cambios.password = body.password.startsWith('$2') ? body.password : bcrypt.hashSync(body.password, SALT_ROUNDS);
  }

  if (Object.keys(cambios).length > 0) {
    const sets = Object.keys(cambios).map(c => `${c} = ?`).join(', ');
    await pool.query(`UPDATE usuarios SET ${sets} WHERE id = ?`, [...Object.values(cambios), req.params.id]);
  }

  const actualizado = await usuarioPorId(req.params.id);
  return res.json(usuarioPublico(actualizado));
}));

// ============================================================
// Países (catálogo de referencia, solo lectura)
// ============================================================
app.get('/paises', h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM paises ORDER BY nombre');
  return res.json(filas.map(paisPublico));
}));

// ============================================================
// Comentarios
// ============================================================
app.get('/comentarios', h(async (req, res) => {
  const { ciudad } = req.query;
  let sql = 'SELECT * FROM comentarios';
  const params = [];
  if (ciudad) { sql += ' WHERE ciudad = ?'; params.push(ciudad); }
  sql += ' ORDER BY created_at ASC';
  const [filas] = await pool.query(sql, params);
  return res.json(filas.map(comentarioPublico));
}));

// El autor es siempre el usuario de la sesión.
app.post('/comentarios', requiereAuth, h(async (req, res) => {
  const { mensaje, ciudad, paisId } = req.body || {};
  if (!mensaje || !ciudad) {
    return res.status(400).json({ error: 'Faltan el mensaje o la ciudad.' });
  }
  const id = nuevoId();
  await pool.query(
    'INSERT INTO comentarios (id, pais_id, ciudad, usuario_id, usuario, mensaje) VALUES (?, ?, ?, ?, ?, ?)',
    [id, paisId ?? null, ciudad, req.usuario.id, req.usuario.username, mensaje]
  );
  const [filas] = await pool.query('SELECT * FROM comentarios WHERE id = ?', [id]);
  return res.status(201).json(comentarioPublico(filas[0]));
}));

// Solo el autor puede editar o borrar su comentario.
app.patch('/comentarios/:id', requiereAuth, h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
  const comentario = filas[0];
  if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado.' });
  if (!mismoId(comentario.usuario_id, req.usuario.id)) {
    return res.status(403).json({ error: 'Solo podés modificar tus propios comentarios.' });
  }
  const { mensaje } = req.body || {};
  if (mensaje === undefined) return res.status(400).json({ error: 'Falta el mensaje.' });
  await pool.query('UPDATE comentarios SET mensaje = ? WHERE id = ?', [mensaje, req.params.id]);
  const [actualizado] = await pool.query('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
  return res.json(comentarioPublico(actualizado[0]));
}));

app.delete('/comentarios/:id', requiereAuth, h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
  const comentario = filas[0];
  if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado.' });
  if (!mismoId(comentario.usuario_id, req.usuario.id)) {
    return res.status(403).json({ error: 'Solo podés borrar tus propios comentarios.' });
  }
  await pool.query('DELETE FROM comentarios WHERE id = ?', [req.params.id]);
  return res.status(204).end();
}));

// ============================================================
// Valoraciones (una por usuario y ciudad, de 1 a 5)
// ============================================================
app.get('/valoraciones', h(async (req, res) => {
  const { ciudad, paisId } = req.query;
  let sql = 'SELECT * FROM valoraciones';
  const cond = [];
  const params = [];
  if (ciudad) { cond.push('ciudad = ?'); params.push(ciudad); }
  if (paisId) { cond.push('pais_id = ?'); params.push(paisId); }
  if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
  const [filas] = await pool.query(sql, params);
  return res.json(filas.map(valoracionPublica));
}));

function puntajeValido(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

app.post('/valoraciones', requiereAuth, h(async (req, res) => {
  const { ciudad, paisId } = req.body || {};
  const puntaje = puntajeValido(req.body && req.body.puntaje);
  if (puntaje === null) {
    return res.status(400).json({ error: 'La valoración tiene que ser un número entero de 1 a 5.' });
  }
  if (!ciudad || !paisId) {
    return res.status(400).json({ error: 'Falta la ciudad o el país.' });
  }
  const [existentes] = await pool.query(
    'SELECT id FROM valoraciones WHERE ciudad = ? AND pais_id = ? AND usuario_id = ? LIMIT 1',
    [ciudad, paisId, req.usuario.id]
  );
  if (existentes.length) {
    return res.status(409).json({ error: 'Ya valoraste esta ciudad.', id: existentes[0].id });
  }
  const id = nuevoId();
  await pool.query(
    'INSERT INTO valoraciones (id, pais_id, ciudad, usuario_id, puntaje) VALUES (?, ?, ?, ?, ?)',
    [id, paisId, ciudad, req.usuario.id, puntaje]
  );
  const [filas] = await pool.query('SELECT * FROM valoraciones WHERE id = ?', [id]);
  return res.status(201).json(valoracionPublica(filas[0]));
}));

app.patch('/valoraciones/:id', requiereAuth, h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM valoraciones WHERE id = ?', [req.params.id]);
  const valoracion = filas[0];
  if (!valoracion) return res.status(404).json({ error: 'Valoración no encontrada.' });
  if (!mismoId(valoracion.usuario_id, req.usuario.id)) {
    return res.status(403).json({ error: 'Solo podés modificar tu propia valoración.' });
  }
  const puntaje = puntajeValido(req.body && req.body.puntaje);
  if (puntaje === null) {
    return res.status(400).json({ error: 'La valoración tiene que ser un número entero de 1 a 5.' });
  }
  await pool.query('UPDATE valoraciones SET puntaje = ? WHERE id = ?', [puntaje, req.params.id]);
  const [actualizado] = await pool.query('SELECT * FROM valoraciones WHERE id = ?', [req.params.id]);
  return res.json(valoracionPublica(actualizado[0]));
}));

// ---------- Salud y errores ----------
app.get('/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`Backend de TpViajes corriendo en http://localhost:${PORT}`);
});
