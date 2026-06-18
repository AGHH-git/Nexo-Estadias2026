import { Router } from 'express';
import { 
  getVinculacionStats, 
  getJefeStats, 
  getMaestroStats,
  getMaestrosDisponibles,
  asignarMaestro,
  getTramiteMaestro,
  evaluarTramiteMaestro,
  aperturarPeriodo,
  getTramiteGlobal,
  getAlumnosJefe,
  getAlumnosVinculacion,
  getMaestrosConAlumnos,
  desasignarMaestro,
  asignarMaestroMasivo
} from '../controllers/admin.controller';
import { verificarToken, autorizarRoles } from '../middleware/auth.middleware';

const router = Router();

// Rutas protegidas por token y rol
router.get('/vinculacion/stats', verificarToken, autorizarRoles(['VINCULACION']), getVinculacionStats);
router.post('/vinculacion/periodo', verificarToken, autorizarRoles(['VINCULACION']), aperturarPeriodo);
router.get('/jefe/stats', verificarToken, autorizarRoles(['JEFE_CARRERA']), getJefeStats);
router.get('/maestro/stats', verificarToken, autorizarRoles(['MAESTRO']), getMaestroStats);

// Rutas para Jefe de Carrera
router.get('/jefe/maestros', verificarToken, autorizarRoles(['JEFE_CARRERA']), getMaestrosDisponibles);
router.post('/jefe/asignar', verificarToken, autorizarRoles(['JEFE_CARRERA']), asignarMaestro);
router.get('/jefe/alumnos', verificarToken, autorizarRoles(['JEFE_CARRERA']), getAlumnosJefe);
router.get('/jefe/asignaciones', verificarToken, autorizarRoles(['JEFE_CARRERA']), getMaestrosConAlumnos);
router.post('/jefe/desasignar', verificarToken, autorizarRoles(['JEFE_CARRERA']), desasignarMaestro);
router.post('/jefe/asignar-masivo', verificarToken, autorizarRoles(['JEFE_CARRERA']), asignarMaestroMasivo);

// Rutas para Vinculacion
router.get('/vinculacion/alumnos', verificarToken, autorizarRoles(['VINCULACION']), getAlumnosVinculacion);

// Ruta Global para ver el trámite (Jefe, Vinculacion, Maestro)
router.get('/tramite/:matricula', verificarToken, autorizarRoles(['JEFE_CARRERA', 'VINCULACION', 'MAESTRO']), getTramiteGlobal);

// Rutas para Maestro Asesor
router.get('/maestro/tramite/:matricula', verificarToken, autorizarRoles(['MAESTRO']), getTramiteMaestro);
router.post('/maestro/evaluar/:matricula', verificarToken, autorizarRoles(['MAESTRO']), evaluarTramiteMaestro);

export default router;

