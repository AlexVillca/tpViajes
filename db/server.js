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

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).jsonp({ error: 'Email y contraseña son requeridos.' });
  }

  const user = db.get('usuarios').find({ email }).value();

  if (!user) {
    return res.status(404).jsonp({ error: 'Email no encontrado.' });
  }

  if (!bcrypt.compareSync(password, user.password || '')) {
    return res.status(401).jsonp({ error: 'Contraseña incorrecta.' });
  }

  const datosSesion = { id: user.id, username: user.username, email: user.email };
  const token = jwt.sign(datosSesion, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.jsonp({ token, user: datosSesion });
});

function requiereAuth(req) {
  const esMutacionUsuario =
    (req.method === 'PATCH' || req.method === 'PUT' || req.method === 'DELETE') &&
    req.path.startsWith('/usuarios/');
  const esMutacionComentario = req.method !== 'GET' && req.path.startsWith('/comentarios');
  return esMutacionUsuario || esMutacionComentario;
}

server.use((req, res, next) => {
  if (!requiereAuth(req)) {
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

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
