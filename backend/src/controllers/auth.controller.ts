// ARCHIVO: backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'utcv_super_secret_token_key_2026';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const login = async (req: Request, res: Response) => {
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
    const userResult = await pool.query(userQuery, [identificador.trim(), identificadorLimpio]);

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
    } else if (usuario.password_hash === password) {
      esPasswordValido = true;
    } else {
      try {
        esPasswordValido = await bcrypt.compare(password, usuario.password_hash);
      } catch (err) {
        esPasswordValido = false;
      }
    }

    if (!esPasswordValido) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    // Obtener el nombre del usuario dependiendo de su rol
    let nombre = 'Usuario UTCV';
    if (usuario.rol === 'ALUMNO') {
      const alumnoResult = await pool.query('SELECT nombre_completo FROM alumnos WHERE usuario_id = $1', [usuario.id]);
      if (alumnoResult.rows.length > 0) {
        nombre = alumnoResult.rows[0].nombre_completo;
      }
    } else {
      const maestroResult = await pool.query('SELECT nombre_completo FROM maestros WHERE usuario_id = $1', [usuario.id]);
      if (maestroResult.rows.length > 0) {
        nombre = maestroResult.rows[0].nombre_completo;
      }
    }

    // Si el usuario estaba registrado como inactivo (no ha entrado nunca), activarlo
    if (!usuario.activo) {
      await pool.query('UPDATE usuarios SET activo = true WHERE id = $1', [usuario.id]);
    }

    // Generar el token JWT (validez de 8 horas)
    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol,
        identificador: usuario.identificador,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Registrar acción en la auditoría
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuario.id, 'LOGIN', `Inicio de sesión exitoso desde CLI/Web. Rol: ${usuario.rol}. Activación: ${!usuario.activo}`]
    );

    return res.status(200).json({
      token,
      rol: usuario.rol,
      nombre,
      requiereCambioPassword: usuario.requiere_cambio_password,
    });
  } catch (error: any) {
    console.error('Error en el login:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor al iniciar sesión.' });
  }
};

export const register = async (req: Request, res: Response) => {
  const {
    identificador,
    password,
    matricula,
    nombre_completo,
    carrera,
    campus,
    sistema,
    nss,
    telefono
  } = req.body;

  // Validación de campos obligatorios
  if (!identificador || !password || !matricula || !nombre_completo || !carrera) {
    return res.status(400).json({ mensaje: 'Por favor, completa todos los campos obligatorios.' });
  }

  const client = await pool.connect();
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
    const passwordHash = await bcrypt.hash(password, 10);

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
    await client.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioId, 'REGISTRO', `Registro exitoso de alumno. Matrícula: ${matricula}`]
    );

    await client.query('COMMIT');

    return res.status(201).json({ mensaje: 'Registro completado con éxito. Ya puedes iniciar sesión.' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error en el registro:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor al procesar el registro.' });
  } finally {
    client.release();
  }
};

export const cambiarPassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const usuarioId = (req as any).usuario.id;
  const isGoogleVerificado = (req as any).usuario.googleVerificado;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ mensaje: 'Por favor, completa todos los campos.' });
  }

  try {
    const userResult = await pool.query('SELECT password_hash, requiere_cambio_password FROM usuarios WHERE id = $1', [usuarioId]);
    if (userResult.rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    
    const usuario = userResult.rows[0];

    if (usuario.requiere_cambio_password && !isGoogleVerificado) {
      if (process.env.DISABLE_GOOGLE_AUTH !== 'true') {
        return res.status(403).json({ mensaje: 'Debes verificar tu identidad con Google Institucional antes de cambiar tu contraseña.' });
      }
    }

    // Verificar la contraseña actual
    let esPasswordValido = false;
    if (usuario.password_hash === '$2b$10$PLACEHOLDER_HASH') {
      if (currentPassword === '123456') esPasswordValido = true;
    } else if (usuario.password_hash === currentPassword) {
      esPasswordValido = true;
    } else {
      try {
        esPasswordValido = await bcrypt.compare(currentPassword, usuario.password_hash);
      } catch (e) {
        esPasswordValido = false;
      }
    }

    if (!esPasswordValido) {
      return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE usuarios SET password_hash = $1, requiere_cambio_password = false WHERE id = $2',
      [newPasswordHash, usuarioId]
    );

    // Registrar acción en la auditoría
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioId, 'CAMBIO_PASSWORD', 'Cambio exitoso de contraseña']
    );

    return res.status(200).json({ mensaje: 'Contraseña actualizada con éxito.' });
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

export const verificarGoogle = async (req: Request, res: Response) => {
  const { credential } = req.body;
  const usuario = (req as any).usuario;

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
    const newToken = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol,
        identificador: usuario.identificador,
        googleVerificado: true
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      mensaje: 'Verificación de Google exitosa',
      token: newToken
    });
  } catch (error) {
    console.error('Error al verificar Google:', error);
    return res.status(401).json({ mensaje: 'Token de Google inválido o configuración de cliente faltante.' });
  }
};

// ----------------------------------------------------------------------
// Módulo: Olvidé mi contraseña
// ----------------------------------------------------------------------
let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    console.log("Creando cuenta de prueba Ethereal para correos...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return transporter;
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { identificador } = req.body;
  if (!identificador) {
    return res.status(400).json({ mensaje: 'Por favor, ingresa tu matrícula o correo institucional.' });
  }

  try {
    let identificadorLimpio = identificador.trim();
    if (identificadorLimpio.toLowerCase().endsWith('@utcv.edu.mx')) {
      identificadorLimpio = identificadorLimpio.split('@')[0];
    }

    const userQuery = 'SELECT id, identificador, password_hash, rol FROM usuarios WHERE LOWER(identificador) = LOWER($1) OR LOWER(identificador) = LOWER($2)';
    const userResult = await pool.query(userQuery, [identificador.trim(), identificadorLimpio]);

    if (userResult.rows.length === 0) {
      // Para evitar enumeración de usuarios, respondemos con éxito incluso si no existe
      return res.status(200).json({ mensaje: 'Si el identificador es válido, recibirás un correo con instrucciones.' });
    }

    const usuario = userResult.rows[0];
    const correoInstitucional = usuario.identificador.includes('@') ? usuario.identificador : `${usuario.identificador}@utcv.edu.mx`;

    // Generar un token con el hash del password para que se invalide si la contraseña cambia
    const payload = {
      id: usuario.id,
      hash: usuario.password_hash
    };
    
    // Token expira en 1 hora
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // URL del frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: '"Sistema de Estadías UTCV" <no-reply@utcv.edu.mx>',
      to: correoInstitucional,
      subject: 'Recuperación de Contraseña - UTCV',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">Recuperación de Contraseña</h2>
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña en el Sistema de Estadías UTCV.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace expira en 1 hora.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablecer Contraseña</a>
          </div>
          <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #7f8c8d; font-size: 14px;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #95a5a6; text-align: center;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `
    });

    // Si es cuenta de prueba, imprimir url para ver el correo
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('--- URL del correo de recuperación de prueba ---');
      console.log(nodemailer.getTestMessageUrl(info));
      console.log('------------------------------------------------');
    }

    return res.status(200).json({ 
      mensaje: 'Si el identificador es válido, recibirás un correo con instrucciones.' 
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor al procesar la solicitud.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ mensaje: 'Datos incompletos.' });
  }

  try {
    // Verificar token (falla si está expirado o si el formato no es válido)
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Buscar al usuario
    const userResult = await pool.query('SELECT id, password_hash FROM usuarios WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    const usuario = userResult.rows[0];

    // Verificar que el hash de la contraseña no haya cambiado (esto previene que el token se use más de una vez)
    if (decoded.hash !== usuario.password_hash) {
      return res.status(400).json({ mensaje: 'Este enlace de recuperación ya ha sido utilizado o no es válido.' });
    }

    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [newPasswordHash, usuario.id]);

    // Registrar en auditoría
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuario.id, 'RECUPERAR_PASSWORD', 'Recuperación de contraseña mediante enlace de correo']
    );

    return res.status(200).json({ mensaje: 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.' });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ mensaje: 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.' });
    }
    console.error('Error en resetPassword:', error);
    return res.status(400).json({ mensaje: 'El enlace de recuperación es inválido.' });
  }
};

