// ARCHIVO: backend/src/routes/alumno.routes.ts
import { Router } from 'express';
import { obtenerPerfil } from '../controllers/alumno.controller';
import { obtenerTramiteAlumno } from '../controllers/tramites.controller';
import { verificarToken, autorizarRoles } from '../middleware/auth.middleware';

const router = Router();

// Obtener perfil del alumno logueado (Protegida)
router.get('/perfil', verificarToken, autorizarRoles(['ALUMNO']), obtenerPerfil);

// Obtener el trámite de estadía activo del alumno (Protegida)
router.get('/tramite', verificarToken, autorizarRoles(['ALUMNO']), obtenerTramiteAlumno);

export default router;
