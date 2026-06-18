// ARCHIVO: backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'utcv_super_secret_token_key_2026';

export interface TokenPayload {
  id: number;
  rol: 'ALUMNO' | 'MAESTRO' | 'JEFE_CARRERA' | 'VINCULACION';
  identificador: string;
}

// Interfaz extendida para requests autenticados
export interface AuthenticatedRequest extends Request {
  usuario?: TokenPayload;
}

// Middleware para verificar el token JWT y el rol del usuario
export const verificarToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.usuario = decodificado;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};

// Middleware para autorizar roles específicos
export const autorizarRoles = (rolesPermitidos: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado.' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para realizar esta acción.' });
    }

    next();
  };
};
