"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCHIVO: backend/src/routes/alumno.routes.ts
const express_1 = require("express");
const alumno_controller_1 = require("../controllers/alumno.controller");
const tramites_controller_1 = require("../controllers/tramites.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Obtener perfil del alumno logueado (Protegida)
router.get('/perfil', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['ALUMNO']), alumno_controller_1.obtenerPerfil);
// Obtener el trámite de estadía activo del alumno (Protegida)
router.get('/tramite', auth_middleware_1.verificarToken, (0, auth_middleware_1.autorizarRoles)(['ALUMNO']), tramites_controller_1.obtenerTramiteAlumno);
exports.default = router;
