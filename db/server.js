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
const { asegurarEsquema } = require('./esquema');

// ---------- Configuración ----------
const PORT = Number(process.env.PORT) || 3000;
// Por defecto solo escucha en la propia máquina; con HOST=0.0.0.0 acepta conexiones de otras.
const HOST = process.env.HOST || '127.0.0.1';
const SALT_ROUNDS = 10;

// Sin un secreto propio cualquiera podría firmar tokens válidos, así que el servidor no arranca.
const SECRETOS_DE_EJEMPLO = ['cambiar_por_un_secreto_largo_y_aleatorio', 'deruta-dev-secret-cambiar-en-produccion'];
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || SECRETOS_DE_EJEMPLO.includes(JWT_SECRET)) {
  console.error('Falta JWT_SECRET en el .env (o tiene el valor de ejemplo). Generá uno con:');
  console.error("  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
  process.exit(1);
}
if (JWT_SECRET.length < 32) {
  console.warn('Aviso: JWT_SECRET tiene menos de 32 caracteres; conviene uno más largo.');
}
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
// Orígenes del frontend que pueden usar la API con la sesión (separados por coma).
// Sin FRONTEND_URL solo se aceptan los de desarrollo local. Nunca se acepta cualquier origen.
const ORIGENES_PERMITIDOS = (process.env.FRONTEND_URL || 'http://localhost:4200,http://127.0.0.1:4200')
  .split(',')
  .map(origen => origen.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const origenPermitido = (origen) => ORIGENES_PERMITIDOS.includes(origen);

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
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cors({
  // Pedidos sin Origin (curl, el propio servidor) no son de un navegador y no llevan CORS.
  origin: (origen, responder) => responder(null, !origen || origenPermitido(origen)),
  credentials: true
}));
// Defensa extra contra CSRF: un navegador en otro sitio no puede cambiar datos aunque mande la cookie.
app.use((req, res, next) => {
  const soloLectura = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const origen = req.headers.origin;
  if (!soloLectura && origen && !origenPermitido(origen)) {
    return res.status(403).json({ error: 'Origen no permitido.' });
  }
  return next();
});

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

// bcrypt solo usa los primeros 72 bytes; el front pide entre 8 y 20 caracteres.
function validarPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  return null;
}

// Se guarda solo la forma esperada de las listas, con topes, para no aceptar cualquier JSON.
const MAX_LISTAS = 20;
const MAX_CIUDADES_POR_LISTA = 500;
const textoCorto = (valor, maximo) => typeof valor === 'string' && valor.trim().length > 0 && valor.length <= maximo;

function limpiarListasFavs(listas) {
  if (!Array.isArray(listas) || listas.length > MAX_LISTAS) return null;
  const limpias = [];
  for (const lista of listas) {
    const idLista = typeof lista?.idLista === 'number' ? String(lista.idLista) : lista?.idLista;
    if (!lista || !textoCorto(idLista, 40) || !textoCorto(lista.nombreLista, 40)) return null;
    if (!Array.isArray(lista.listaCiudades) || lista.listaCiudades.length > MAX_CIUDADES_POR_LISTA) return null;
    const ciudades = [];
    for (const ciudad of lista.listaCiudades) {
      if (!ciudad || typeof ciudad.codigoPais !== 'string' || ciudad.codigoPais.length > 10 || !textoCorto(ciudad.nombre, 120)) {
        return null;
      }
      ciudades.push({ codigoPais: ciudad.codigoPais, nombre: ciudad.nombre });
    }
    limpias.push({ idLista, nombreLista: lista.nombreLista.trim(), listaCiudades: ciudades });
  }
  return limpias;
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

const datosSesion = (u) => ({ id: u.id, username: u.username, email: u.email, rol: u.rol === 'admin' ? 'admin' : 'usuario' });

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
  paisId: row.pais_id,
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

// Si llegan dos registros con el mismo dato a la vez (por ejemplo, un doble clic), los dos pasan el
// control de datoEnUso y el segundo choca con el índice único de la base. Devuelve qué dato se repitió,
// o null si el error es otro.
function campoDuplicado(error) {
  if (error?.code !== 'ER_DUP_ENTRY') return null;
  if (/uq_usuarios_email/.test(error.sqlMessage || '')) return 'email';
  if (/uq_usuarios_username/.test(error.sqlMessage || '')) return 'username';
  return null;
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

// ---------- Límite de intentos de login ----------
// Por cuenta (no por IP, porque detrás de un proxy todas las conexiones llegan desde la misma dirección): después de
// MAX_FALLOS contraseñas incorrectas seguidas, esa cuenta queda frenada VENTANA_MS. El contador se guarda con el id
// de la cuenta, así que los intentos con el nombre de usuario y con el email suman al mismo contador.
const MAX_FALLOS = 10;
const VENTANA_MS = 15 * 60 * 1000;
const intentosFallidos = new Map();
const HASH_DE_RELLENO = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), SALT_ROUNDS);

function segundosDeBloqueo(clave) {
  const registro = intentosFallidos.get(clave);
  if (!registro) return 0;
  const restante = registro.desde + VENTANA_MS - Date.now();
  if (restante <= 0) {
    intentosFallidos.delete(clave);
    return 0;
  }
  return registro.fallos >= MAX_FALLOS ? Math.ceil(restante / 1000) : 0;
}

function registrarFallo(clave) {
  const registro = intentosFallidos.get(clave);
  if (!registro || registro.desde + VENTANA_MS <= Date.now()) {
    intentosFallidos.set(clave, { fallos: 1, desde: Date.now() });
  } else {
    registro.fallos += 1;
  }
}

// Limpia los registros vencidos para que el mapa no crezca sin fin.
setInterval(() => {
  const ahora = Date.now();
  for (const [clave, registro] of intentosFallidos) {
    if (registro.desde + VENTANA_MS <= ahora) intentosFallidos.delete(clave);
  }
}, VENTANA_MS).unref();

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
  // Si la cuenta no existe, se cuenta por el texto escrito: igual se frena a quien prueba nombres al azar.
  const clave = encontrado ? `cuenta:${encontrado.id}` : `texto:${normalizar(identificador)}`;
  const espera = segundosDeBloqueo(clave);
  if (espera > 0) {
    res.set('Retry-After', String(espera));
    return res.status(429).json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' });
  }

  // Si la cuenta no existe se compara igual contra un hash cualquiera, para que la demora
  // no delate qué cuentas existen. Mismo 401 para los dos casos.
  const passwordValida = bcrypt.compareSync(String(password), encontrado?.password || HASH_DE_RELLENO);
  if (!encontrado || !passwordValida) {
    registrarFallo(clave);
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
  intentosFallidos.delete(clave);
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

// No hay listado de usuarios: exponía los emails de todas las cuentas. La unicidad la valida
// el backend al registrar (409) y el ranking solo muestra nombre y puntaje.

// Ranking público del minijuego: top por mejor puntaje. Solo username y puntaje (sin email).
app.get('/ranking', h(async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 10, 1), 50);
  const [filas] = await pool.query(
    'SELECT username, mejor_puntaje FROM usuarios WHERE mejor_puntaje > 0 ORDER BY mejor_puntaje DESC, username ASC LIMIT ?',
    [limite]
  );
  return res.json(filas.map(f => ({ username: f.username, mejorPuntaje: f.mejor_puntaje })));
}));

// Cada usuario solo puede ver su propia cuenta (tiene el email y las listas de favoritos).
app.get('/usuarios/:id', requiereAuth, h(async (req, res) => {
  if (!mismoId(req.params.id, req.usuario.id)) {
    return res.status(403).json({ error: 'No podés ver otra cuenta.' });
  }
  const usuario = await usuarioPorId(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
  return res.json(usuarioPublico(usuario));
}));

// Registro: valida el nombre de usuario y que el nombre y el email no estén en uso.
app.post('/usuarios', h(async (req, res) => {
  const { username, email, password, listasFavs } = req.body || {};

  const errorUsername = validarUsername(username);
  if (errorUsername) return res.status(400).json({ error: errorUsername });
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_VALIDO.test(email)) {
    return res.status(400).json({ error: 'El email no es válido.' });
  }
  const errorPassword = validarPassword(password);
  if (errorPassword) return res.status(400).json({ error: errorPassword });
  const listas = listasFavs === undefined ? [] : limpiarListasFavs(listasFavs);
  if (!listas) return res.status(400).json({ error: 'Las listas de favoritos no tienen el formato esperado.' });
  if (await datoEnUso('username', username)) return res.status(409).json({ error: 'El nombre de usuario ya está en uso.', campo: 'username' });
  if (await datoEnUso('email', email)) return res.status(409).json({ error: 'El email ya está en uso.', campo: 'email' });

  // Siempre se hashea acá: no se acepta un hash armado por el cliente.
  const id = nuevoId();
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  try {
    await pool.query(
      'INSERT INTO usuarios (id, username, email, password, mejor_puntaje, listas_favs) VALUES (?, ?, ?, ?, 0, ?)',
      [id, username.trim(), email.trim(), hash, JSON.stringify(listas)]
    );
  } catch (error) {
    const campo = campoDuplicado(error);
    if (!campo) throw error;
    const mensaje = campo === 'email' ? 'El email ya está en uso.' : 'El nombre de usuario ya está en uso.';
    return res.status(409).json({ error: mensaje, campo });
  }
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
  if (body.listasFavs !== undefined) {
    const listas = limpiarListasFavs(body.listasFavs ?? []);
    if (!listas) return res.status(400).json({ error: 'Las listas de favoritos no tienen el formato esperado.' });
    cambios.listas_favs = JSON.stringify(listas);
  }
  if (body.mejorPuntaje !== undefined) {
    const puntaje = Number(body.mejorPuntaje);
    if (!Number.isInteger(puntaje) || puntaje < 0 || puntaje > 1000000) {
      return res.status(400).json({ error: 'El puntaje no es válido.' });
    }
    // Solo se guarda si supera al anterior: el mejor puntaje nunca baja.
    cambios.mejor_puntaje = Math.max(puntaje, Number(usuario.mejor_puntaje) || 0);
  }
  if (body.password !== undefined) {
    const errorPassword = validarPassword(body.password);
    if (errorPassword) return res.status(400).json({ error: errorPassword });
    // Para cambiar la contraseña hay que acreditar la actual (aunque la sesión sea válida).
    const actual = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    // 400 y no 401: la sesión sigue siendo válida, solo está mal el dato. Con 401 el front
    // entendería "sesión vencida" y cerraría la sesión sin mostrar el aviso.
    if (!bcrypt.compareSync(actual, usuario.password || HASH_DE_RELLENO)) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.', campo: 'currentPassword' });
    }
    cambios.password = bcrypt.hashSync(body.password, SALT_ROUNDS);
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
// Solo los países visibles: los que un admin ocultó no aparecen en ninguna parte de la app.
app.get('/paises', h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM paises WHERE visible = 1 ORDER BY nombre');
  return res.json(filas.map(paisPublico));
}));

// ============================================================
// Comentarios
// ============================================================
// Los comentarios son de una ciudad de un país. Se filtra por los dos porque puede haber ciudades
// con el mismo nombre en países distintos.
app.get('/comentarios', h(async (req, res) => {
  const { ciudad, paisId } = req.query;
  let sql = 'SELECT * FROM comentarios';
  const cond = [];
  const params = [];
  if (paisId) { cond.push('pais_id = ?'); params.push(paisId); }
  if (ciudad) { cond.push('ciudad = ?'); params.push(ciudad); }
  if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
  sql += ' ORDER BY created_at ASC';
  const [filas] = await pool.query(sql, params);
  return res.json(filas.map(comentarioPublico));
}));

// El autor es siempre el usuario de la sesión.
app.post('/comentarios', requiereAuth, h(async (req, res) => {
  const { mensaje, ciudad, paisId } = req.body || {};
  if (!mensaje || !ciudad || !paisId) {
    return res.status(400).json({ error: 'Faltan el mensaje, la ciudad o el país.' });
  }
  const id = nuevoId();
  await pool.query(
    'INSERT INTO comentarios (id, pais_id, ciudad, usuario_id, usuario, mensaje) VALUES (?, ?, ?, ?, ?, ?)',
    [id, paisId, ciudad, req.usuario.id, req.usuario.username, mensaje]
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

// ============================================================
// Administración
// El rol se vuelve a leer de la base en cada pedido: si a alguien le sacan el rol, deja de
// poder entrar al instante, aunque su token todavía diga "admin".
// ============================================================
const requiereAdmin = [requiereAuth, h(async (req, res, next) => {
  const usuario = await usuarioPorId(req.usuario.id);
  if (!usuario || usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo para administradores.' });
  }
  req.admin = usuario;
  return next();
})];

async function registrarAccion(req, accion, objetivo, detalle = null) {
  await pool.query(
    'INSERT INTO admin_registro (id, usuario_id, usuario, accion, objetivo, detalle) VALUES (?, ?, ?, ?, ?, ?)',
    [nuevoId(), req.admin.id, req.admin.username, accion, String(objetivo).slice(0, 255), detalle === null ? null : JSON.stringify(detalle)]
  );
}

// ---------- Validación del catálogo ----------
const TEXTOS_PAIS = {
  nombre: 'nombre', nombreOficial: 'nombre_oficial', capital: 'capital', idiomaOficial: 'idioma_oficial',
  moneda: 'moneda', continente: 'continente', clima: 'clima', gastronomia: 'gastronomia',
  cultura: 'cultura', seguridad: 'seguridad', transporte: 'transporte'
};
const textoOpcional = (valor, maximo) => valor === undefined || valor === null || (typeof valor === 'string' && valor.length <= maximo);
// Solo se aceptan links http(s) o imágenes guardadas en la propia app; nunca "javascript:" y similares.
const urlSegura = (valor) => valor === undefined || valor === null || valor === '' ||
  (typeof valor === 'string' && valor.length <= 1000 && (/^https?:\/\//i.test(valor) || /^assets\/[\w./-]+$/.test(valor)));

// Objeto chico de un nivel (la visa o la dirección traducida): solo textos, números o sí/no.
const objetoSimple = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor) &&
  Object.values(valor).every(v => v === null || ['boolean', 'number'].includes(typeof v) || (typeof v === 'string' && v.length <= 1000));

// Las traducciones al inglés (campo "en") solo pueden tener los campos conocidos, con textos acotados.
function enValido(en, campos, maximo) {
  if (en === undefined || en === null) return true;
  if (typeof en !== 'object' || Array.isArray(en)) return false;
  return Object.entries(en).every(([clave, valor]) => campos.includes(clave) &&
    (['visa', 'ubicacion'].includes(clave) ? valor === null || objetoSimple(valor) : textoOpcional(valor, maximo)));
}

// Devuelve un mensaje de error o null. Revisa forma, largos, coordenadas y links de cada ciudad y atracción.
function validarCiudades(ciudades) {
  if (!Array.isArray(ciudades) || ciudades.length > 60) return 'Las ciudades tienen que ser una lista (máximo 60).';
  const camposCiudad = ['nombre', 'consejos', 'actividades', 'comentarios'];
  const camposAtraccion = ['nombre', 'descripcion', 'horario', 'tipo', 'ubicacion'];
  const nombres = new Set();
  for (const ciudad of ciudades) {
    if (!ciudad || typeof ciudad !== 'object') return 'Hay una ciudad vacía.';
    if (typeof ciudad.nombre !== 'string' || !ciudad.nombre.trim() || ciudad.nombre.length > 120) return 'Cada ciudad necesita un nombre (hasta 120 caracteres).';
    if (nombres.has(ciudad.nombre)) return `La ciudad "${ciudad.nombre}" está repetida.`;
    nombres.add(ciudad.nombre);
    if (!['consejos', 'actividades', 'comentarios'].every(c => textoOpcional(ciudad[c], 3000))) return `Un texto de ${ciudad.nombre} es demasiado largo.`;
    if (!urlSegura(ciudad.infoWikipedia)) return `El link de Wikipedia de ${ciudad.nombre} no es válido.`;
    if (!enValido(ciudad.en, camposCiudad, 3000)) return `La traducción de ${ciudad.nombre} no tiene el formato esperado.`;
    const atracciones = ciudad.atracciones ?? [];
    if (!Array.isArray(atracciones) || atracciones.length > 30) return `Las atracciones de ${ciudad.nombre} tienen que ser una lista (máximo 30).`;
    for (const a of atracciones) {
      if (!a || typeof a.nombre !== 'string' || !a.nombre.trim() || a.nombre.length > 160) return `Cada atracción de ${ciudad.nombre} necesita un nombre.`;
      if (!['descripcion'].every(c => textoOpcional(a[c], 3000)) || !['horario', 'tipo'].every(c => textoOpcional(a[c], 300))) return `Un texto de "${a.nombre}" es demasiado largo.`;
      // Los textos de relleno que quedaron de la carga inicial ("url_imagen_x.jpg", "No disponible")
      // no son links: se descartan en vez de rechazar todo el país.
      for (const campo of ['imagen', 'paginaWeb']) {
        if (typeof a[campo] === 'string' && !a[campo].includes(':') && !a[campo].startsWith('assets/')) delete a[campo];
      }
      if (!urlSegura(a.imagen)) return `La imagen de "${a.nombre}" tiene que ser un link http(s).`;
      if (!urlSegura(a.paginaWeb)) return `La página web de "${a.nombre}" tiene que ser un link http(s).`;
      if (a.valoracion !== undefined && a.valoracion !== null && !(typeof a.valoracion === 'number' && a.valoracion >= 0 && a.valoracion <= 5)) return `La valoración de "${a.nombre}" tiene que ir de 0 a 5.`;
      const u = a.ubicacion;
      if (u !== undefined && u !== null) {
        if (typeof u !== 'object' || !textoOpcional(u.direccion, 300)) return `La ubicación de "${a.nombre}" no es válida.`;
        if (typeof u.latitud !== 'number' || u.latitud < -90 || u.latitud > 90 || typeof u.longitud !== 'number' || u.longitud < -180 || u.longitud > 180) {
          return `Las coordenadas de "${a.nombre}" no son válidas.`;
        }
      }
      if (!enValido(a.en, camposAtraccion, 3000)) return `La traducción de "${a.nombre}" no tiene el formato esperado.`;
    }
  }
  return null;
}

// Números generales para la portada del panel.
app.get('/admin/resumen', requiereAdmin, h(async (req, res) => {
  const contar = async (sql) => Number((await pool.query(sql))[0][0].n);
  return res.json({
    usuarios: await contar('SELECT COUNT(*) AS n FROM usuarios'),
    comentarios: await contar('SELECT COUNT(*) AS n FROM comentarios'),
    valoraciones: await contar('SELECT COUNT(*) AS n FROM valoraciones'),
    paises: await contar('SELECT COUNT(*) AS n FROM paises'),
    paisesOcultos: await contar('SELECT COUNT(*) AS n FROM paises WHERE visible = 0')
  });
}));

// Todos los países, incluidos los ocultos, para que el panel pueda volver a mostrarlos.
app.get('/admin/paises', requiereAdmin, h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM paises ORDER BY nombre');
  return res.json(filas.map(paisPublico));
}));

// Edita un país: textos, visibilidad, traducción y la lista completa de ciudades con sus atracciones.
app.patch('/admin/paises/:id', requiereAdmin, h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM paises WHERE id = ? LIMIT 1', [req.params.id]);
  const pais = filas[0];
  if (!pais) return res.status(404).json({ error: 'País no encontrado.' });

  const body = req.body || {};
  const cambios = {};
  for (const [campo, columna] of Object.entries(TEXTOS_PAIS)) {
    if (body[campo] === undefined) continue;
    if (!textoOpcional(body[campo], 3000)) return res.status(400).json({ error: `El campo ${campo} no es válido.` });
    if (campo === 'nombre' && !String(body.nombre || '').trim()) return res.status(400).json({ error: 'El país necesita un nombre.' });
    cambios[columna] = body[campo];
  }
  if (body.visible !== undefined) {
    if (typeof body.visible !== 'boolean') return res.status(400).json({ error: 'visible tiene que ser verdadero o falso.' });
    cambios.visible = body.visible ? 1 : 0;
  }
  if (body.en !== undefined) {
    if (!enValido(body.en, [...Object.keys(TEXTOS_PAIS), 'visa'], 3000)) return res.status(400).json({ error: 'La traducción del país no tiene el formato esperado.' });
    cambios.en = JSON.stringify(body.en);
  }
  if (body.ciudades !== undefined) {
    const error = validarCiudades(body.ciudades);
    if (error) return res.status(400).json({ error });
    cambios.ciudades = JSON.stringify(body.ciudades);
  }
  if (Object.keys(cambios).length === 0) return res.status(400).json({ error: 'No hay cambios para guardar.' });

  const sets = Object.keys(cambios).map(c => `${c} = ?`).join(', ');
  await pool.query(`UPDATE paises SET ${sets} WHERE id = ?`, [...Object.values(cambios), req.params.id]);
  // En el registro se guardan los campos que cambiaron (las ciudades, solo cuántas quedaron).
  const detalle = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, k === 'ciudades' ? `${v.length} ciudades` : v]));
  await registrarAccion(req, body.visible !== undefined && Object.keys(body).length === 1 ? (body.visible ? 'mostrar_pais' : 'ocultar_pais') : 'editar_pais', pais.nombre, detalle);

  const [actualizado] = await pool.query('SELECT * FROM paises WHERE id = ?', [req.params.id]);
  return res.json(paisPublico(actualizado[0]));
}));

// Todos los comentarios, los más nuevos primero, para moderar.
app.get('/admin/comentarios', requiereAdmin, h(async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 200, 1), 500);
  const [filas] = await pool.query(
    `SELECT c.*, p.nombre AS pais_nombre FROM comentarios c LEFT JOIN paises p ON p.id = c.pais_id
     ORDER BY c.created_at DESC LIMIT ?`,
    [limite]
  );
  return res.json(filas.map(f => ({ ...comentarioPublico(f), pais: f.pais_nombre, fecha: f.created_at })));
}));

app.delete('/admin/comentarios/:id', requiereAdmin, h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
  const comentario = filas[0];
  if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado.' });
  await pool.query('DELETE FROM comentarios WHERE id = ?', [req.params.id]);
  await registrarAccion(req, 'borrar_comentario', `${comentario.usuario} en ${comentario.ciudad}`, { mensaje: comentario.mensaje });
  return res.status(204).end();
}));

// Últimas acciones de los admins.
app.get('/admin/registro', requiereAdmin, h(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM admin_registro ORDER BY fecha DESC LIMIT 100');
  return res.json(filas.map(f => ({
    id: f.id, usuario: f.usuario, accion: f.accion, objetivo: f.objetivo, detalle: parseJson(f.detalle), fecha: f.fecha
  })));
}));

// ---------- Salud y errores ----------
app.get('/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  // JSON mal formado o demasiado grande: es un error del pedido, no del servidor.
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'El cuerpo del pedido no es un JSON válido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'El pedido es demasiado grande.' });
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Con "node db/server.js" arranca el servidor. Los tests importan este archivo para usar la app sin
// arrancarla ni conectarse a la base (ver db/test/server.test.js).
if (require.main === module) {
  // Antes de aceptar pedidos se asegura que la base tenga lo que necesita el panel de administración.
  asegurarEsquema(pool)
    .then(() => {
      app.listen(PORT, HOST, () => {
        console.log(`Backend de TpViajes corriendo en http://${HOST}:${PORT}`);
        console.log(`Orígenes permitidos: ${ORIGENES_PERMITIDOS.join(', ')}`);
      });
    })
    .catch(error => {
      console.error('No se pudo preparar la base de datos:', error.message);
      process.exit(1);
    });
}

module.exports = { app, pool };
