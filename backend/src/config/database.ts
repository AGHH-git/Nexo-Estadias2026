// ARCHIVO: backend/src/config/database.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Creamos un Pool de conexiones a PostgreSQL
// Utiliza la variable DATABASE_URL si existe (ideal para Docker) o variables individuales
const databaseUrl = process.env.DATABASE_URL;

export const pool = new Pool(
  databaseUrl
    ? { connectionString: databaseUrl }
    : {
        user: process.env.DB_USER || 'user_nexus',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'Estadias2026',
        password: process.env.DB_PASSWORD || 'password_nexus',
        port: parseInt(process.env.DB_PORT || '5435', 10),
      }
);

// Manejo de errores en la conexión del Pool
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente del Pool de base de datos:', err);
});

// Función auxiliar para ejecutar consultas de forma sencilla
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
