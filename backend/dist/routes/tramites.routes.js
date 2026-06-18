"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empresasRouter = exports.tramitesRouter = void 0;
// ARCHIVO: backend/src/routes/tramites.routes.ts
const express_1 = require("express");
const tramites_controller_1 = require("../controllers/tramites.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const tramitesRouter = (0, express_1.Router)();
exports.tramitesRouter = tramitesRouter;
const empresasRouter = (0, express_1.Router)();
exports.empresasRouter = empresasRouter;
// ==========================================
// Rutas de Trámites (/api/tramites)
// ==========================================
// Registrar nuevo trámite (Protegido para Alumnos)
tramitesRouter.post('/', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['ALUMNO']), upload_middleware_1.uploadPDF.fields([{ name: 'nss', maxCount: 1 }, { name: 'ine_tutor', maxCount: 1 }]), tramites_controller_1.crearTramite);
// Actualizar trámite existente (Protegido para Alumnos)
tramitesRouter.put('/:id', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['ALUMNO']), upload_middleware_1.uploadPDF.fields([{ name: 'nss', maxCount: 1 }, { name: 'ine_tutor', maxCount: 1 }]), tramites_controller_1.actualizarTramite);
// Subir PDF firmado de evidencia final (Protegido para Alumnos)
tramitesRouter.post('/:id/evidencia', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['ALUMNO']), upload_middleware_1.uploadPDF.single('evidencia'), tramites_controller_1.subirEvidencia);
// Descargar FODVI08-H prellenado en PDF (Protegido por Token)
tramitesRouter.get('/:id/pdf', auth_middleware_1.verificarToken, tramites_controller_1.descargarPDFPrefilled);
// ==========================================
// Rutas de Empresas (/api/empresas)
// ==========================================
// Buscar empresas en el padrón por término de búsqueda (Protegido por Token)
empresasRouter.get('/buscar', auth_middleware_1.verificarToken, tramites_controller_1.buscarEmpresas);
