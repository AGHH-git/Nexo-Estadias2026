"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarGoogle = exports.cambiarPassword = exports.register = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const google_auth_library_1 = require("google-auth-library");
const JWT_SECRET = process.env.JWT_SECRET || 'utcv_super_secret_token_key_2026';
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const login = async (req, res) => {
    const { identificador, password } = req.body;
    // Validación de campos obligatorios
    if (!identificador || !password) {
        return res.status(400).json({ mensaje: 'Por favor, ingresa el identificador y la contraseña.' });
    }
    try {
        // Si el identificador es un correo institucional (ej. 74@utcv.edu.mx), extraer la matrícula
        let identificadorLimpio = identificador.trim();
        if (identificadorLimpio.toLowerCase().endsWith('@utcv.edu.mx')) {
            identificadorLimpio = identificadorLimpio.split('@')[0];
        }
        // Buscar el usuario en la base de datos por el identificador original o por la matrícula limpia (insensible a mayúsculas)
        const userQuery = 'SELECT id, identificador, password_hash, rol, activo, requiere_cambio_password FROM usuarios WHERE LOWER(identificador) = LOWER($1) OR LOWER(identificador) = LOWER($2)';
        const userResult = await database_1.pool.query(userQuery, [identificador.trim(), identificadorLimpio]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
        }
        const usuario = userResult.rows[0];
        // Verificar la contraseña (con soporte para el placeholder de prueba '123456' y texto plano)
        let esPasswordValido = false;
        if (usuario.password_hash === '$2b$10$PLACEHOLDER_HASH') {
            if (password === '123456') {
                esPasswordValido = true;
            }
        }
        else if (usuario.password_hash === password) {
            esPasswordValido = true;
        }
        else {
            try {
                esPasswordValido = await bcrypt_1.default.compare(password, usuario.password_hash);
            }
            catch (err) {
                esPasswordValido = false;
            }
        }
        if (!esPasswordValido) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
        }
        // Obtener el nombre del usuario dependiendo de su rol
        let nombre = 'Usuario UTCV';
        if (usuario.rol === 'ALUMNO') {
            const alumnoResult = await database_1.pool.query('SELECT nombre_completo FROM alumnos WHERE usuario_id = $1', [usuario.id]);
            if (alumnoResult.rows.length > 0) {
                nombre = alumnoResult.rows[0].nombre_completo;
            }
        }
        else {
            const maestroResult = await database_1.pool.query('SELECT nombre_completo FROM maestros WHERE usuario_id = $1', [usuario.id]);
            if (maestroResult.rows.length > 0) {
                nombre = maestroResult.rows[0].nombre_completo;
            }
        }
        // Si el usuario estaba registrado como inactivo (no ha entrado nunca), activarlo
        if (!usuario.activo) {
            await database_1.pool.query('UPDATE usuarios SET activo = true WHERE id = $1', [usuario.id]);
        }
        // Generar el token JWT (validez de 8 horas)
        const token = jsonwebtoken_1.default.sign({
            id: usuario.id,
            rol: usuario.rol,
            identificador: usuario.identificador,
        }, JWT_SECRET, { expiresIn: '8h' });
        // Registrar acción en la auditoría
        await database_1.pool.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuario.id, 'LOGIN', `Inicio de sesión exitoso desde CLI/Web. Rol: ${usuario.rol}. Activación: ${!usuario.activo}`]);
        return res.status(200).json({
            token,
            rol: usuario.rol,
            nombre,
            requiereCambioPassword: usuario.requiere_cambio_password,
        });
    }
    catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor al iniciar sesión.' });
    }
};
exports.login = login;
const register = async (req, res) => {
    const { identificador, password, matricula, nombre_completo, carrera, campus, sistema, nss, telefono } = req.body;
    // Validación de campos obligatorios
    if (!identificador || !password || !matricula || !nombre_completo || !carrera) {
        return res.status(400).json({ mensaje: 'Por favor, completa todos los campos obligatorios.' });
    }
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Verificar si el identificador (correo/usuario) ya existe
        const existUser = await client.query('SELECT id FROM usuarios WHERE identificador = $1', [identificador]);
        if (existUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ mensaje: 'El correo/identificador ya está registrado.' });
        }
        // Verificar si la matrícula ya existe
        const existAlumno = await client.query('SELECT matricula FROM alumnos WHERE matricula = $1', [matricula]);
        if (existAlumno.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ mensaje: 'La matrícula ya está registrada.' });
        }
        // Hash de la contraseña
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Insertar en usuarios (rol ALUMNO por defecto para registro público)
        const userInsertQuery = `
      INSERT INTO usuarios (identificador, password_hash, rol)
      VALUES ($1, $2, 'ALUMNO')
      RETURNING id
    `;
        const userResult = await client.query(userInsertQuery, [identificador, passwordHash]);
        const usuarioId = userResult.rows[0].id;
        // Insertar en alumnos
        const alumnoInsertQuery = `
      INSERT INTO alumnos (matricula, usuario_id, nombre_completo, carrera, campus, sistema, nss, telefono)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
        await client.query(alumnoInsertQuery, [
            matricula,
            usuarioId,
            nombre_completo,
            carrera,
            campus || null,
            sistema || null,
            nss || null,
            telefono || null
        ]);
        // Registrar en auditoría
        await client.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuarioId, 'REGISTRO', `Registro exitoso de alumno. Matrícula: ${matricula}`]);
        await client.query('COMMIT');
        return res.status(201).json({ mensaje: 'Registro completado con éxito. Ya puedes iniciar sesión.' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en el registro:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor al procesar el registro.' });
    }
    finally {
        client.release();
    }
};
exports.register = register;
const cambiarPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const usuarioId = req.usuario.id;
    const isGoogleVerificado = req.usuario.googleVerificado;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ mensaje: 'Por favor, completa todos los campos.' });
    }
    try {
        const userResult = await database_1.pool.query('SELECT password_hash, requiere_cambio_password FROM usuarios WHERE id = $1', [usuarioId]);
        if (userResult.rows.length === 0)
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        const usuario = userResult.rows[0];
        if (usuario.requiere_cambio_password && !isGoogleVerificado) {
            return res.status(403).json({ mensaje: 'Debes verificar tu identidad con Google Institucional antes de cambiar tu contraseña.' });
        }
        // Verificar la contraseña actual
        let esPasswordValido = false;
        if (usuario.password_hash === '$2b$10$PLACEHOLDER_HASH') {
            if (currentPassword === '123456')
                esPasswordValido = true;
        }
        else if (usuario.password_hash === currentPassword) {
            esPasswordValido = true;
        }
        else {
            try {
                esPasswordValido = await bcrypt_1.default.compare(currentPassword, usuario.password_hash);
            }
            catch (e) {
                esPasswordValido = false;
            }
        }
        if (!esPasswordValido) {
            return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta.' });
        }
        const newPasswordHash = await bcrypt_1.default.hash(newPassword, 10);
        await database_1.pool.query('UPDATE usuarios SET password_hash = $1, requiere_cambio_password = false WHERE id = $2', [newPasswordHash, usuarioId]);
        // Registrar acción en la auditoría
        await database_1.pool.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuarioId, 'CAMBIO_PASSWORD', 'Cambio exitoso de contraseña']);
        return res.status(200).json({ mensaje: 'Contraseña actualizada con éxito.' });
    }
    catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};
exports.cambiarPassword = cambiarPassword;
const verificarGoogle = async (req, res) => {
    const { credential } = req.body;
    const usuario = req.usuario;
    if (!credential) {
        return res.status(400).json({ mensaje: 'Token de Google no proporcionado.' });
    }
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ mensaje: 'El token de Google no contiene un email válido.' });
        }
        const email = payload.email.toLowerCase();
        const matriculaGoogle = email.split('@')[0];
        const identificadorSistema = usuario.identificador.toLowerCase().split('@')[0];
        if (matriculaGoogle !== identificadorSistema) {
            return res.status(403).json({
                mensaje: `El correo de Google (${email}) no coincide con tu matrícula registrada en el sistema.`
            });
        }
        // Generar un nuevo JWT indicando que Google ha sido verificado
        const newToken = jsonwebtoken_1.default.sign({
            id: usuario.id,
            rol: usuario.rol,
            identificador: usuario.identificador,
            googleVerificado: true
        }, JWT_SECRET, { expiresIn: '8h' });
        return res.status(200).json({
            mensaje: 'Verificación de Google exitosa',
            token: newToken
        });
    }
    catch (error) {
        console.error('Error al verificar Google:', error);
        return res.status(401).json({ mensaje: 'Token de Google inválido o configuración de cliente faltante.' });
    }
};
exports.verificarGoogle = verificarGoogle;
