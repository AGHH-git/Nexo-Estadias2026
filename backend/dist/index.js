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
// ARCHIVO: backend/src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const alumno_routes_1 = __importDefault(require("./routes/alumno.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const tramites_routes_1 = require("./routes/tramites.routes");
const vacantes_routes_1 = __importDefault(require("./routes/vacantes.routes"));
const database_1 = require("./config/database");
// Cargar variables de entorno
dotenv.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Configurar CORS para permitir peticiones desde el frontend (React/Vite en 4200 o 5173)
const allowedOrigins = ['http://localhost:4200', 'http://localhost:5173', 'http://127.0.0.1:4200', 'http://127.0.0.1:5173'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(null, true); // Permitir otros para desarrollo local si es necesario, o restringir: callback(new Error('No permitido por CORS'))
        }
    },
    credentials: true
}));
// Middlewares para parsear cuerpos de petición
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Servir la carpeta de almacenamiento de archivos (NSS y Evidencias) de manera estática y segura
const storagePath = path.join(__dirname, '../storage');
if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
}
app.use('/storage', express_1.default.static(storagePath));
// Probar conexión a la base de datos
database_1.pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('ERROR CRÍTICO: No se pudo conectar a la base de datos PostgreSQL:', err.message);
    }
    else {
        console.log('Conexión exitosa a PostgreSQL realizada el:', res.rows[0].now);
    }
});
// Rutas de la API
app.use('/api/auth', auth_routes_1.default);
app.use('/api/alumno', alumno_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/tramites', tramites_routes_1.tramitesRouter);
app.use('/api/empresas', tramites_routes_1.empresasRouter);
app.use('/api/vacantes', vacantes_routes_1.default);
// Ruta de diagnóstico simple
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});
// Middleware global de manejo de errores (e.g. Multer, errores de validación, etc.)
app.use((err, req, res, next) => {
    console.error('Error no controlado en la aplicación:', err);
    if (err instanceof Error) {
        return res.status(err.message.includes('PDF') ? 400 : 500).json({
            mensaje: err.message || 'Ocurrió un error inesperado en el servidor.'
        });
    }
    return res.status(500).json({
        mensaje: 'Ocurrió un error inesperado en el servidor.'
    });
});
// Iniciar servidor Express
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` Servidor de Estadías UTCV corriendo en puerto ${PORT}`);
    console.log(` Entorno: ${process.env.NODE_ENV || 'desarrollo'}`);
    console.log(`===================================================`);
});
