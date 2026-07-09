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
  asignarMaestroMasivo,
  aprobarDocumento,
  cargarAlumnosMasivo,
  getUsuarios,
  crearUsuario,
  toggleEstadoUsuario
} from '../controllers/admin.controller';
import {
  getReporteStats,
  descargarReporteExcel,
  getReporteCarreras,
  getReportePeriodos,
  getReporteCategorias
} from '../controllers/reportes.controller';
import { getAuditoriaLogs } from '../controllers/auditoria.controller';
import { verificarToken, autorizarRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/vinculacion/auditoria', verificarToken, autorizarRoles(['VINCULACION']), getAuditoriaLogs);

router.get('/reportes/categorias', verificarToken, autorizarRoles(['VINCULACION', 'JEFE_CARRERA']), getReporteCategorias);
router.get('/reportes/stats', verificarToken, autorizarRoles(['VINCULACION', 'JEFE_CARRERA']), getReporteStats);
router.get('/reportes/excel', verificarToken, autorizarRoles(['VINCULACION', 'JEFE_CARRERA']), descargarReporteExcel);
router.get('/reportes/carreras', verificarToken, autorizarRoles(['VINCULACION', 'JEFE_CARRERA']), getReporteCarreras);
router.get('/reportes/periodos', verificarToken, autorizarRoles(['VINCULACION', 'JEFE_CARRERA']), getReportePeriodos);

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

// Rutas para aprobación de documento individual (Maestro y Jefe de Carrera)
router.post('/aprobar-documento', verificarToken, autorizarRoles(['MAESTRO', 'JEFE_CARRERA']), aprobarDocumento);

// ========================
// ADMINISTRACIÓN DE USUARIOS
// ========================

// Multer en memoria para carga masiva
import multer from 'multer';
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.post('/usuarios/cargar-alumnos', verificarToken, autorizarRoles(['VINCULACION']), uploadMemory.single('file'), cargarAlumnosMasivo);
router.get('/usuarios', verificarToken, autorizarRoles(['VINCULACION']), getUsuarios);
router.post('/usuarios', verificarToken, autorizarRoles(['VINCULACION']), crearUsuario);
router.put('/usuarios/:id/estado', verificarToken, autorizarRoles(['VINCULACION']), toggleEstadoUsuario);

export default router;


