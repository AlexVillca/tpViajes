const path = require('path');
const jsonServer = require('json-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dbPath = path.join(__dirname, 'db.json');
const server = jsonServer.create();
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();
const db = router.db;

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

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ---------- Utilidades ----------

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
  // Se acepta también el encabezado Authorization (útil para probar la API con herramientas).
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function datosSesion(usuario) {
  return { id: usuario.id, username: usuario.username, email: usuario.email };
}

function iniciarSesion(res, usuario) {
  const sesion = datosSesion(usuario);
  const token = jwt.sign(sesion, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie(COOKIE_NOMBRE, token, { ...OPCIONES_COOKIE, maxAge: SIETE_DIAS_MS });
  return sesion;
}

const mismoId = (a, b) => String(a) === String(b);
const normalizar = (texto) => String(texto || '').trim().toLowerCase();
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarUsername(username) {
  if (typeof username !== 'string' || username.trim().length < 4 || username.trim().length > 20) {
    return 'El nombre de usuario debe tener entre 4 y 20 caracteres.';
  }
  if (username.includes('@')) {
    return 'El nombre de usuario no puede contener "@".';
  }
  return null;
}

function buscarUsuarioPorIdentificador(identificador) {
  const buscado = normalizar(identificador);
  return db.get('usuarios').find(u => normalizar(u.email) === buscado || normalizar(u.username) === buscado).value();
}

function datoEnUso(campo, valor, idExcluido) {
  return db.get('usuarios').some(u => normalizar(u[campo]) === normalizar(valor) && !mismoId(u.id, idExcluido)).value();
}

// ---------- Sesión ----------

// Acepta email o nombre de usuario en "usuario". Se mantiene "email" por compatibilidad.
server.post('/login', (req, res) => {
  const { usuario, email, password } = req.body || {};
  const identificador = usuario || email;

  if (!identificador || !password) {
    return res.status(400).jsonp({ error: 'Usuario y contraseña son requeridos.' });
  }

  const encontrado = buscarUsuarioPorIdentificador(identificador);

  if (!encontrado) {
    return res.status(404).jsonp({ error: 'Usuario no encontrado.' });
  }

  if (!bcrypt.compareSync(password, encontrado.password || '')) {
    return res.status(401).jsonp({ error: 'Contraseña incorrecta.' });
  }

  return res.jsonp({ user: iniciarSesion(res, encontrado) });
});

server.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NOMBRE, OPCIONES_COOKIE);
  res.status(204).end();
});

// Devuelve el usuario de la cookie si sigue siendo válida (la usa el frontend al abrir la app).
server.get('/sesion', (req, res) => {
  const token = leerToken(req);
  if (!token) return res.status(401).jsonp({ error: 'No hay sesión activa.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const usuario = db.get('usuarios').find(u => mismoId(u.id, payload.id)).value();
    if (!usuario) return res.status(401).jsonp({ error: 'La cuenta ya no existe.' });
    return res.jsonp({ user: datosSesion(usuario) });
  } catch (e) {
    return res.status(401).jsonp({ error: 'Token inválido o expirado.' });
  }
});

// ---------- Autenticación y permisos ----------

function requiereAuth(req) {
  const esMutacionUsuario =
    (req.method === 'PATCH' || req.method === 'PUT' || req.method === 'DELETE') &&
    req.path.startsWith('/usuarios/');
  const esMutacionComentario = req.method !== 'GET' && req.path.startsWith('/comentarios');
  const esMutacionValoracion = req.method !== 'GET' && req.path.startsWith('/valoraciones');
  const esPerfil = req.path === '/perfil';
  return esMutacionUsuario || esMutacionComentario || esMutacionValoracion || esPerfil;
}

server.use((req, res, next) => {
  if (!requiereAuth(req)) {
    return next();
  }

  const token = leerToken(req);

  if (!token) {
    return res.status(401).jsonp({ error: 'Falta el token de autenticación.' });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).jsonp({ error: 'Token inválido o expirado.' });
  }
});

// Cada usuario solo puede modificar su propia cuenta, y el nombre/email se cambian por /perfil.
server.use('/usuarios/:id', (req, res, next) => {
  if (req.method === 'GET') return next();
  if (!req.usuario) {
    return res.status(401).jsonp({ error: 'Falta el token de autenticación.' });
  }
  if (!mismoId(req.params.id, req.usuario.id)) {
    return res.status(403).jsonp({ error: 'No podés modificar otra cuenta.' });
  }
  if (req.body && ('username' in req.body || 'email' in req.body)) {
    return res.status(400).jsonp({ error: 'El nombre de usuario y el email se cambian desde /perfil.' });
  }
  return next();
});

// Registro: valida el nombre de usuario y que el nombre y el email no estén en uso.
server.post('/usuarios', (req, res, next) => {
  const { username, email } = req.body || {};
  const errorUsername = validarUsername(username);
  if (errorUsername) return res.status(400).jsonp({ error: errorUsername });
  if (!EMAIL_VALIDO.test(email || '')) return res.status(400).jsonp({ error: 'El email no es válido.' });
  if (datoEnUso('username', username)) return res.status(409).jsonp({ error: 'El nombre de usuario ya está en uso.' });
  if (datoEnUso('email', email)) return res.status(409).jsonp({ error: 'El email ya está en uso.' });
  return next();
});

// Editar perfil: cambia nombre de usuario y/o email y renueva la sesión con los datos nuevos.
server.patch('/perfil', (req, res) => {
  const { username, email } = req.body || {};
  const usuario = db.get('usuarios').find(u => mismoId(u.id, req.usuario.id));

  if (!usuario.value()) {
    return res.status(404).jsonp({ error: 'Usuario no encontrado.' });
  }

  const cambios = {};

  if (username !== undefined) {
    const errorUsername = validarUsername(username);
    if (errorUsername) return res.status(400).jsonp({ error: errorUsername });
    if (datoEnUso('username', username, req.usuario.id)) {
      return res.status(409).jsonp({ error: 'El nombre de usuario ya está en uso.', campo: 'username' });
    }
    cambios.username = username.trim();
  }

  if (email !== undefined) {
    if (!EMAIL_VALIDO.test(email)) return res.status(400).jsonp({ error: 'El email no es válido.' });
    if (datoEnUso('email', email, req.usuario.id)) {
      return res.status(409).jsonp({ error: 'El email ya está en uso.', campo: 'email' });
    }
    cambios.email = email.trim();
  }

  const nombreAnterior = usuario.value().username;
  const actualizado = usuario.assign(cambios).write();

  // Los comentarios guardan el nombre del autor: se actualizan para que no quede el nombre viejo.
  if (cambios.username && cambios.username !== nombreAnterior) {
    db.get('comentarios').filter(c => mismoId(c.usuarioId, actualizado.id)).each(c => { c.usuario = cambios.username; }).value();
    db.write();
  }

  return res.jsonp({ user: iniciarSesion(res, actualizado) });
});

// Comentarios: el autor es siempre el usuario de la sesión, y solo él puede editarlos o borrarlos.
server.use('/comentarios', (req, res, next) => {
  if (req.method === 'GET') return next();

  if (req.method === 'POST') {
    req.body = { ...req.body, usuarioId: req.usuario.id, usuario: req.usuario.username };
    return next();
  }

  const id = req.path.split('/')[1];
  const comentario = db.get('comentarios').find(c => mismoId(c.id, id)).value();
  if (comentario && !mismoId(comentario.usuarioId, req.usuario.id)) {
    return res.status(403).jsonp({ error: 'Solo podés modificar tus propios comentarios.' });
  }
  return next();
});

// Valoraciones: una por usuario y ciudad, con puntaje entero de 1 a 5.
server.use('/valoraciones', (req, res, next) => {
  if (req.method === 'GET') return next();

  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    const puntaje = Number(req.body && req.body.puntaje);
    if (req.method === 'POST' || req.body.puntaje !== undefined) {
      if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) {
        return res.status(400).jsonp({ error: 'La valoración tiene que ser un número entero de 1 a 5.' });
      }
      req.body.puntaje = puntaje;
    }
  }

  if (req.method === 'POST') {
    const { ciudad, paisId } = req.body || {};
    if (!ciudad || !paisId) {
      return res.status(400).jsonp({ error: 'Falta la ciudad o el país.' });
    }
    const existente = db.get('valoraciones')
      .find(v => v.ciudad === ciudad && mismoId(v.paisId, paisId) && mismoId(v.usuarioId, req.usuario.id))
      .value();
    if (existente) {
      return res.status(409).jsonp({ error: 'Ya valoraste esta ciudad.', id: existente.id });
    }
    req.body = { ciudad, paisId, puntaje: req.body.puntaje, usuarioId: req.usuario.id };
    return next();
  }

  const id = req.path.split('/')[1];
  const valoracion = db.get('valoraciones').find(v => mismoId(v.id, id)).value();
  if (valoracion && !mismoId(valoracion.usuarioId, req.usuario.id)) {
    return res.status(403).jsonp({ error: 'Solo podés modificar tu propia valoración.' });
  }
  if (req.body) {
    req.body = { puntaje: req.body.puntaje };
  }
  return next();
});

// ---------- Contraseñas ----------

server.use((req, res, next) => {
  const tienePassword =
    req.body && typeof req.body.password === 'string' && req.body.password.length > 0;

  if (!tienePassword) {
    return next();
  }

  const esRegistro = req.method === 'POST' && req.path === '/usuarios';
  const esUpdate =
    (req.method === 'PATCH' || req.method === 'PUT') && req.path.startsWith('/usuarios/');

  if ((esRegistro || esUpdate) && !req.body.password.startsWith('$2')) {
    req.body.password = bcrypt.hashSync(req.body.password, SALT_ROUNDS);
  }

  next();
});

router.render = (req, res) => {
  let data = res.locals.data;

  const quitarPassword = (usuario) => {
    if (usuario && typeof usuario === 'object' && 'password' in usuario) {
      const { password, ...resto } = usuario;
      return resto;
    }
    return usuario;
  };

  if (req.path.startsWith('/usuarios')) {
    data = Array.isArray(data) ? data.map(quitarPassword) : quitarPassword(data);
  }

  res.jsonp(data);
};

server.use(router);

server.listen(PORT, () => {
  console.log(`Backend propio corriendo en http://localhost:${PORT}`);
});
