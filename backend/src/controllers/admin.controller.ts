import { Request, Response } from 'express';
import { pool } from '../config/database';

// ========================
// VINCULACION
// ========================

export const getVinculacionStats = async (req: Request, res: Response) => {
  try {
    const alumnosResult = await pool.query('SELECT COUNT(*) as total FROM alumnos');
    const periodoResult = await pool.query('SELECT nombre, anio FROM periodos WHERE activo = true LIMIT 1');
    const tramitesResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estatus = 'Completado' THEN 1 ELSE 0 END) as completados,
        SUM(CASE WHEN estatus != 'Completado' AND estatus != 'Borrador' THEN 1 ELSE 0 END) as en_proceso
      FROM tramites_estadia
    `);

    return res.json({
      alumnos_registrados: parseInt(alumnosResult.rows[0].total) || 0,
      periodo_activo: periodoResult.rows.length > 0 ? `${periodoResult.rows[0].nombre} ${periodoResult.rows[0].anio}` : 'Ningún periodo activo',
      tramites_en_proceso: parseInt(tramitesResult.rows[0].en_proceso) || 0,
      tramites_completados: parseInt(tramitesResult.rows[0].completados) || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas de vinculación' });
  }
};

export const getJefeStats = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).usuario.id;
    
    // Obtener la carrera asignada al jefe
    const jefeResult = await pool.query(`
      SELECT j.carrera_id, c.nombre as carrera 
      FROM jefes_carrera j
      LEFT JOIN cat_carreras c ON j.carrera_id = c.id
      WHERE j.usuario_id = $1
    `, [usuarioId]);
    if (jefeResult.rows.length === 0) {
      return res.status(403).json({ mensaje: 'El jefe de carrera no tiene una carrera asignada en el sistema.' });
    }
    const carreraIdJefe = jefeResult.rows[0].carrera_id;
    const carreraJefe = jefeResult.rows[0].carrera;

    const alumnosResult = await pool.query('SELECT COUNT(*) as total FROM alumnos WHERE carrera_id = $1', [carreraIdJefe]);
    const asignadosResult = await pool.query(`
      SELECT COUNT(DISTINCT t.matricula) as total 
      FROM tramites_estadia t
      JOIN alumnos a ON t.matricula = a.matricula
      WHERE t.maestro_id IS NOT NULL AND a.carrera_id = $1
    `, [carreraIdJefe]);
    
    const total = parseInt(alumnosResult.rows[0].total) || 0;
    const asignados = parseInt(asignadosResult.rows[0].total) || 0;
    const pendientes = total - asignados;

    const pendientesList = await pool.query(`
      SELECT a.matricula, a.nombre_completo, c.nombre as carrera 
      FROM alumnos a
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN tramites_estadia t ON a.matricula = t.matricula
      WHERE a.carrera_id = $1 AND (t.maestro_id IS NULL OR t.id IS NULL)
      LIMIT 10
    `, [carreraIdJefe]);

    return res.json({
      total_alumnos: total,
      asignados: asignados,
      pendientes: pendientes,
      sin_registro: 0,
      alumnos_pendientes: pendientesList.rows,
      carrera_asignada: carreraJefe
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas de jefe' });
  }
};

export const getMaestroStats = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).usuario.id;
    const maestroIdResult = await pool.query('SELECT id FROM maestros WHERE usuario_id = $1', [usuarioId]);
    
    if (maestroIdResult.rows.length === 0) {
      return res.json({ mis_alumnos: 0, aprobados: 0, pendientes: 0, observaciones: 0, lista: [] });
    }

    const maestroId = maestroIdResult.rows[0].id;

    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT matricula) as mis_alumnos,
        SUM(CASE WHEN estatus = 'Aprobado para Firmas' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN estatus = 'En Revisión Digital' THEN 1 ELSE 0 END) as pendientes
      FROM tramites_estadia
      WHERE maestro_id = $1
    `, [maestroId]);

    const listaResult = await pool.query(`
      SELECT a.nombre_completo, a.matricula, t.estatus, t.fecha_actualizacion
      FROM tramites_estadia t
      JOIN alumnos a ON t.matricula = a.matricula
      WHERE t.maestro_id = $1
      ORDER BY t.fecha_actualizacion DESC
    `, [maestroId]);

    return res.json({
      mis_alumnos: parseInt(statsResult.rows[0].mis_alumnos) || 0,
      aprobados: parseInt(statsResult.rows[0].aprobados) || 0,
      pendientes: parseInt(statsResult.rows[0].pendientes) || 0,
      observaciones: 0,
      lista: listaResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas de maestro' });
  }
};

export const getMaestrosDisponibles = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, nombre_completo, area_adscripcion, cargo FROM maestros ORDER BY nombre_completo ASC');
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener maestros' });
  }
};

export const asignarMaestro = async (req: Request, res: Response) => {
  const { matricula, maestro_id } = req.body;
  if (!matricula || !maestro_id) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios para la asignación.' });
  }
  
  try {
    // 1. Validar que la matrícula y el maestro existan
    const alumnoCheck = await pool.query('SELECT matricula FROM alumnos WHERE matricula = $1', [matricula]);
    if (alumnoCheck.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El alumno no existe.' });
    }

    const maestroCheck = await pool.query('SELECT id FROM maestros WHERE id = $1', [maestro_id]);
    if (maestroCheck.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El maestro no existe.' });
    }

    const periodoResult = await pool.query('SELECT id FROM periodos WHERE activo = true LIMIT 1');
    if (periodoResult.rows.length === 0) {
      return res.status(400).json({ mensaje: 'No hay un periodo activo. Aperture un periodo primero.' });
    }
    const periodoId = periodoResult.rows[0].id;

    // 2. Verificar si el alumno ya tiene un trámite
    const checkTramite = await pool.query('SELECT id FROM tramites_estadia WHERE matricula = $1', [matricula]);
    
    if (checkTramite.rows.length > 0) {
      // Actualizar el maestro asignado
      await pool.query('UPDATE tramites_estadia SET maestro_id = $1 WHERE matricula = $2', [maestro_id, matricula]);
    } else {
      // Crear el registro base para que el alumno pueda iniciar su trámite (Se le asigna estatus Borrador)
      await pool.query(
        'INSERT INTO tramites_estadia (matricula, maestro_id, estatus, periodo_id) VALUES ($1, $2, $3, $4)', 
        [matricula, maestro_id, 'Borrador', periodoId]
      );
    }

    // 3. Registrar acción en la auditoría
    const usuarioId = (req as any).usuario.id;
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioId, 'ASIGNACION_MAESTRO', `Asignó al maestro ID ${maestro_id} al alumno ${matricula}`]
    );

    return res.json({ mensaje: 'Asesor académico asignado correctamente.' });
  } catch (error) {
    console.error('Error en asignarMaestro:', error);
    res.status(500).json({ mensaje: 'Error interno al procesar la asignación.' });
  }
};

export const getTramiteMaestro = async (req: Request, res: Response) => {
  const { matricula } = req.params;
  const usuarioId = (req as any).usuario.id;

  try {
    const maestroIdResult = await pool.query('SELECT id FROM maestros WHERE usuario_id = $1', [usuarioId]);
    if (maestroIdResult.rows.length === 0) return res.status(403).json({ mensaje: 'Acceso denegado: No es maestro' });
    const maestroId = maestroIdResult.rows[0].id;

    // Obtener detalles del trámite
    const tramiteResult = await pool.query(`
      SELECT t.*, 
             e.razon_social, e.nombre_comercial, e.rfc, e.giro, e.tamano, e.tipo_empresa, e.estado, e.municipio, e.cp, e.domicilio, e.telefono as empresa_telefono,
             a.nombre_completo as alumno_nombre, c.nombre as carrera, a.telefono as alumno_telefono, a.nss, cam.nombre as campus
      FROM tramites_estadia t
      JOIN alumnos a ON t.matricula = a.matricula
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN cat_campus cam ON a.campus_id = cam.id
      LEFT JOIN empresas e ON t.empresa_id = e.id
      WHERE t.matricula = $1 AND t.maestro_id = $2
    `, [matricula, maestroId]);

    if (tramiteResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Trámite no encontrado o no asignado a este maestro' });
    }

    // Obtener historial de observaciones
    const observacionesResult = await pool.query(
      'SELECT comentarios, fecha FROM historial_observaciones WHERE tramite_id = $1 ORDER BY fecha DESC',
      [tramiteResult.rows[0].id]
    );

    return res.json({
      ...tramiteResult.rows[0],
      observaciones: observacionesResult.rows
    });
  } catch (error) {
    console.error('Error al obtener el trámite:', error);
    res.status(500).json({ mensaje: 'Error al cargar los datos del trámite' });
  }
};

export const evaluarTramiteMaestro = async (req: Request, res: Response) => {
  const { matricula } = req.params;
  const { estatus, comentarios, nss_rechazado, ine_tutor_rechazado } = req.body;
  const usuarioId = (req as any).usuario.id;

  if (!estatus) {
    return res.status(400).json({ mensaje: 'El estatus es requerido' });
  }

  try {
    const maestroIdResult = await pool.query('SELECT id FROM maestros WHERE usuario_id = $1', [usuarioId]);
    if (maestroIdResult.rows.length === 0) return res.status(403).json({ mensaje: 'Acceso denegado' });
    const maestroId = maestroIdResult.rows[0].id;

    const tramiteResult = await pool.query('SELECT id FROM tramites_estadia WHERE matricula = $1 AND maestro_id = $2', [matricula, maestroId]);
    if (tramiteResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Trámite no encontrado' });
    }
    const tramiteId = tramiteResult.rows[0].id;

    const isRechazado = estatus === 'Rechazado Digital';
    const nssRech = isRechazado ? !!nss_rechazado : false;
    const ineRech = isRechazado ? !!ine_tutor_rechazado : false;

    // Actualizar el estatus y las banderas
    await pool.query(
      `UPDATE tramites_estadia 
       SET estatus = $1, 
           nss_rechazado = $2, 
           ine_tutor_rechazado = $3, 
           fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $4`, 
      [estatus, nssRech, ineRech, tramiteId]
    );

    // Si hay observaciones o si se rechazó, guardar en el historial
    if (comentarios || estatus === 'Rechazado Digital') {
      const msg = comentarios || 'Trámite rechazado por observaciones generales.';
      await pool.query(
        'INSERT INTO historial_observaciones (tramite_id, maestro_id, comentarios) VALUES ($1, $2, $3)',
        [tramiteId, maestroId, msg]
      );
    }

    // Registrar en auditoria
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioId, 'EVALUACION_TRAMITE', `Maestro ID ${maestroId} cambió estatus de matrícula ${matricula} a ${estatus} (NSS Rechazado: ${nssRech}, INE Rechazado: ${ineRech})`]
    );

    return res.json({ mensaje: 'La evaluación se ha guardado correctamente' });
  } catch (error) {
    console.error('Error al evaluar el trámite:', error);
    res.status(500).json({ mensaje: 'Error interno al evaluar el trámite' });
  }
};

export const aperturarPeriodo = async (req: Request, res: Response) => {
  const { nombre, anio, fecha_inicio, fecha_fin } = req.body;
  const usuarioId = (req as any).usuario.id;

  if (!nombre || !anio) {
    return res.status(400).json({ mensaje: 'El nombre y el año del periodo son obligatorios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Desactivar todos los periodos anteriores
    await client.query('UPDATE periodos SET activo = false');

    // Crear el nuevo periodo y activarlo
    await client.query(
      'INSERT INTO periodos (nombre, anio, activo) VALUES ($1, $2, true)',
      [nombre, anio]
    );

    // Registrar en auditoría
    await client.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioId, 'APERTURA_PERIODO', `Aperturó el periodo ${nombre} ${anio}`]
    );

    await client.query('COMMIT');
    return res.json({ mensaje: 'El nuevo periodo ha sido aperturado y activado exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al aperturar periodo:', error);
    res.status(500).json({ mensaje: 'Error interno al aperturar el nuevo periodo.' });
  } finally {
    client.release();
  }
};

export const getTramiteGlobal = async (req: Request, res: Response) => {
  const { matricula } = req.params;

  try {
    const tramiteResult = await pool.query(`
      SELECT t.*, 
             e.razon_social, e.nombre_comercial, e.rfc, e.giro, e.tamano, e.tipo_empresa, e.estado, e.municipio, e.cp, e.domicilio, e.telefono as empresa_telefono,
             a.nombre_completo as alumno_nombre, c.nombre as carrera, a.telefono as alumno_telefono, a.nss as alumno_nss, cam.nombre as campus
      FROM tramites_estadia t
      JOIN alumnos a ON t.matricula = a.matricula
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN cat_campus cam ON a.campus_id = cam.id
      LEFT JOIN empresas e ON t.empresa_id = e.id
      WHERE t.matricula = $1
    `, [matricula]);

    if (tramiteResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Trámite no encontrado' });
    }

    const observacionesResult = await pool.query(
      'SELECT comentarios, fecha FROM historial_observaciones WHERE tramite_id = $1 ORDER BY fecha DESC',
      [tramiteResult.rows[0].id]
    );

    return res.json({
      ...tramiteResult.rows[0],
      observaciones: observacionesResult.rows
    });
  } catch (error) {
    console.error('Error al obtener el trámite global:', error);
    res.status(500).json({ mensaje: 'Error al cargar los datos del trámite' });
  }
};

export const getAlumnosJefe = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).usuario.id;
    const jefeResult = await pool.query(`
      SELECT j.carrera_id, c.nombre as carrera 
      FROM jefes_carrera j
      LEFT JOIN cat_carreras c ON j.carrera_id = c.id
      WHERE j.usuario_id = $1
    `, [usuarioId]);
    
    if (jefeResult.rows.length === 0) {
      return res.status(403).json({ mensaje: 'El jefe de carrera no tiene una carrera asignada.' });
    }
    const carreraIdJefe = jefeResult.rows[0].carrera_id;

    const listaResult = await pool.query(`
      SELECT a.matricula, a.nombre_completo, c.nombre as carrera, 
             COALESCE(t.estatus::text, 'Sin Registro') as estatus,
             m.nombre_completo as maestro_nombre
      FROM alumnos a
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN tramites_estadia t ON a.matricula = t.matricula
      LEFT JOIN maestros m ON t.maestro_id = m.id
      WHERE a.carrera_id = $1
      ORDER BY a.nombre_completo ASC
    `, [carreraIdJefe]);

    return res.json(listaResult.rows);
  } catch (error) {
    console.error('Error al obtener alumnos del jefe:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

export const getAlumnosVinculacion = async (req: Request, res: Response) => {
  try {
    const listaResult = await pool.query(`
      SELECT a.matricula, a.nombre_completo, c.nombre as carrera, 
             COALESCE(t.estatus::text, 'Sin Registro') as estatus,
             m.nombre_completo as maestro_nombre
      FROM alumnos a
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN tramites_estadia t ON a.matricula = t.matricula
      LEFT JOIN maestros m ON t.maestro_id = m.id
      ORDER BY t.fecha_actualizacion DESC NULLS LAST
    `);

    return res.json(listaResult.rows);
  } catch (error) {
    console.error('Error al obtener alumnos para vinculacion:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// ========================
// JEFE DE CARRERA - ASIGNACIONES AVANZADAS
// ========================

/**
 * Obtiene la lista de maestros con sus alumnos asignados agrupados.
 * Para el panel de Asignaciones del Jefe de Carrera.
 */
export const getMaestrosConAlumnos = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).usuario.id;
    const jefeResult = await pool.query(`
      SELECT j.carrera_id, c.nombre as carrera 
      FROM jefes_carrera j
      LEFT JOIN cat_carreras c ON j.carrera_id = c.id
      WHERE j.usuario_id = $1
    `, [usuarioId]);
    if (jefeResult.rows.length === 0) {
      return res.status(403).json({ mensaje: 'El jefe de carrera no tiene una carrera asignada.' });
    }
    const carreraIdJefe = jefeResult.rows[0].carrera_id;
    const carreraJefe = jefeResult.rows[0].carrera;

    // Obtener todos los maestros
    const maestrosResult = await pool.query(
      'SELECT id, nombre_completo, area_adscripcion, cargo, telefono, extension FROM maestros ORDER BY nombre_completo ASC'
    );

    // Obtener todos los alumnos de la carrera con su asignación
    const alumnosResult = await pool.query(`
      SELECT a.matricula, a.nombre_completo, c.nombre as carrera,
             COALESCE(t.estatus::text, 'Sin Registro') as estatus,
             t.maestro_id
      FROM alumnos a
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN tramites_estadia t ON a.matricula = t.matricula
      WHERE a.carrera_id = $1
      ORDER BY a.nombre_completo ASC
    `, [carreraIdJefe]);

    // Agrupar alumnos por maestro
    const maestrosConAlumnos = maestrosResult.rows.map((maestro: any) => {
      const alumnosDelMaestro = alumnosResult.rows.filter(
        (a: any) => a.maestro_id === maestro.id
      );
      return {
        ...maestro,
        alumnos_asignados: alumnosDelMaestro,
        total_asignados: alumnosDelMaestro.length
      };
    });

    // Alumnos sin maestro asignado
    const alumnosSinAsignar = alumnosResult.rows.filter(
      (a: any) => a.maestro_id === null
    );

    return res.json({
      maestros: maestrosConAlumnos,
      alumnos_sin_asignar: alumnosSinAsignar,
      total_alumnos: alumnosResult.rows.length,
      total_sin_asignar: alumnosSinAsignar.length,
      carrera: carreraJefe
    });
  } catch (error) {
    console.error('Error al obtener maestros con alumnos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Desasignar un maestro de un alumno (poner maestro_id = NULL en el trámite)
 */
export const desasignarMaestro = async (req: Request, res: Response) => {
  const { matricula } = req.body;
  if (!matricula) {
    return res.status(400).json({ mensaje: 'La matrícula del alumno es obligatoria.' });
  }

  try {
    const result = await pool.query(
      'UPDATE tramites_estadia SET maestro_id = NULL WHERE matricula = $1 RETURNING id',
      [matricula]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontró un trámite para ese alumno.' });
    }

    // Registrar en auditoría
    const usuarioId = (req as any).usuario.id;
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioId, 'DESASIGNACION_MAESTRO', `Desvinculó al maestro del alumno ${matricula}`]
    );

    return res.json({ mensaje: 'Maestro desvinculado correctamente del alumno.' });
  } catch (error) {
    console.error('Error al desasignar maestro:', error);
    res.status(500).json({ mensaje: 'Error interno al procesar la desvinculación.' });
  }
};

/**
 * Asignar un maestro a múltiples alumnos de manera masiva
 */
export const asignarMaestroMasivo = async (req: Request, res: Response) => {
  const { maestro_id, matriculas } = req.body;
  if (!maestro_id || !matriculas || !Array.isArray(matriculas) || matriculas.length === 0) {
    return res.status(400).json({ mensaje: 'Se requiere el ID del maestro y una lista de matrículas.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validar que el maestro existe
    const maestroCheck = await client.query('SELECT id, nombre_completo FROM maestros WHERE id = $1', [maestro_id]);
    if (maestroCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El maestro no existe.' });
    }

    const periodoResult = await client.query('SELECT id FROM periodos WHERE activo = true LIMIT 1');
    if (periodoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'No hay un periodo activo. Aperture un periodo primero.' });
    }
    const periodoId = periodoResult.rows[0].id;

    let asignados = 0;
    for (const matricula of matriculas) {
      // Verificar si ya tiene trámite
      const checkTramite = await client.query('SELECT id FROM tramites_estadia WHERE matricula = $1', [matricula]);
      
      if (checkTramite.rows.length > 0) {
        await client.query('UPDATE tramites_estadia SET maestro_id = $1 WHERE matricula = $2', [maestro_id, matricula]);
      } else {
        await client.query(
          'INSERT INTO tramites_estadia (matricula, maestro_id, estatus, periodo_id) VALUES ($1, $2, $3, $4)',
          [matricula, maestro_id, 'Borrador', periodoId]
        );
      }
      asignados++;
    }

    // Registrar en auditoría
    const usuarioId = (req as any).usuario.id;
    await client.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioId, 'ASIGNACION_MASIVA', `Asignó ${asignados} alumnos al maestro ${maestroCheck.rows[0].nombre_completo} (ID: ${maestro_id})`]
    );

    await client.query('COMMIT');
    return res.json({ mensaje: `Se asignaron ${asignados} alumnos correctamente al maestro.`, asignados });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en asignación masiva:', error);
    res.status(500).json({ mensaje: 'Error interno al procesar la asignación masiva.' });
  } finally {
    client.release();
  }
};

/**
 * Aprobar un documento individual (NSS, INE Tutor o Evidencia) por Maestro o Jefe de Carrera.
 * Registra el nombre del usuario y la fecha/hora de aprobación.
 */
export const aprobarDocumento = async (req: Request, res: Response) => {
  const { tramite_id, documento, rol } = req.body;
  const usuarioId = (req as any).usuario.id;

  // Validar parámetros
  const documentosValidos = ['nss', 'ine_tutor', 'evidencia'];
  const rolesValidos = ['maestro', 'jefe'];

  if (!tramite_id || !documento || !rol) {
    return res.status(400).json({ mensaje: 'Se requieren tramite_id, documento y rol.' });
  }
  if (!documentosValidos.includes(documento)) {
    return res.status(400).json({ mensaje: `Documento inválido. Válidos: ${documentosValidos.join(', ')}` });
  }
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ mensaje: `Rol inválido. Válidos: ${rolesValidos.join(', ')}` });
  }

  try {
    // Obtener nombre del usuario aprobador
    let nombreAprobador = '';

    if (rol === 'maestro') {
      const maestroResult = await pool.query(
        'SELECT nombre_completo FROM maestros WHERE usuario_id = $1',
        [usuarioId]
      );
      if (maestroResult.rows.length === 0) {
        return res.status(403).json({ mensaje: 'El usuario no es un maestro registrado.' });
      }
      nombreAprobador = maestroResult.rows[0].nombre_completo;
    } else if (rol === 'jefe') {
      const jefeResult = await pool.query(`
        SELECT m.nombre_completo 
        FROM jefes_carrera j
        JOIN maestros m ON m.usuario_id = j.usuario_id
        WHERE j.usuario_id = $1
      `, [usuarioId]);

      if (jefeResult.rows.length === 0) {
        // Intentar obtener nombre de maestros directamente
        const maestroResult = await pool.query(
          'SELECT nombre_completo FROM maestros WHERE usuario_id = $1',
          [usuarioId]
        );
        if (maestroResult.rows.length > 0) {
          nombreAprobador = maestroResult.rows[0].nombre_completo;
        } else {
          // Usar identificador del usuario como fallback
          const userResult = await pool.query('SELECT identificador FROM usuarios WHERE id = $1', [usuarioId]);
          nombreAprobador = userResult.rows[0]?.identificador || 'Jefe de Carrera';
        }
      } else {
        nombreAprobador = jefeResult.rows[0].nombre_completo;
      }
    }

    // Validar que el trámite existe y tiene el documento
    const tramiteResult = await pool.query(
      'SELECT id, ruta_nss, ruta_ine_tutor, ruta_evidencia FROM tramites_estadia WHERE id = $1',
      [tramite_id]
    );
    if (tramiteResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Trámite no encontrado.' });
    }

    const tramite = tramiteResult.rows[0];
    const rutaMap: Record<string, string> = {
      nss: tramite.ruta_nss,
      ine_tutor: tramite.ruta_ine_tutor,
      evidencia: tramite.ruta_evidencia
    };

    // Nombre del documento para la columna (ine_tutor → ine)
    const docKey = documento === 'ine_tutor' ? 'ine' : documento;

    if (!rutaMap[documento]) {
      return res.status(400).json({ mensaje: 'El documento indicado no ha sido subido por el alumno.' });
    }

    // Construir nombres de columnas dinámicamente
    const colAprobado = `aprobacion_${docKey}_${rol}`;
    const colNombre = `aprobacion_${docKey}_${rol}_nombre`;
    const colFecha = `aprobacion_${docKey}_${rol}_fecha`;

    // Actualizar aprobación
    await pool.query(
      `UPDATE tramites_estadia 
       SET ${colAprobado} = TRUE, 
           ${colNombre} = $1, 
           ${colFecha} = CURRENT_TIMESTAMP,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [nombreAprobador, tramite_id]
    );

    // Registrar en auditoría
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [
        usuarioId,
        'APROBACION_DOCUMENTO',
        `${nombreAprobador} (${rol}) aprobó el documento "${documento}" del trámite ID ${tramite_id}`
      ]
    );

    // Retornar la aprobación registrada con timestamp
    const updatedResult = await pool.query(
      `SELECT ${colAprobado} as aprobado, ${colNombre} as nombre, ${colFecha} as fecha FROM tramites_estadia WHERE id = $1`,
      [tramite_id]
    );

    return res.json({
      mensaje: `Documento "${documento}" aprobado correctamente por ${nombreAprobador}.`,
      aprobacion: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Error al aprobar documento:', error);
    return res.status(500).json({ mensaje: 'Error interno al registrar la aprobación del documento.' });
  }
};

// ========================
// ADMINISTRACIÓN DE USUARIOS Y CARGA MASIVA
// ========================

import exceljs from 'exceljs';
import bcrypt from 'bcrypt';

export const cargarAlumnosMasivo = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ mensaje: 'No se ha proporcionado ningún archivo.' });
  }

  const client = await pool.connect();
  try {
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);
    const worksheet = workbook.worksheets[0];

    const resultados = {
      procesados: 0,
      exitosos: 0,
      errores: [] as string[]
    };

    const hashGenerico = await bcrypt.hash('123456', 10);

    // Iterar desde la fila 2 asumiendo que la 1 tiene los encabezados
    // Columnas esperadas: 1: matricula, 2: nombre_completo, 3: carrera
    await client.query('BEGIN');

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const matricula = row.getCell(1).value?.toString().trim();
      const nombre_completo = row.getCell(2).value?.toString().trim();
      const carrera = row.getCell(3).value?.toString().trim();

      if (!matricula || !nombre_completo || !carrera) {
        if (matricula || nombre_completo || carrera) { // Si la fila no está totalmente vacía
           resultados.errores.push(`Fila ${i}: Datos incompletos (requiere matrícula, nombre y carrera).`);
        }
        continue;
      }

      resultados.procesados++;

      try {
        // Insertar en usuarios
        const userInsertQuery = `
          INSERT INTO usuarios (identificador, password_hash, rol, requiere_cambio_password)
          VALUES ($1, $2, 'ALUMNO', true)
          ON CONFLICT (identificador) DO NOTHING
          RETURNING id
        `;
        const userResult = await client.query(userInsertQuery, [matricula, hashGenerico]);
        
        let usuarioId;
        if (userResult.rows.length === 0) {
          // Si el usuario ya existe, obtenemos su ID
          const existingUser = await client.query('SELECT id FROM usuarios WHERE identificador = $1', [matricula]);
          usuarioId = existingUser.rows[0].id;
        } else {
          usuarioId = userResult.rows[0].id;
        }

        // Insertar en alumnos
        const alumnoInsertQuery = `
          INSERT INTO alumnos (matricula, usuario_id, nombre_completo, carrera)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (matricula) DO UPDATE SET
            nombre_completo = EXCLUDED.nombre_completo,
            carrera = EXCLUDED.carrera
        `;
        await client.query(alumnoInsertQuery, [matricula, usuarioId, nombre_completo, carrera]);

        resultados.exitosos++;
      } catch (err: any) {
        resultados.errores.push(`Fila ${i} (${matricula}): ${err.message}`);
      }
    }

    await client.query('COMMIT');

    // Registrar en auditoría
    const usuarioLog = (req as any).usuario.id;
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioLog, 'CARGA_MASIVA_ALUMNOS', `Se procesaron ${resultados.procesados} registros, ${resultados.exitosos} exitosos.`]
    );

    return res.status(200).json({
      mensaje: 'Carga masiva finalizada.',
      resultados
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en cargarAlumnosMasivo:', error);
    return res.status(500).json({ mensaje: 'Error al procesar el archivo Excel.' });
  } finally {
    client.release();
  }
};

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        u.id, u.identificador, u.rol, u.activo, u.creado_en,
        COALESCE(a.nombre_completo, m.nombre_completo, j.nombre_completo, 'Usuario de Vinculación') as nombre_completo
      FROM usuarios u
      LEFT JOIN alumnos a ON u.id = a.usuario_id
      LEFT JOIN maestros m ON u.id = m.usuario_id
      LEFT JOIN jefes_carrera j ON u.id = j.usuario_id
      ORDER BY u.id DESC
    `;
    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    return res.status(500).json({ mensaje: 'Error al obtener usuarios.' });
  }
};

export const crearUsuario = async (req: Request, res: Response) => {
  const { identificador, password, rol, nombre_completo, ...extraData } = req.body;

  if (!identificador || !password || !rol || !nombre_completo) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existUser = await client.query('SELECT id FROM usuarios WHERE identificador = $1', [identificador]);
    if (existUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El identificador ya está en uso.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      'INSERT INTO usuarios (identificador, password_hash, rol, requiere_cambio_password) VALUES ($1, $2, $3, true) RETURNING id',
      [identificador, passwordHash, rol]
    );
    const usuarioId = userResult.rows[0].id;

    if (rol === 'MAESTRO') {
      await client.query(
        'INSERT INTO maestros (usuario_id, nombre_completo, area_adscripcion, cargo, telefono, extension) VALUES ($1, $2, $3, $4, $5, $6)',
        [usuarioId, nombre_completo, extraData.area_adscripcion || 'Sin Área', extraData.cargo || 'Docente', extraData.telefono || null, extraData.extension || null]
      );
    } else if (rol === 'JEFE_CARRERA') {
      await client.query(
        'INSERT INTO jefes_carrera (usuario_id, nombre_completo, carrera) VALUES ($1, $2, $3)',
        [usuarioId, nombre_completo, extraData.carrera || 'General']
      );
    }
    // Vinculacion solo necesita el usuario en 'usuarios', no tiene tabla extra de momento.

    const usuarioAdminId = (req as any).usuario.id;
    await client.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioAdminId, 'CREAR_USUARIO', `Usuario ${identificador} con rol ${rol} creado.`]
    );

    await client.query('COMMIT');
    return res.status(201).json({ mensaje: 'Usuario creado exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en crearUsuario:', error);
    return res.status(500).json({ mensaje: 'Error interno al crear usuario.' });
  } finally {
    client.release();
  }
};

export const toggleEstadoUsuario = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Evitar que el admin se desactive a sí mismo (opcional pero buena práctica)
    const adminId = (req as any).usuario.id;
    if (parseInt(id) === adminId) {
      return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta.' });
    }

    const result = await pool.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id = $1 RETURNING activo, identificador',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    const nuevoEstado = result.rows[0].activo;
    const identificador = result.rows[0].identificador;

    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [adminId, 'CAMBIO_ESTADO_USUARIO', `Usuario ${identificador} (ID: ${id}) ahora es ${nuevoEstado ? 'Activo' : 'Inactivo'}`]
    );

    return res.status(200).json({ 
      mensaje: `Usuario marcado como ${nuevoEstado ? 'activo' : 'inactivo'}.`,
      activo: nuevoEstado
    });
  } catch (error) {
    console.error('Error en toggleEstadoUsuario:', error);
    return res.status(500).json({ mensaje: 'Error al cambiar estado del usuario.' });
  }
};

// ========================
// ADMINISTRACIÓN DE USUARIOS Y CARGA MASIVA
// ========================