"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Rutas protegidas por token y rol
router.get('/vinculacion/stats', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['VINCULACION']), admin_controller_1.getVinculacionStats);
router.post('/vinculacion/periodo', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['VINCULACION']), admin_controller_1.aperturarPeriodo);
router.get('/jefe/stats', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['JEFE_CARRERA']), admin_controller_1.getJefeStats);
router.get('/maestro/stats', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['MAESTRO']), admin_controller_1.getMaestroStats);
// Rutas para Jefe de Carrera
router.get('/jefe/maestros', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['JEFE_CARRERA']), admin_controller_1.getMaestrosDisponibles);
router.post('/jefe/asignar', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['JEFE_CARRERA']), admin_controller_1.asignarMaestro);
router.get('/jefe/alumnos', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['JEFE_CARRERA']), admin_controller_1.getAlumnosJefe);
// Rutas para Vinculacion
router.get('/vinculacion/alumnos', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['VINCULACION']), admin_controller_1.getAlumnosVinculacion);
// Ruta Global para ver el trámite (Jefe, Vinculacion, Maestro)
router.get('/tramite/:matricula', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['JEFE_CARRERA', 'VINCULACION', 'MAESTRO']), admin_controller_1.getTramiteGlobal);
// Rutas para Maestro Asesor
router.get('/maestro/tramite/:matricula', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['MAESTRO']), admin_controller_1.getTramiteMaestro);
router.post('/maestro/evaluar/:matricula', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['MAESTRO']), admin_controller_1.evaluarTramiteMaestro);
exports.default = router;
