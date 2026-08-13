const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'db.json');
const SALT_ROUNDS = 10;

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
let hasheadas = 0;

db.usuarios = (db.usuarios || []).map((usuario) => {
  if (usuario.password && !usuario.password.startsWith('$2')) {
    usuario.password = bcrypt.hashSync(usuario.password, SALT_ROUNDS);
    hasheadas++;
  }
  return usuario;
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Contraseñas hasheadas: ${hasheadas}`);
