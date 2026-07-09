"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config({ path: path_1.default.join(__dirname, '../../.env') });
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5433/estadias_db'
});
async function addColumn() {
    try {
        console.log('Agregando columna requiere_cambio_password...');
        await pool.query('ALTER TABLE usuarios ADD COLUMN requiere_cambio_password BOOLEAN DEFAULT false;');
        console.log('Columna agregada.');
        console.log('Actualizando usuarios existentes a true...');
        await pool.query('UPDATE usuarios SET requiere_cambio_password = true;');
        console.log('Usuarios actualizados.');
    }
    catch (error) {
        if (error.code === '42701') {
            console.log('La columna ya existe.');
        }
        else {
            console.error('Error:', error);
        }
    }
}
async function checkUsers() {
    console.log("Creando usuarios simulados si no existen...");
    await pool.query(`
    INSERT INTO usuarios (identificador, password_hash, rol, activo) VALUES 
    ('vinculacion', '$2b$10$PLACEHOLDER_HASH', 'VINCULACION', true),
    ('jefecarrera', '$2b$10$PLACEHOLDER_HASH', 'JEFE_CARRERA', true),
    ('maestro1', '$2b$10$PLACEHOLDER_HASH', 'MAESTRO', true)
    ON CONFLICT (identificador) DO NOTHING;
  `);
    const res = await pool.query("SELECT identificador, rol FROM usuarios WHERE rol IN ('VINCULACION', 'JEFE_CARRERA', 'MAESTRO')");
    console.log("Usuarios administradores actuales:");
    console.table(res.rows);
}
async function fixJefe() {
    await pool.query("UPDATE jefes_carrera SET carrera = 'Ing. en Desarrollo y Gestión de Software' WHERE nombre_completo = 'Jefe de Sistemas'");
    console.log('Jefe carrera updated');
}
async function testDb() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM alumnos');
        console.log('Total alumnos:', res.rows[0].count);
        const res2 = await pool.query('SELECT carrera, COUNT(*) FROM alumnos GROUP BY carrera');
        console.log('Alumnos por carrera:', res2.rows);
        const res3 = await pool.query('SELECT carrera FROM jefes_carrera');
        console.log('Carreras de jefes:', res3.rows);
    }
    catch (error) {
        console.error('Error:', error);
    }
}
async function addRechazosColumns() {
    try {
        console.log('Agregando columnas nss_rechazado e ine_tutor_rechazado a tramites_estadia...');
        await pool.query(`
      ALTER TABLE tramites_estadia 
      ADD COLUMN IF NOT EXISTS nss_rechazado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS ine_tutor_rechazado BOOLEAN DEFAULT false;
    `);
        console.log('Columnas agregadas exitosamente.');
    }
    catch (error) {
        console.error('Error agregando columnas:', error);
    }
}
async function main() {
    const arg = process.argv[2];
    try {
        if (arg === 'add-column')
            await addColumn();
        else if (arg === 'add-rechazos')
            await addRechazosColumns();
        else if (arg === 'check-users')
            await checkUsers();
        else if (arg === 'fix-jefe')
            await fixJefe();
        else if (arg === 'test-db')
            await testDb();
        else {
            console.log('Comandos disponibles: add-column, add-rechazos, check-users, fix-jefe, test-db');
        }
    }
    finally {
        await pool.end();
    }
}
if (require.main === module) {
    main();
}
