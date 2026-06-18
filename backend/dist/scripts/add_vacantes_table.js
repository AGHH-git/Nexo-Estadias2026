"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function addVacantesTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS vacantes (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(200) NOT NULL,
      empresa_nombre VARCHAR(150) NOT NULL,
      descripcion TEXT NOT NULL,
      foto_url VARCHAR(255),
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        console.log('Creando tabla vacantes...');
        await database_1.pool.query(sql);
        console.log('Tabla vacantes creada exitosamente.');
    }
    catch (error) {
        console.error('Error creando tabla vacantes:', error);
    }
    finally {
        database_1.pool.end();
    }
}
addVacantesTable();
