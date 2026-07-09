"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: 'postgresql://postgres:1234@localhost:5432/estadias_db'
});
async function run() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS jefes_carrera (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER REFERENCES usuarios(id) UNIQUE,
          nombre_completo VARCHAR(150),
          carrera VARCHAR(100)
      )
    `);
        const u = await pool.query("SELECT id FROM usuarios WHERE identificador = 'jefecarrera'");
        if (u.rows.length > 0) {
            await pool.query(`
        INSERT INTO jefes_carrera (usuario_id, nombre_completo, carrera) 
        VALUES ($1, $2, $3) 
        ON CONFLICT DO NOTHING
      `, [u.rows[0].id, 'Jefe de Sistemas', 'Ing. en Desarrollo y Gestión de Software']);
        }
        console.log('Tabla y jefe de carrera creados/verificados con exito');
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        pool.end();
    }
}
run();
