import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5433/estadias_db'
});

async function run() {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM alumnos');
    console.log('Total alumnos:', res.rows[0].count);

    const res2 = await pool.query('SELECT carrera, COUNT(*) FROM alumnos GROUP BY carrera');
    console.log('Alumnos por carrera:', res2.rows);

    const res3 = await pool.query('SELECT carrera FROM jefes_carrera');
    console.log('Carreras de jefes:', res3.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

run();
