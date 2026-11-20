// Nombra (o saca) administrador a una cuenta. El rol nunca se cambia desde la app: solo con este script.
// Uso:  node db/hacer-admin.js <usuario o email>            -> la hace admin
//       node db/hacer-admin.js <usuario o email> --quitar   -> la vuelve usuario común
require('dotenv').config();
const mysql = require('mysql2/promise');
const { asegurarEsquema } = require('./esquema');

async function main() {
  const [identificador, opcion] = process.argv.slice(2);
  if (!identificador) {
    console.error('Uso: node db/hacer-admin.js <usuario o email> [--quitar]');
    process.exit(1);
  }
  const rol = opcion === '--quitar' ? 'usuario' : 'admin';
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'tpviajes',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tpviajes',
    charset: 'utf8mb4'
  });
  try {
    await asegurarEsquema(pool);
    const buscado = identificador.trim().toLowerCase();
    const [resultado] = await pool.query(
      'UPDATE usuarios SET rol = ? WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [rol, buscado, buscado]
    );
    if (resultado.affectedRows === 0) {
      console.error(`No existe ninguna cuenta "${identificador}".`);
      process.exitCode = 1;
    } else {
      console.log(`Listo: "${identificador}" ahora es ${rol}. Tiene que volver a iniciar sesión para verlo.`);
    }
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('No se pudo cambiar el rol:', error.message);
  process.exit(1);
});
