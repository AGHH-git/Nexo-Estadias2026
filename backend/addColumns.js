const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5432/estadias_db_real'
});

async function run() {
  try {
    const query = `
      ALTER TABLE tramites_estadia
      ADD COLUMN IF NOT EXISTS linea_investigacion character varying(255),
      ADD COLUMN IF NOT EXISTS area_empresa character varying(255),
      ADD COLUMN IF NOT EXISTS eval_parcial date,
      ADD COLUMN IF NOT EXISTS eval_final date,
      ADD COLUMN IF NOT EXISTS seguimiento_alumno character varying(255),
      ADD COLUMN IF NOT EXISTS seguimiento_dias character varying(255),
      ADD COLUMN IF NOT EXISTS contacto_asesor character varying(255),
      ADD COLUMN IF NOT EXISTS contacto_dias character varying(255);
    `;
    await pool.query(query);
    console.log('Columnas agregadas con éxito');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}
run();
