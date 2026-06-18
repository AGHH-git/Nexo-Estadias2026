import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5432/estadias_db'
});

async function run() {
  console.log("Creando usuarios simulados si no existen...");
  await pool.query(`
    INSERT INTO usuarios (identificador, password_hash, rol, activo) VALUES 
    ('vinculacion', '$2b$10$PLACEHOLDER_HASH', 'VINCULACION', true),
    ('jefecarrera', '$2b$10$PLACEHOLDER_HASH', 'JEFE_CARRERA', true),
    ('maestro1', '$2b$10$PLACEHOLDER_HASH', 'MAESTRO', true)
    ON CONFLICT (identificador) DO NOTHING;
  `);
  const res2 = await pool.query("SELECT identificador, rol FROM usuarios WHERE rol IN ('VINCULACION', 'JEFE_CARRERA', 'MAESTRO')");
  console.log("Usuarios administradores actuales:");
  console.table(res2.rows);
  
  pool.end();
}

run();
