"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCHIVO: backend/src/routes/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Ruta pública para iniciar sesión
router.post('/login', auth_controller_1.login);
// Ruta pública para registrarse
router.post('/register', auth_controller_1.register);
// Ruta para verificar Google (requiere token inicial)
router.post('/verificar-google', auth_middleware_1.verificarToken, auth_controller_1.verificarGoogle);
// Ruta para cambiar contraseña
router.post('/cambiar-password', auth_middleware_1.verificarToken, auth_controller_1.cambiarPassword);
exports.default = router;
