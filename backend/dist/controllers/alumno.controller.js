"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerPerfil = void 0;
const database_1 = require("../config/database");
const obtenerPerfil = async (req, res) => {
    if (!req.usuario) {
        return res.status(401).json({ mensaje: 'No autorizado. Faltan datos de sesión.' });
    }
    try {
        // Buscar los datos del alumno vinculados con el usuario autenticado
        const queryAlumno = `
      SELECT 
        a.matricula,
        a.nombre_completo,
        c.nombre as carrera,
        camp.nombre as campus,
        mod.nombre as sistema,
        a.nss,
        a.telefono,
        u.identificador
      FROM alumnos a
      INNER JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN cat_carreras c ON a.carrera_id = c.id
      LEFT JOIN cat_campus camp ON a.campus_id = camp.id
      LEFT JOIN cat_modalidades mod ON a.modalidad_id = mod.id
      WHERE u.id = $1
    `;
        const resultAlumno = await database_1.pool.query(queryAlumno, [req.usuario.id]);
        if (resultAlumno.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Los datos del alumno no fueron encontrados.' });
        }
        const alumno = resultAlumno.rows[0];
        // Buscar si ya tiene un trámite registrado para saber si hay un asesor académico asignado
        const queryAsesor = `
      SELECT m.nombre_completo as asesor_nombre, m.area_adscripcion, m.cargo
      FROM tramites_estadia t
      INNER JOIN maestros m ON t.maestro_id = m.id
      WHERE t.matricula = $1
      ORDER BY t.fecha_registro DESC
      LIMIT 1
    `;
        const resultAsesor = await database_1.pool.query(queryAsesor, [alumno.matricula]);
        const asesorAsignado = resultAsesor.rows.length > 0
            ? resultAsesor.rows[0].asesor_nombre
            : 'No asignado aún';
        const queryPeriodo = `SELECT nombre, anio FROM periodos WHERE activo = true LIMIT 1`;
        const resultPeriodo = await database_1.pool.query(queryPeriodo);
        const periodo = resultPeriodo.rows.length > 0 ? resultPeriodo.rows[0] : null;
        return res.status(200).json({
            matricula: alumno.matricula,
            nombre_completo: alumno.nombre_completo,
            carrera: alumno.carrera,
            campus: alumno.campus,
            sistema: alumno.sistema,
            nss: alumno.nss,
            telefono: alumno.telefono,
            email: alumno.identificador,
            asesor_academico: asesorAsignado,
            periodo_nombre: periodo?.nombre || '',
            periodo_anio: periodo?.anio || null
        });
    }
    catch (error) {
        console.error('Error al obtener perfil del alumno:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los datos del perfil.' });
    }
};
exports.obtenerPerfil = obtenerPerfil;
