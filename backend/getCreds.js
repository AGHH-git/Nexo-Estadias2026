const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5433/estadias_db'
});

async function getCreds() {
  try {
    const res = await pool.query("SELECT correo, rol FROM usuarios WHERE rol = 'alumno' LIMIT 1;");
    const res2 = await pool.query("SELECT correo, rol FROM usuarios WHERE rol = 'maestro' LIMIT 1;");
    const res3 = await pool.query("SELECT correo, rol FROM usuarios WHERE rol = 'jefe_carrera' LIMIT 1;");
    console.log(res.rows[0]);
    console.log(res2.rows[0]);
    console.log(res3.rows[0]);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
getCreds();
