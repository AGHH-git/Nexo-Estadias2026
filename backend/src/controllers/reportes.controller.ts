import { Request, Response } from 'express';
import { pool } from '../config/database';
import ExcelJS from 'exceljs';

// Auxiliar para verificar rol y carrera del jefe
async function getJefeCarreraId(usuarioId: number): Promise<number | null> {
  const result = await pool.query(
    'SELECT carrera_id FROM jefes_carrera WHERE usuario_id = $1',
    [usuarioId]
  );
  return result.rows.length > 0 ? result.rows[0].carrera_id : null;
}

export const getReporteStats = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;
    let carreraId = req.query.carrera_id ? parseInt(req.query.carrera_id as string, 10) : null;
    const estatus = req.query.estatus as string || null;
    const periodoId = req.query.periodo_id ? parseInt(req.query.periodo_id as string, 10) : null;

    // Si es jefe de carrera, forzar su carrera_id
    if (usuario.rol === 'JEFE_CARRERA') {
      const jefeCarreraId = await getJefeCarreraId(usuario.id);
      if (jefeCarreraId === null) {
        return res.status(403).json({ mensaje: 'No tienes una carrera asignada en el sistema.' });
      }
      carreraId = jefeCarreraId;
    }

    // Construcción de la consulta base sin el filtro de estatus para calcular distribución
    let queryText = `
      SELECT 
        a.matricula,
        a.nombre_completo as alumno_nombre,
        c.nombre as carrera_nombre,
        camp.nombre as campus_nombre,
        mod.nombre as sistema_nombre,
        a.telefono as alumno_telefono,
        a.nss as alumno_nss,
        COALESCE(t.estatus::text, 'Sin Registro') as estatus,
        m.nombre_completo as maestro_nombre,
        e.razon_social as empresa_nombre,
        t.modalidad_estadia,
        t.titulo_proyecto,
        t.asesor_ind_nombre,
        t.asesor_ind_cargo,
        t.asesor_ind_email,
        p.nombre || ' ' || p.anio as periodo_nombre
      FROM alumnos a
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN cat_campus camp ON a.campus_id = camp.id
      LEFT JOIN cat_modalidades mod ON a.modalidad_id = mod.id
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (periodoId) {
      queryText += ` LEFT JOIN tramites_estadia t ON a.matricula = t.matricula AND t.periodo_id = $${paramIndex} `;
      params.push(periodoId);
      paramIndex++;
    } else {
      queryText += ` LEFT JOIN tramites_estadia t ON a.matricula = t.matricula AND t.periodo_id = (SELECT id FROM periodos WHERE activo = true LIMIT 1) `;
    }

    queryText += `
      LEFT JOIN maestros m ON t.maestro_id = m.id
      LEFT JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN periodos p ON t.periodo_id = p.id
      WHERE 1=1
    `;

    if (carreraId) {
      queryText += ` AND a.carrera_id = $${paramIndex}`;
      params.push(carreraId);
      paramIndex++;
    }

    queryText += ` ORDER BY a.nombre_completo ASC`;

    const result = await pool.query(queryText, params);
    const allRows = result.rows;

    // Calcular estadísticas globales con base al filtro de carrera y período (sin filtrar por estatus aún)
    const stats = {
      total: allRows.length,
      borrador: 0,
      revision: 0,
      rechazado: 0,
      aprobado_firmas: 0,
      completado: 0,
      sin_registro: 0
    };

    allRows.forEach((row: any) => {
      if (row.estatus === 'Borrador') stats.borrador++;
      else if (row.estatus === 'En Revisión Digital') stats.revision++;
      else if (row.estatus === 'Rechazado Digital') stats.rechazado++;
      else if (row.estatus === 'Aprobado para Firmas') stats.aprobado_firmas++;
      else if (row.estatus === 'Completado') stats.completado++;
      else stats.sin_registro++;
    });

    // Ahora aplicamos el filtro de estatus para las filas que retornamos
    let filteredRows = allRows;
    if (estatus) {
      filteredRows = allRows.filter((row: any) => row.estatus === estatus);
    }

    return res.json({
      alumnos: filteredRows,
      stats
    });
  } catch (error) {
    console.error('Error en getReporteStats:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor al procesar estadísticas de reporte.' });
  }
};

export const descargarReporteExcel = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;
    let carreraId = req.query.carrera_id ? parseInt(req.query.carrera_id as string, 10) : null;
    const estatus = req.query.estatus as string || null;
    const periodoId = req.query.periodo_id ? parseInt(req.query.periodo_id as string, 10) : null;

    if (usuario.rol === 'JEFE_CARRERA') {
      const jefeCarreraId = await getJefeCarreraId(usuario.id);
      if (jefeCarreraId === null) {
        return res.status(403).json({ mensaje: 'No tienes una carrera asignada en el sistema.' });
      }
      carreraId = jefeCarreraId;
    }

    let queryText = `
      SELECT 
        a.matricula,
        a.nombre_completo as alumno_nombre,
        c.nombre as carrera_nombre,
        camp.nombre as campus_nombre,
        mod.nombre as sistema_nombre,
        a.telefono as alumno_telefono,
        u.identificador as alumno_correo,
        m.nombre_completo as maestro_nombre,
        e.razon_social,
        e.nombre_comercial,
        e.municipio,
        e.estado,
        e.giro,
        e.tamano,
        e.tipo_empresa,
        e.telefono as empresa_tel,
        t.alcance,
        t.asesor_ind_nombre,
        t.asesor_ind_cargo,
        t.asesor_ind_email,
        t.asesor_ind_telefono,
        t.fecha_inicio,
        t.fecha_termino
      FROM alumnos a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN cat_campus camp ON a.campus_id = camp.id
      LEFT JOIN cat_modalidades mod ON a.modalidad_id = mod.id
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (periodoId) {
      queryText += ` LEFT JOIN tramites_estadia t ON a.matricula = t.matricula AND t.periodo_id = $${paramIndex} `;
      params.push(periodoId);
      paramIndex++;
    } else {
      queryText += ` LEFT JOIN tramites_estadia t ON a.matricula = t.matricula AND t.periodo_id = (SELECT id FROM periodos WHERE activo = true LIMIT 1) `;
    }

    queryText += `
      LEFT JOIN maestros m ON t.maestro_id = m.id
      LEFT JOIN empresas e ON t.empresa_id = e.id
      WHERE 1=1
    `;

    if (carreraId) {
      queryText += ` AND a.carrera_id = $${paramIndex}`;
      params.push(carreraId);
      paramIndex++;
    }

    if (estatus) {
      if (estatus === 'Sin Registro') {
        queryText += ` AND t.id IS NULL`;
      } else {
        queryText += ` AND t.estatus = $${paramIndex}`;
        params.push(estatus);
        paramIndex++;
      }
    }

    queryText += ` ORDER BY a.nombre_completo ASC`;

    const result = await pool.query(queryText, params);
    const data = result.rows;

    // Crear libro Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estadías');

    // Configurar columnas
    worksheet.columns = [
      { header: 'NOMBRE DE LA EMPRESA', key: 'nombre_empresa', width: 30 },
      { header: 'RAZÓN SOCIAL DE LA EMPRESA', key: 'razon_social', width: 30 },
      { header: 'MUNICIPIO', key: 'municipio', width: 20 },
      { header: 'ESTADO', key: 'estado', width: 20 },
      { header: 'PAÍS', key: 'pais', width: 15 },
      { header: 'TELÉFONO EMPRESA / ASESOR INDUSTRIAL', key: 'telefono_emp_asesor', width: 25 },
      { header: 'GIRO (Industrial, Comercial, Servicios, Educativo)', key: 'giro', width: 25 },
      { header: 'TAMAÑO (Micro, Pequeña, Mediana, Grande)', key: 'tamano', width: 20 },
      { header: 'TIPO DE EMPRESA (Privada, Pública)', key: 'tipo_empresa', width: 20 },
      { header: 'PROGRAMA EDUCATIVO', key: 'programa_educativo', width: 35 },
      { header: 'ALCANCE DE PROYECTO', key: 'alcance', width: 20 },
      { header: 'NOMBRE DEL ASESOR INDUSTRIAL', key: 'asesor_ind_nombre', width: 30 },
      { header: 'CARGO', key: 'asesor_ind_cargo', width: 25 },
      { header: 'CORREO', key: 'asesor_ind_email', width: 30 },
      { header: 'APELLIDO PATERNO ALUMNO', key: 'apellido_paterno', width: 20 },
      { header: 'APELLIDO MATERNO ALUMNO', key: 'apellido_materno', width: 20 },
      { header: 'NOMBRE(S) ALUMNO', key: 'nombre_alumno', width: 30 },
      { header: 'GÉNERO (H - Hombre, M - Mujer)', key: 'genero', width: 15 },
      { header: 'MATRÍCULA', key: 'matricula', width: 15 },
      { header: 'CORREO ALUMNO', key: 'correo_alumno', width: 30 },
      { header: 'TELÉFONO DEL ALUMNO', key: 'telefono_alumno', width: 15 },
      { header: 'CAMPUS PROCEDENCIA', key: 'campus_procedencia', width: 20 },
      { header: 'MODALIDAD', key: 'modalidad', width: 15 },
      { header: 'FECHA DE INICIO', key: 'fecha_inicio', width: 15 },
      { header: 'FECHA DE TERMINO', key: 'fecha_termino', width: 15 },
      { header: 'ASESOR ACADÉMICO (APELLIDO PATERNO-MATERNO-NOMBRE)', key: 'asesor_academico', width: 35 }
    ];

    // Estilos para la fila de cabecera
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '9B0A37' } // Rojo vino UTCV
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' },
        size: 11,
        name: 'Arial'
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFF' } },
        bottom: { style: 'medium', color: { argb: '730728' } },
        right: { style: 'thin', color: { argb: 'FFFFFF' } }
      };
    });
    headerRow.height = 28;

    // Formatear datos y agregar filas
    const excelData = data.map((row) => {
      const parts = (row.alumno_nombre || '').split(' ').filter(Boolean);
      let paterno = '';
      let materno = '';
      let nombres = row.alumno_nombre || '';
      
      if (parts.length >= 3) {
        paterno = parts[0];
        materno = parts[1];
        nombres = parts.slice(2).join(' ');
      } else if (parts.length === 2) {
        paterno = parts[0];
        nombres = parts[1];
      }

      return {
        nombre_empresa: row.nombre_comercial || row.razon_social || 'N/A',
        razon_social: row.razon_social || 'N/A',
        municipio: row.municipio || 'N/A',
        estado: row.estado || 'N/A',
        pais: 'México',
        telefono_emp_asesor: row.asesor_ind_telefono || row.empresa_tel || 'N/A',
        giro: row.giro || 'N/A',
        tamano: row.tamano || 'N/A',
        tipo_empresa: row.tipo_empresa || 'N/A',
        programa_educativo: row.carrera_nombre || 'N/A',
        alcance: row.alcance || 'N/A',
        asesor_ind_nombre: row.asesor_ind_nombre || 'N/A',
        asesor_ind_cargo: row.asesor_ind_cargo || 'N/A',
        asesor_ind_email: row.asesor_ind_email || 'N/A',
        apellido_paterno: paterno,
        apellido_materno: materno,
        nombre_alumno: nombres,
        genero: 'N/A',
        matricula: row.matricula || 'N/A',
        correo_alumno: row.alumno_correo || 'N/A',
        telefono_alumno: row.alumno_telefono || 'N/A',
        campus_procedencia: row.campus_nombre || 'N/A',
        modalidad: row.sistema_nombre || 'N/A',
        fecha_inicio: row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString() : 'N/A',
        fecha_termino: row.fecha_termino ? new Date(row.fecha_termino).toLocaleDateString() : 'N/A',
        asesor_academico: row.maestro_nombre || 'N/A'
      };
    });

    excelData.forEach((rowData, index) => {
      const newRow = worksheet.addRow(rowData);
      newRow.height = 20;

      const bgColor = index % 2 === 0 ? 'FFFFFF' : 'FDF0F4';

      newRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.font = { size: 10, name: 'Arial' };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E8D5DA' } },
          left: { style: 'thin', color: { argb: 'E8D5DA' } },
          bottom: { style: 'thin', color: { argb: 'E8D5DA' } },
          right: { style: 'thin', color: { argb: 'E8D5DA' } }
        };
      });
    });

    // Enviar respuesta binaria
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte-estadias-${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error en descargarReporteExcel:', error);
    res.status(500).json({ mensaje: 'Error al generar el archivo Excel.' });
  }
};

export const getReporteCarreras = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, nombre, nivel_academico FROM cat_carreras ORDER BY nombre ASC');
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en getReporteCarreras:', error);
    res.status(500).json({ mensaje: 'Error al obtener las carreras.' });
  }
};

export const getReportePeriodos = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, nombre, anio, activo FROM periodos ORDER BY anio DESC, nombre DESC');
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en getReportePeriodos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los periodos.' });
  }
};
export const getReporteCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = ['Sin Registro','Borrador','En Revisión Digital','Rechazado Digital','Aprobado para Firmas','Completado'];
    return res.json(categorias);
  } catch (error) {
    console.error('Error en getReporteCategorias:', error);
    res.status(500).json({ mensaje: 'Error al obtener categorías.' });
  }
};
