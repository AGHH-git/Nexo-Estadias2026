import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getAuditoriaLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';

    let queryText = `
      SELECT 
        l.id,
        l.accion,
        l.detalles,
        l.fecha,
        u.identificador as usuario_identificador,
        u.rol as usuario_rol
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (
        l.accion ILIKE $${paramIndex} OR 
        l.detalles ILIKE $${paramIndex} OR 
        u.identificador ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY l.fecha DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(queryText, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (
        l.accion ILIKE $${countParamIndex} OR 
        l.detalles ILIKE $${countParamIndex} OR 
        u.identificador ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return res.status(200).json({
      logs: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    return res.status(500).json({ mensaje: 'Error al obtener el historial de actividad.' });
  }
};
