import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5433/estadias_db'
});
async function run() {
  await pool.query("UPDATE jefes_carrera SET carrera = 'Ing. en Desarrollo y Gestión de Software' WHERE nombre_completo = 'Jefe de Sistemas'");
  console.log('Jefe carrera updated');
  pool.end();
}
run();
