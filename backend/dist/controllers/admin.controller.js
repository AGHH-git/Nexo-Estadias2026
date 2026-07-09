"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aprobarDocumento = exports.asignarMaestroMasivo = exports.desasignarMaestro = exports.getMaestrosConAlumnos = exports.getAlumnosVinculacion = exports.getAlumnosJefe = exports.getTramiteGlobal = exports.aperturarPeriodo = exports.evaluarTramiteMaestro = exports.getTramiteMaestro = exports.asignarMaestro = exports.getMaestrosDisponibles = exports.getMaestroStats = exports.getJefeStats = exports.getVinculacionStats = void 0;
const database_1 = require("../config/database");
// ========================
// VINCULACION
// ========================
const getVinculacionStats = async (req, res) => {
    try {
        const alumnosResult = await database_1.pool.query('SELECT COUNT(*) as total FROM alumnos');
        const periodoResult = await database_1.pool.query('SELECT nombre, anio FROM periodos WHERE activo = true LIMIT 1');
        const tramitesResult = await database_1.pool.query(`
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener estadísticas de vinculación' });
    }
};
exports.getVinculacionStats = getVinculacionStats;
const getJefeStats = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        // Obtener la carrera asignada al jefe
        const jefeResult = await database_1.pool.query(`
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
        const alumnosResult = await database_1.pool.query('SELECT COUNT(*) as total FROM alumnos WHERE carrera_id = $1', [carreraIdJefe]);
        const asignadosResult = await database_1.pool.query(`
      SELECT COUNT(DISTINCT t.matricula) as total 
      FROM tramites_estadia t
      JOIN alumnos a ON t.matricula = a.matricula
      WHERE t.maestro_id IS NOT NULL AND a.carrera_id = $1
    `, [carreraIdJefe]);
        const total = parseInt(alumnosResult.rows[0].total) || 0;
        const asignados = parseInt(asignadosResult.rows[0].total) || 0;
        const pendientes = total - asignados;
        const pendientesList = await database_1.pool.query(`
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener estadísticas de jefe' });
    }
};
exports.getJefeStats = getJefeStats;
const getMaestroStats = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const maestroIdResult = await database_1.pool.query('SELECT id FROM maestros WHERE usuario_id = $1', [usuarioId]);
        if (maestroIdResult.rows.length === 0) {
            return res.json({ mis_alumnos: 0, aprobados: 0, pendientes: 0, observaciones: 0, lista: [] });
        }
        const maestroId = maestroIdResult.rows[0].id;
        const statsResult = await database_1.pool.query(`
      SELECT 
        COUNT(DISTINCT matricula) as mis_alumnos,
        SUM(CASE WHEN estatus = 'Aprobado para Firmas' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN estatus = 'En Revisión Digital' THEN 1 ELSE 0 END) as pendientes
      FROM tramites_estadia
      WHERE maestro_id = $1
    `, [maestroId]);
        const listaResult = await database_1.pool.query(`
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener estadísticas de maestro' });
    }
};
exports.getMaestroStats = getMaestroStats;
const getMaestrosDisponibles = async (req, res) => {
    try {
        const result = await database_1.pool.query('SELECT id, nombre_completo, area_adscripcion, cargo FROM maestros ORDER BY nombre_completo ASC');
        return res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener maestros' });
    }
};
exports.getMaestrosDisponibles = getMaestrosDisponibles;
const asignarMaestro = async (req, res) => {
    const { matricula, maestro_id } = req.body;
    if (!matricula || !maestro_id) {
        return res.status(400).json({ mensaje: 'Faltan datos obligatorios para la asignación.' });
    }
    try {
        // 1. Validar que la matrícula y el maestro existan
        const alumnoCheck = await database_1.pool.query('SELECT matricula FROM alumnos WHERE matricula = $1', [matricula]);
        if (alumnoCheck.rows.length === 0) {
            return res.status(404).json({ mensaje: 'El alumno no existe.' });
        }
        const maestroCheck = await database_1.pool.query('SELECT id FROM maestros WHERE id = $1', [maestro_id]);
        if (maestroCheck.rows.length === 0) {
            return res.status(404).json({ mensaje: 'El maestro no existe.' });
        }
        const periodoResult = await database_1.pool.query('SELECT id FROM periodos WHERE activo = true LIMIT 1');
        if (periodoResult.rows.length === 0) {
            return res.status(400).json({ mensaje: 'No hay un periodo activo. Aperture un periodo primero.' });
        }
        const periodoId = periodoResult.rows[0].id;
        // 2. Verificar si el alumno ya tiene un trámite
        const checkTramite = await database_1.pool.query('SELECT id FROM tramites_estadia WHERE matricula = $1', [matricula]);
        if (checkTramite.rows.length > 0) {
            // Actualizar el maestro asignado
            await database_1.pool.query('UPDATE tramites_estadia SET maestro_id = $1 WHERE matricula = $2', [maestro_id, matricula]);
        }
        else {
            // Crear el registro base para que el alumno pueda iniciar su trámite (Se le asigna estatus Borrador)
            await database_1.pool.query('INSERT INTO tramites_estadia (matricula, maestro_id, estatus, periodo_id) VALUES ($1, $2, $3, $4)', [matricula, maestro_id, 'Borrador', periodoId]);
        }
        // 3. Registrar acción en la auditoría
        const usuarioId = req.usuario.id;
        await database_1.pool.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuarioId, 'ASIGNACION_MAESTRO', `Asignó al maestro ID ${maestro_id} al alumno ${matricula}`]);
        return res.json({ mensaje: 'Asesor académico asignado correctamente.' });
    }
    catch (error) {
        console.error('Error en asignarMaestro:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar la asignación.' });
    }
};
exports.asignarMaestro = asignarMaestro;
const getTramiteMaestro = async (req, res) => {
    const { matricula } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const maestroIdResult = await database_1.pool.query('SELECT id FROM maestros WHERE usuario_id = $1', [usuarioId]);
        if (maestroIdResult.rows.length === 0)
            return res.status(403).json({ mensaje: 'Acceso denegado: No es maestro' });
        const maestroId = maestroIdResult.rows[0].id;
        // Obtener detalles del trámite
        const tramiteResult = await database_1.pool.query(`
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
        const observacionesResult = await database_1.pool.query('SELECT comentarios, fecha FROM historial_observaciones WHERE tramite_id = $1 ORDER BY fecha DESC', [tramiteResult.rows[0].id]);
        return res.json({
            ...tramiteResult.rows[0],
            observaciones: observacionesResult.rows
        });
    }
    catch (error) {
        console.error('Error al obtener el trámite:', error);
        res.status(500).json({ mensaje: 'Error al cargar los datos del trámite' });
    }
};
exports.getTramiteMaestro = getTramiteMaestro;
const evaluarTramiteMaestro = async (req, res) => {
    const { matricula } = req.params;
    const { estatus, comentarios, nss_rechazado, ine_tutor_rechazado } = req.body;
    const usuarioId = req.usuario.id;
    if (!estatus) {
        return res.status(400).json({ mensaje: 'El estatus es requerido' });
    }
    try {
        const maestroIdResult = await database_1.pool.query('SELECT id FROM maestros WHERE usuario_id = $1', [usuarioId]);
        if (maestroIdResult.rows.length === 0)
            return res.status(403).json({ mensaje: 'Acceso denegado' });
        const maestroId = maestroIdResult.rows[0].id;
        const tramiteResult = await database_1.pool.query('SELECT id FROM tramites_estadia WHERE matricula = $1 AND maestro_id = $2', [matricula, maestroId]);
        if (tramiteResult.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Trámite no encontrado' });
        }
        const tramiteId = tramiteResult.rows[0].id;
        const isRechazado = estatus === 'Rechazado Digital';
        const nssRech = isRechazado ? !!nss_rechazado : false;
        const ineRech = isRechazado ? !!ine_tutor_rechazado : false;
        // Actualizar el estatus y las banderas
        await database_1.pool.query(`UPDATE tramites_estadia 
       SET estatus = $1, 
           nss_rechazado = $2, 
           ine_tutor_rechazado = $3, 
           fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $4`, [estatus, nssRech, ineRech, tramiteId]);
        // Si hay observaciones o si se rechazó, guardar en el historial
        if (comentarios || estatus === 'Rechazado Digital') {
            const msg = comentarios || 'Trámite rechazado por observaciones generales.';
            await database_1.pool.query('INSERT INTO historial_observaciones (tramite_id, maestro_id, comentarios) VALUES ($1, $2, $3)', [tramiteId, maestroId, msg]);
        }
        // Registrar en auditoria
        await database_1.pool.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuarioId, 'EVALUACION_TRAMITE', `Maestro ID ${maestroId} cambió estatus de matrícula ${matricula} a ${estatus} (NSS Rechazado: ${nssRech}, INE Rechazado: ${ineRech})`]);
        return res.json({ mensaje: 'La evaluación se ha guardado correctamente' });
    }
    catch (error) {
        console.error('Error al evaluar el trámite:', error);
        res.status(500).json({ mensaje: 'Error interno al evaluar el trámite' });
    }
};
exports.evaluarTramiteMaestro = evaluarTramiteMaestro;
const aperturarPeriodo = async (req, res) => {
    const { nombre, anio, fecha_inicio, fecha_fin } = req.body;
    const usuarioId = req.usuario.id;
    if (!nombre || !anio) {
        return res.status(400).json({ mensaje: 'El nombre y el año del periodo son obligatorios.' });
    }
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Desactivar todos los periodos anteriores
        await client.query('UPDATE periodos SET activo = false');
        // Crear el nuevo periodo y activarlo
        await client.query('INSERT INTO periodos (nombre, anio, activo) VALUES ($1, $2, true)', [nombre, anio]);
        // Registrar en auditoría
        await client.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuarioId, 'APERTURA_PERIODO', `Aperturó el periodo ${nombre} ${anio}`]);
        await client.query('COMMIT');
        return res.json({ mensaje: 'El nuevo periodo ha sido aperturado y activado exitosamente.' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al aperturar periodo:', error);
        res.status(500).json({ mensaje: 'Error interno al aperturar el nuevo periodo.' });
    }
    finally {
        client.release();
    }
};
exports.aperturarPeriodo = aperturarPeriodo;
const getTramiteGlobal = async (req, res) => {
    const { matricula } = req.params;
    try {
        const tramiteResult = await database_1.pool.query(`
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
        const observacionesResult = await database_1.pool.query('SELECT comentarios, fecha FROM historial_observaciones WHERE tramite_id = $1 ORDER BY fecha DESC', [tramiteResult.rows[0].id]);
        return res.json({
            ...tramiteResult.rows[0],
            observaciones: observacionesResult.rows
        });
    }
    catch (error) {
        console.error('Error al obtener el trámite global:', error);
        res.status(500).json({ mensaje: 'Error al cargar los datos del trámite' });
    }
};
exports.getTramiteGlobal = getTramiteGlobal;
const getAlumnosJefe = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const jefeResult = await database_1.pool.query(`
      SELECT j.carrera_id, c.nombre as carrera 
      FROM jefes_carrera j
      LEFT JOIN cat_carreras c ON j.carrera_id = c.id
      WHERE j.usuario_id = $1
    `, [usuarioId]);
        if (jefeResult.rows.length === 0) {
            return res.status(403).json({ mensaje: 'El jefe de carrera no tiene una carrera asignada.' });
        }
        const carreraIdJefe = jefeResult.rows[0].carrera_id;
        const listaResult = await database_1.pool.query(`
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
    }
    catch (error) {
        console.error('Error al obtener alumnos del jefe:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
exports.getAlumnosJefe = getAlumnosJefe;
const getAlumnosVinculacion = async (req, res) => {
    try {
        const listaResult = await database_1.pool.query(`
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
    }
    catch (error) {
        console.error('Error al obtener alumnos para vinculacion:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
exports.getAlumnosVinculacion = getAlumnosVinculacion;
// ========================
// JEFE DE CARRERA - ASIGNACIONES AVANZADAS
// ========================
/**
 * Obtiene la lista de maestros con sus alumnos asignados agrupados.
 * Para el panel de Asignaciones del Jefe de Carrera.
 */
const getMaestrosConAlumnos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const jefeResult = await database_1.pool.query(`
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
        const maestrosResult = await database_1.pool.query('SELECT id, nombre_completo, area_adscripcion, cargo, telefono, extension FROM maestros ORDER BY nombre_completo ASC');
        // Obtener todos los alumnos de la carrera con su asignación
        const alumnosResult = await database_1.pool.query(`
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
        const maestrosConAlumnos = maestrosResult.rows.map((maestro) => {
            const alumnosDelMaestro = alumnosResult.rows.filter((a) => a.maestro_id === maestro.id);
            return {
                ...maestro,
                alumnos_asignados: alumnosDelMaestro,
                total_asignados: alumnosDelMaestro.length
            };
        });
        // Alumnos sin maestro asignado
        const alumnosSinAsignar = alumnosResult.rows.filter((a) => a.maestro_id === null);
        return res.json({
            maestros: maestrosConAlumnos,
            alumnos_sin_asignar: alumnosSinAsignar,
            total_alumnos: alumnosResult.rows.length,
            total_sin_asignar: alumnosSinAsignar.length,
            carrera: carreraJefe
        });
    }
    catch (error) {
        console.error('Error al obtener maestros con alumnos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
exports.getMaestrosConAlumnos = getMaestrosConAlumnos;
/**
 * Desasignar un maestro de un alumno (poner maestro_id = NULL en el trámite)
 */
const desasignarMaestro = async (req, res) => {
    const { matricula } = req.body;
    if (!matricula) {
        return res.status(400).json({ mensaje: 'La matrícula del alumno es obligatoria.' });
    }
    try {
        const result = await database_1.pool.query('UPDATE tramites_estadia SET maestro_id = NULL WHERE matricula = $1 RETURNING id', [matricula]);
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró un trámite para ese alumno.' });
        }
        // Registrar en auditoría
        const usuarioId = req.usuario.id;
        await database_1.pool.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuarioId, 'DESASIGNACION_MAESTRO', `Desvinculó al maestro del alumno ${matricula}`]);
        return res.json({ mensaje: 'Maestro desvinculado correctamente del alumno.' });
    }
    catch (error) {
        console.error('Error al desasignar maestro:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar la desvinculación.' });
    }
};
exports.desasignarMaestro = desasignarMaestro;
/**
 * Asignar un maestro a múltiples alumnos de manera masiva
 */
const asignarMaestroMasivo = async (req, res) => {
    const { maestro_id, matriculas } = req.body;
    if (!maestro_id || !matriculas || !Array.isArray(matriculas) || matriculas.length === 0) {
        return res.status(400).json({ mensaje: 'Se requiere el ID del maestro y una lista de matrículas.' });
    }
    const client = await database_1.pool.connect();
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
            }
            else {
                await client.query('INSERT INTO tramites_estadia (matricula, maestro_id, estatus, periodo_id) VALUES ($1, $2, $3, $4)', [matricula, maestro_id, 'Borrador', periodoId]);
            }
            asignados++;
        }
        // Registrar en auditoría
        const usuarioId = req.usuario.id;
        await client.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuarioId, 'ASIGNACION_MASIVA', `Asignó ${asignados} alumnos al maestro ${maestroCheck.rows[0].nombre_completo} (ID: ${maestro_id})`]);
        await client.query('COMMIT');
        return res.json({ mensaje: `Se asignaron ${asignados} alumnos correctamente al maestro.`, asignados });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en asignación masiva:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar la asignación masiva.' });
    }
    finally {
        client.release();
    }
};
exports.asignarMaestroMasivo = asignarMaestroMasivo;
/**
 * Aprobar un documento individual (NSS, INE Tutor o Evidencia) por Maestro o Jefe de Carrera.
 * Registra el nombre del usuario y la fecha/hora de aprobación.
 */
const aprobarDocumento = async (req, res) => {
    const { tramite_id, documento, rol } = req.body;
    const usuarioId = req.usuario.id;
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
            const maestroResult = await database_1.pool.query('SELECT nombre_completo FROM maestros WHERE usuario_id = $1', [usuarioId]);
            if (maestroResult.rows.length === 0) {
                return res.status(403).json({ mensaje: 'El usuario no es un maestro registrado.' });
            }
            nombreAprobador = maestroResult.rows[0].nombre_completo;
        }
        else if (rol === 'jefe') {
            const jefeResult = await database_1.pool.query(`
        SELECT m.nombre_completo 
        FROM jefes_carrera j
        JOIN maestros m ON m.usuario_id = j.usuario_id
        WHERE j.usuario_id = $1
      `, [usuarioId]);
            if (jefeResult.rows.length === 0) {
                // Intentar obtener nombre de maestros directamente
                const maestroResult = await database_1.pool.query('SELECT nombre_completo FROM maestros WHERE usuario_id = $1', [usuarioId]);
                if (maestroResult.rows.length > 0) {
                    nombreAprobador = maestroResult.rows[0].nombre_completo;
                }
                else {
                    // Usar identificador del usuario como fallback
                    const userResult = await database_1.pool.query('SELECT identificador FROM usuarios WHERE id = $1', [usuarioId]);
                    nombreAprobador = userResult.rows[0]?.identificador || 'Jefe de Carrera';
                }
            }
            else {
                nombreAprobador = jefeResult.rows[0].nombre_completo;
            }
        }
        // Validar que el trámite existe y tiene el documento
        const tramiteResult = await database_1.pool.query('SELECT id, ruta_nss, ruta_ine_tutor, ruta_evidencia FROM tramites_estadia WHERE id = $1', [tramite_id]);
        if (tramiteResult.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Trámite no encontrado.' });
        }
        const tramite = tramiteResult.rows[0];
        const rutaMap = {
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
        await database_1.pool.query(`UPDATE tramites_estadia 
       SET ${colAprobado} = TRUE, 
           ${colNombre} = $1, 
           ${colFecha} = CURRENT_TIMESTAMP,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $2`, [nombreAprobador, tramite_id]);
        // Registrar en auditoría
        await database_1.pool.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [
            usuarioId,
            'APROBACION_DOCUMENTO',
            `${nombreAprobador} (${rol}) aprobó el documento "${documento}" del trámite ID ${tramite_id}`
        ]);
        // Retornar la aprobación registrada con timestamp
        const updatedResult = await database_1.pool.query(`SELECT ${colAprobado} as aprobado, ${colNombre} as nombre, ${colFecha} as fecha FROM tramites_estadia WHERE id = $1`, [tramite_id]);
        return res.json({
            mensaje: `Documento "${documento}" aprobado correctamente por ${nombreAprobador}.`,
            aprobacion: updatedResult.rows[0]
        });
    }
    catch (error) {
        console.error('Error al aprobar documento:', error);
        return res.status(500).json({ mensaje: 'Error interno al registrar la aprobación del documento.' });
    }
};
exports.aprobarDocumento = aprobarDocumento;
