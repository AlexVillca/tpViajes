// ============================================================
// Cambios de esquema que necesita el panel de administración.
// Se aplican al arrancar y se pueden correr muchas veces: si ya están, no hacen nada.
// ============================================================

async function columnaExiste(pool, tabla, columna) {
  const [filas] = await pool.query(
    'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [tabla, columna]
  );
  return Number(filas[0].n) > 0;
}

async function asegurarEsquema(pool) {
  // Rol de cada cuenta. Todas arrancan como "usuario"; el admin se nombra con db/hacer-admin.js.
  if (!(await columnaExiste(pool, 'usuarios', 'rol'))) {
    await pool.query("ALTER TABLE usuarios ADD COLUMN rol VARCHAR(10) NOT NULL DEFAULT 'usuario'");
  }
  // Registro de lo que hace cada admin (qué cambió, sobre qué y cuándo).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_registro (
      id CHAR(36) NOT NULL PRIMARY KEY,
      usuario_id VARCHAR(64) NOT NULL,
      usuario VARCHAR(40) NOT NULL,
      accion VARCHAR(40) NOT NULL,
      objetivo VARCHAR(255) NOT NULL,
      detalle JSON NULL,
      fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_admin_registro_fecha (fecha)
    ) CHARACTER SET utf8mb4
  `);
}

module.exports = { asegurarEsquema };
