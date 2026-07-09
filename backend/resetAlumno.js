const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5432/estadias_db_real'
});

async function run() {
  const matricula = '20243L601013';
  try {
    // 1. Delete from historial_observaciones using tramite_id
    await pool.query(`
      DELETE FROM historial_observaciones 
      WHERE tramite_id IN (SELECT id FROM tramites_estadia WHERE matricula = $1)
    `, [matricula]);

    // 2. Delete the tramite
    await pool.query('DELETE FROM tramites_estadia WHERE matricula = $1', [matricula]);

    console.log(`Reset completado para la matrícula ${matricula}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}
run();
