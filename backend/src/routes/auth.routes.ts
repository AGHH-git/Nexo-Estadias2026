// ARCHIVO: backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { login, register, cambiarPassword, verificarGoogle, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

// Ruta pública para iniciar sesión
router.post('/login', login);

// Ruta pública para registrarse
router.post('/register', register);

// Ruta para verificar Google (requiere token inicial)
router.post('/verificar-google', verificarToken, verificarGoogle);

// Ruta para cambiar contraseña
router.post('/cambiar-password', verificarToken, cambiarPassword);

// Rutas para recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
