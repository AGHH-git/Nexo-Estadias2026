"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlumnosVinculacion = exports.getAlumnosJefe = exports.getTramiteGlobal = exports.aperturarPeriodo = exports.evaluarTramiteMaestro = exports.getTramiteMaestro = exports.asignarMaestro = exports.getMaestrosDisponibles = exports.getMaestroStats = exports.getJefeStats = exports.getVinculacionStats = void 0;
const database_1 = require("../config/database");
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
        const jefeResult = await database_1.pool.query('SELECT carrera FROM jefes_carrera WHERE usuario_id = $1', [usuarioId]);
        if (jefeResult.rows.length === 0) {
            return res.status(403).json({ mensaje: 'El jefe de carrera no tiene una carrera asignada en el sistema.' });
        }
        const carreraJefe = jefeResult.rows[0].carrera;
        const alumnosResult = await database_1.pool.query('SELECT COUNT(*) as total FROM alumnos WHERE carrera = $1', [carreraJefe]);
        const asignadosResult = await database_1.pool.query(`
      SELECT COUNT(DISTINCT t.matricula) as total 
      FROM tramites_estadia t
      JOIN alumnos a ON t.matricula = a.matricula
      WHERE t.maestro_id IS NOT NULL AND a.carrera = $1
    `, [carreraJefe]);
        const total = parseInt(alumnosResult.rows[0].total) || 0;
        const asignados = parseInt(asignadosResult.rows[0].total) || 0;
        const pendientes = total - asignados;
        const pendientesList = await database_1.pool.query(`
      SELECT a.matricula, a.nombre_completo, a.carrera 
      FROM alumnos a
      LEFT JOIN tramites_estadia t ON a.matricula = t.matricula
      WHERE a.carrera = $1 AND (t.maestro_id IS NULL OR t.id IS NULL)
      LIMIT 10
    `, [carreraJefe]);
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
        // 2. Verificar si el alumno ya tiene un trámite
        const checkTramite = await database_1.pool.query('SELECT id FROM tramites_estadia WHERE matricula = $1', [matricula]);
        if (checkTramite.rows.length > 0) {
            // Actualizar el maestro asignado
            await database_1.pool.query('UPDATE tramites_estadia SET maestro_id = $1 WHERE matricula = $2', [maestro_id, matricula]);
        }
        else {
            // Crear el registro base para que el alumno pueda iniciar su trámite (Se le asigna estatus Borrador)
            await database_1.pool.query('INSERT INTO tramites_estadia (matricula, maestro_id, estatus) VALUES ($1, $2, $3)', [matricula, maestro_id, 'Borrador']);
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
             a.nombre_completo as alumno_nombre, a.carrera, a.telefono as alumno_telefono, a.nss, a.campus
      FROM tramites_estadia t
      JOIN alumnos a ON t.matricula = a.matricula
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
    const { estatus, comentarios } = req.body;
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
        // Actualizar el estatus
        await database_1.pool.query('UPDATE tramites_estadia SET estatus = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2', [estatus, tramiteId]);
        // Si hay observaciones o si se rechazó, guardar en el historial
        if (comentarios || estatus === 'Rechazado Digital') {
            const msg = comentarios || 'Trámite rechazado por observaciones generales.';
            await database_1.pool.query('INSERT INTO historial_observaciones (tramite_id, maestro_id, comentarios) VALUES ($1, $2, $3)', [tramiteId, maestroId, msg]);
        }
        // Registrar en auditoria
        await database_1.pool.query('INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [usuarioId, 'EVALUACION_TRAMITE', `Maestro ID ${maestroId} cambió estatus de matrícula ${matricula} a ${estatus}`]);
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
        await client.query('INSERT INTO periodos (nombre, anio, activo, fecha_inicio, fecha_fin) VALUES ($1, $2, true, $3, $4)', [nombre, anio, fecha_inicio || null, fecha_fin || null]);
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
             a.nombre_completo as alumno_nombre, a.carrera, a.telefono as alumno_telefono, a.nss as alumno_nss, a.campus
      FROM tramites_estadia t
      JOIN alumnos a ON t.matricula = a.matricula
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
        const jefeResult = await database_1.pool.query('SELECT carrera FROM jefes_carrera WHERE usuario_id = $1', [usuarioId]);
        if (jefeResult.rows.length === 0) {
            return res.status(403).json({ mensaje: 'El jefe de carrera no tiene una carrera asignada.' });
        }
        const carreraJefe = jefeResult.rows[0].carrera;
        const listaResult = await database_1.pool.query(`
      SELECT a.matricula, a.nombre_completo, a.carrera, 
             COALESCE(t.estatus, 'Sin Registro') as estatus,
             m.nombre_completo as maestro_nombre
      FROM alumnos a
      LEFT JOIN tramites_estadia t ON a.matricula = t.matricula
      LEFT JOIN maestros m ON t.maestro_id = m.id
      WHERE a.carrera = $1
      ORDER BY a.nombre_completo ASC
    `, [carreraJefe]);
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
      SELECT a.matricula, a.nombre_completo, a.carrera, 
             COALESCE(t.estatus, 'Sin Registro') as estatus,
             m.nombre_completo as maestro_nombre
      FROM alumnos a
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
