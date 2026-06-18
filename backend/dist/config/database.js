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
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
// ARCHIVO: backend/src/config/database.ts
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Creamos un Pool de conexiones a PostgreSQL
// Utiliza la variable DATABASE_URL si existe (ideal para Docker) o variables individuales
const databaseUrl = process.env.DATABASE_URL;
exports.pool = new pg_1.Pool(databaseUrl
    ? { connectionString: databaseUrl }
    : {
        user: process.env.DB_USER || 'user_nexus',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'Estadias2026',
        password: process.env.DB_PASSWORD || 'password_nexus',
        port: parseInt(process.env.DB_PORT || '5435', 10),
    });
// Manejo de errores en la conexión del Pool
exports.pool.on('error', (err) => {
    console.error('Error inesperado en el cliente del Pool de base de datos:', err);
});
// Función auxiliar para ejecutar consultas de forma sencilla
const query = (text, params) => {
    return exports.pool.query(text, params);
};
exports.query = query;
