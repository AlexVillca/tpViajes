// ============================================================
// Tests del backend. Usan el corredor de tests que trae Node (node:test), sin dependencias extra.
// Importan la app de db/server.js sin arrancarla y reemplazan pool.query por una base falsa
// en memoria: así se prueban las reglas de la API sin necesitar MySQL.
// Se corren con: npm run test:backend
// ============================================================
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// El servidor no arranca sin un secreto propio; para los tests alcanza uno inventado.
process.env.JWT_SECRET = 'secreto-solo-para-los-tests-' + 'x'.repeat(40);
const { app, pool } = require('../server');

let servidor;
let base;
let consultas = [];

before(async () => {
  servidor = app.listen(0, '127.0.0.1');
  await new Promise(listo => servidor.once('listening', listo));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor.close();
  await pool.end();
});

/** Reemplaza la base: cada consulta queda anotada y la responde la función que recibe el test. */
function baseFalsa(responder) {
  consultas = [];
  pool.query = async (sql, params = []) => {
    consultas.push({ sql, params });
    return responder(sql, params);
  };
}

async function pedir(metodo, ruta, cuerpo, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const respuesta = await fetch(base + ruta, { method: metodo, headers, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  return { status: respuesta.status, cuerpo: respuesta.status === 204 ? null : await respuesta.json() };
}

// ---------- Registro: dos pedidos iguales a la vez ----------

/**
 * Simula lo que pasa con un doble clic: los dos pedidos consultan si el dato está en uso antes de
 * que el primero lo guarde, así que los dos ven "libre". El INSERT aplica el índice único como MySQL:
 * el primero entra y el segundo falla con ER_DUP_ENTRY.
 */
function baseConIndiceUnico(indice, campo) {
  const guardados = new Map();
  const vistos = new Set();
  baseFalsa((sql, params) => {
    if (sql.startsWith('SELECT id FROM usuarios')) return [[]];
    if (sql.startsWith('INSERT INTO usuarios')) {
      const [id, username, email] = params;
      const valor = campo === 'email' ? email : username;
      if (vistos.has(valor)) {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        error.sqlMessage = `Duplicate entry '${valor}' for key 'usuarios.${indice}'`;
        throw error;
      }
      vistos.add(valor);
      guardados.set(id, { id, username, email, mejor_puntaje: 0, listas_favs: '[]' });
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('SELECT * FROM usuarios WHERE id = ?')) return [[guardados.get(params[0])].filter(Boolean)];
    throw new Error(`Consulta no prevista: ${sql}`);
  });
}

test('registro: con un doble clic se crea una sola cuenta y el segundo pedido recibe 409 "email en uso"', async () => {
  baseConIndiceUnico('uq_usuarios_email', 'email');
  const datos = { username: 'viajero', email: 'repetido@mail.com', password: 'clave-segura' };

  const respuestas = await Promise.all([pedir('POST', '/usuarios', datos), pedir('POST', '/usuarios', datos)]);

  assert.deepEqual(respuestas.map(r => r.status).sort(), [201, 409]);
  const rechazado = respuestas.find(r => r.status === 409);
  assert.deepEqual(rechazado.cuerpo, { error: 'El email ya está en uso.', campo: 'email' });
});

test('registro: si lo que se repite es el nombre de usuario, el 409 lo indica en ese campo', async () => {
  baseConIndiceUnico('uq_usuarios_username', 'username');

  const respuestas = await Promise.all([
    pedir('POST', '/usuarios', { username: 'viajero', email: 'uno@mail.com', password: 'clave-segura' }),
    pedir('POST', '/usuarios', { username: 'viajero', email: 'dos@mail.com', password: 'clave-segura' })
  ]);

  assert.deepEqual(respuestas.map(r => r.status).sort(), [201, 409]);
  assert.equal(respuestas.find(r => r.status === 409).cuerpo.campo, 'username');
});

// ---------- Límite de intentos del login ----------

function baseConCuenta(cuenta) {
  baseFalsa((sql, params) => {
    if (sql.startsWith('SELECT * FROM usuarios WHERE LOWER(email) = ? OR LOWER(username) = ?')) {
      const existe = params.includes(cuenta.email) || params.includes(cuenta.username);
      return [existe ? [cuenta] : []];
    }
    throw new Error(`Consulta no prevista: ${sql}`);
  });
}

test('login: los intentos fallidos con el usuario y con el email suman al mismo contador de la cuenta', async () => {
  const cuenta = { id: 'cuenta-1', username: 'viajera', email: 'viajera@mail.com', password: bcrypt.hashSync('clave-correcta', 4), rol: 'usuario' };
  baseConCuenta(cuenta);

  for (let i = 0; i < 5; i++) {
    assert.equal((await pedir('POST', '/login', { usuario: 'viajera', password: 'mala' })).status, 401);
  }
  for (let i = 0; i < 5; i++) {
    assert.equal((await pedir('POST', '/login', { usuario: 'Viajera@Mail.com', password: 'mala' })).status, 401);
  }

  // Ya van 10 fallos de la misma cuenta: queda frenada aunque ahora la contraseña sea la correcta.
  const frenado = await pedir('POST', '/login', { usuario: 'viajera', password: 'clave-correcta' });
  assert.equal(frenado.status, 429);
});

test('login: con una cuenta que no existe se cuenta por el texto escrito', async () => {
  const cuenta = { id: 'cuenta-2', username: 'otra', email: 'otra@mail.com', password: bcrypt.hashSync('clave-correcta', 4), rol: 'usuario' };
  baseConCuenta(cuenta);

  for (let i = 0; i < 10; i++) {
    assert.equal((await pedir('POST', '/login', { usuario: 'nadie', password: 'mala' })).status, 401);
  }

  assert.equal((await pedir('POST', '/login', { usuario: 'nadie', password: 'mala' })).status, 429);
  // Los fallos de "nadie" no frenan a otra cuenta.
  assert.equal((await pedir('POST', '/login', { usuario: 'otra', password: 'clave-correcta' })).status, 200);
});

// ---------- Comentarios por país ----------

const token = jwt.sign({ id: 'cuenta-1', username: 'viajera', email: 'viajera@mail.com', rol: 'usuario' }, process.env.JWT_SECRET);

test('comentarios: se piden por país y ciudad, porque dos países pueden tener una ciudad con el mismo nombre', async () => {
  baseFalsa((sql) => {
    if (sql.startsWith('SELECT * FROM comentarios')) {
      return [[{ id: 'c1', mensaje: 'Hermosa', ciudad: 'Córdoba', pais_id: 'ar', usuario_id: 'cuenta-1', usuario: 'viajera' }]];
    }
    throw new Error(`Consulta no prevista: ${sql}`);
  });

  const respuesta = await pedir('GET', `/comentarios?paisId=ar&ciudad=${encodeURIComponent('Córdoba')}`);

  assert.equal(respuesta.status, 200);
  assert.equal(consultas[0].sql, 'SELECT * FROM comentarios WHERE pais_id = ? AND ciudad = ? ORDER BY created_at ASC');
  assert.deepEqual(consultas[0].params, ['ar', 'Córdoba']);
  assert.equal(respuesta.cuerpo[0].paisId, 'ar');
});

test('comentarios: no se puede publicar un comentario sin el país', async () => {
  baseFalsa((sql) => { throw new Error(`Consulta no prevista: ${sql}`); });

  const respuesta = await pedir('POST', '/comentarios', { mensaje: 'Hermosa', ciudad: 'Córdoba' }, token);

  assert.equal(respuesta.status, 400);
  assert.equal(consultas.length, 0);
});

test('comentarios: el comentario nuevo se guarda con su país', async () => {
  let guardado;
  baseFalsa((sql, params) => {
    if (sql.startsWith('INSERT INTO comentarios')) {
      const [id, paisId, ciudad, usuarioId, usuario, mensaje] = params;
      guardado = { id, pais_id: paisId, ciudad, usuario_id: usuarioId, usuario, mensaje };
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('SELECT * FROM comentarios WHERE id = ?')) return [[guardado]];
    throw new Error(`Consulta no prevista: ${sql}`);
  });

  const respuesta = await pedir('POST', '/comentarios', { mensaje: 'Hermosa', ciudad: 'Córdoba', paisId: 'es' }, token);

  assert.equal(respuesta.status, 201);
  assert.equal(guardado.pais_id, 'es');
  assert.equal(respuesta.cuerpo.paisId, 'es');
});
