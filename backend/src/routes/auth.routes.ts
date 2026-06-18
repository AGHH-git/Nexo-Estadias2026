// ARCHIVO: backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { login, register, cambiarPassword } from '../controllers/auth.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

// Ruta pública para iniciar sesión
router.post('/login', login);

// Ruta pública para registrarse
router.post('/register', register);

// Ruta para cambiar contraseña
router.post('/cambiar-password', verificarToken, cambiarPassword);

export default router;
