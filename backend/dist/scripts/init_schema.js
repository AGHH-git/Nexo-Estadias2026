"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function init() {
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
      CREATE TYPE estatus_tramite AS ENUM ('Borrador', 'En Revisión Digital', 'Rechazado Digital', 'Aprobado para Firmas', 'Completado');
      CREATE TYPE roles_usuario AS ENUM ('ALUMNO', 'MAESTRO', 'JEFE_CARRERA', 'VINCULACION');
    `).catch(() => console.log('Enums ya existen'));
        await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        identificador VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol roles_usuario NOT NULL,
        activo BOOLEAN DEFAULT true,
        requiere_cambio_password BOOLEAN DEFAULT true,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS alumnos (
        matricula VARCHAR(20) PRIMARY KEY,
        usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id),
        nombre_completo VARCHAR(150) NOT NULL,
        carrera VARCHAR(100) NOT NULL,
        campus VARCHAR(50) DEFAULT 'Cuitláhuac',
        sistema VARCHAR(50) DEFAULT 'Escolarizado',
        nss VARCHAR(20),
        telefono VARCHAR(15)
      );

      CREATE TABLE IF NOT EXISTS maestros (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id),
        nombre_completo VARCHAR(150) NOT NULL,
        area_adscripcion VARCHAR(100) NOT NULL,
        cargo VARCHAR(50) NOT NULL,
        telefono VARCHAR(15),
        extension VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS empresas (
        id SERIAL PRIMARY KEY,
        razon_social VARCHAR(150) NOT NULL,
        nombre_comercial VARCHAR(150),
        rfc VARCHAR(15) UNIQUE,
        fecha_constitucion DATE NOT NULL,
        giro VARCHAR(50) NOT NULL,
        tamano VARCHAR(20) NOT NULL,
        tipo_empresa VARCHAR(20) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        municipio VARCHAR(50) NOT NULL,
        cp VARCHAR(10) NOT NULL,
        domicilio TEXT NOT NULL,
        telefono VARCHAR(15)
      );

      CREATE TABLE IF NOT EXISTS periodos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        anio INTEGER NOT NULL,
        activo BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS tramites_estadia (
        id SERIAL PRIMARY KEY,
        matricula VARCHAR(20) REFERENCES alumnos(matricula),
        empresa_id INTEGER REFERENCES empresas(id),
        maestro_id INTEGER REFERENCES maestros(id),
        periodo_id INTEGER REFERENCES periodos(id),
        asesor_ind_nombre VARCHAR(150),
        asesor_ind_cargo VARCHAR(100),
        asesor_ind_telefono VARCHAR(15),
        asesor_ind_email VARCHAR(100),
        nivel_academico VARCHAR(10),
        titulo_proyecto VARCHAR(200),
        problematica TEXT,
        alcance VARCHAR(50),
        producto_generar TEXT,
        horario_alumno TEXT,
        fecha_inicio DATE,
        fecha_termino DATE,
        estatus estatus_tramite DEFAULT 'Borrador',
        ruta_nss VARCHAR(255),
        ruta_evidencia VARCHAR(255),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modalidad_estadia VARCHAR(50) DEFAULT 'Local',
        ruta_ine_tutor VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS historial_observaciones (
        id SERIAL PRIMARY KEY,
        tramite_id INTEGER REFERENCES tramites_estadia(id),
        maestro_id INTEGER REFERENCES maestros(id),
        comentarios TEXT NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS logs_auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        accion VARCHAR(100) NOT NULL,
        detalles TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS vacantes (
        id SERIAL PRIMARY KEY,
        empresa VARCHAR(150) NOT NULL,
        puesto VARCHAR(150) NOT NULL,
        descripcion TEXT NOT NULL,
        requisitos TEXT NOT NULL,
        modalidad VARCHAR(50) NOT NULL,
        ubicacion VARCHAR(150) NOT NULL,
        fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activa BOOLEAN DEFAULT true,
        imagen_ruta VARCHAR(255)
      );
    `);
        // Crear un alumno de prueba
        const hash = await bcrypt_1.default.hash('123456', 10);
        const userResult = await client.query(`
      INSERT INTO usuarios (identificador, password_hash, rol, requiere_cambio_password)
      VALUES ('20260001', $1, 'ALUMNO', true)
      ON CONFLICT (identificador) DO NOTHING
      RETURNING id
    `, [hash]);
        if (userResult.rows.length > 0) {
            await client.query(`
        INSERT INTO alumnos (matricula, usuario_id, nombre_completo, carrera)
        VALUES ('20260001', $1, 'Alumno de Prueba', 'Ingeniería en Desarrollo de Software')
        ON CONFLICT (matricula) DO NOTHING
      `, [userResult.rows[0].id]);
        }
        await client.query('COMMIT');
        console.log('Base de datos inicializada correctamente.');
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Error inicializando DB:', err);
    }
    finally {
        client.release();
        process.exit(0);
    }
}
init();
