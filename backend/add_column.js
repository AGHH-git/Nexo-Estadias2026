const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5432/estadias_db'
});

async function main() {
  try {
    console.log('Agregando columna requiere_cambio_password...');
    await pool.query('ALTER TABLE usuarios ADD COLUMN requiere_cambio_password BOOLEAN DEFAULT false;');
    console.log('Columna agregada.');
    
    console.log('Actualizando usuarios existentes a true...');
    await pool.query('UPDATE usuarios SET requiere_cambio_password = true;');
    console.log('Usuarios actualizados.');
    
  } catch (error) {
    if (error.code === '42701') {
      console.log('La columna ya existe.');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await pool.end();
  }
}

main();
