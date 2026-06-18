// ARCHIVO: backend/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import alumnoRoutes from './routes/alumno.routes';
import adminRoutes from './routes/admin.routes';
import { tramitesRouter, empresasRouter } from './routes/tramites.routes';
import vacantesRoutes from './routes/vacantes.routes';
import { pool } from './config/database';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS para permitir peticiones desde el frontend (React/Vite en 4200 o 5173)
const allowedOrigins = ['http://localhost:4200', 'http://localhost:5173', 'http://127.0.0.1:4200', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir otros para desarrollo local si es necesario, o restringir: callback(new Error('No permitido por CORS'))
    }
  },
  credentials: true
}));

// Middlewares para parsear cuerpos de petición
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la carpeta de almacenamiento de archivos (NSS y Evidencias) de manera estática y segura
const storagePath = path.join(__dirname, '../storage');
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}
app.use('/storage', express.static(storagePath));

// Probar conexión a la base de datos
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('ERROR CRÍTICO: No se pudo conectar a la base de datos PostgreSQL:', err.message);
  } else {
    console.log('Conexión exitosa a PostgreSQL realizada el:', res.rows[0].now);
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/alumno', alumnoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tramites', tramitesRouter);
app.use('/api/empresas', empresasRouter);
app.use('/api/vacantes', vacantesRoutes);

// Ruta de diagnóstico simple
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Middleware global de manejo de errores (e.g. Multer, errores de validación, etc.)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
