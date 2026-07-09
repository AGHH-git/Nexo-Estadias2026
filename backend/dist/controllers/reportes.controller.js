"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReporteCategorias = exports.getReportePeriodos = exports.getReporteCarreras = exports.descargarReporteExcel = exports.getReporteStats = void 0;
const database_1 = require("../config/database");
const exceljs_1 = __importDefault(require("exceljs"));
// Auxiliar para verificar rol y carrera del jefe
async function getJefeCarreraId(usuarioId) {
    const result = await database_1.pool.query('SELECT carrera_id FROM jefes_carrera WHERE usuario_id = $1', [usuarioId]);
    return result.rows.length > 0 ? result.rows[0].carrera_id : null;
}
const getReporteStats = async (req, res) => {
    try {
        const usuario = req.usuario;
        let carreraId = req.query.carrera_id ? parseInt(req.query.carrera_id, 10) : null;
        const estatus = req.query.estatus || null;
        const periodoId = req.query.periodo_id ? parseInt(req.query.periodo_id, 10) : null;
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
        const params = [];
        let paramIndex = 1;
        if (periodoId) {
            queryText += ` LEFT JOIN tramites_estadia t ON a.matricula = t.matricula AND t.periodo_id = $${paramIndex} `;
            params.push(periodoId);
            paramIndex++;
        }
        else {
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
        const result = await database_1.pool.query(queryText, params);
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
        allRows.forEach((row) => {
            if (row.estatus === 'Borrador')
                stats.borrador++;
            else if (row.estatus === 'En Revisión Digital')
                stats.revision++;
            else if (row.estatus === 'Rechazado Digital')
                stats.rechazado++;
            else if (row.estatus === 'Aprobado para Firmas')
                stats.aprobado_firmas++;
            else if (row.estatus === 'Completado')
                stats.completado++;
            else
                stats.sin_registro++;
        });
        // Ahora aplicamos el filtro de estatus para las filas que retornamos
        let filteredRows = allRows;
        if (estatus) {
            filteredRows = allRows.filter((row) => row.estatus === estatus);
        }
        return res.json({
            alumnos: filteredRows,
            stats
        });
    }
    catch (error) {
        console.error('Error en getReporteStats:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al procesar estadísticas de reporte.' });
    }
};
exports.getReporteStats = getReporteStats;
const descargarReporteExcel = async (req, res) => {
    try {
        const usuario = req.usuario;
        let carreraId = req.query.carrera_id ? parseInt(req.query.carrera_id, 10) : null;
        const estatus = req.query.estatus || null;
        const periodoId = req.query.periodo_id ? parseInt(req.query.periodo_id, 10) : null;
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
        const params = [];
        let paramIndex = 1;
        if (periodoId) {
            queryText += ` LEFT JOIN tramites_estadia t ON a.matricula = t.matricula AND t.periodo_id = $${paramIndex} `;
            params.push(periodoId);
            paramIndex++;
        }
        else {
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
        if (estatus) {
            if (estatus === 'Sin Registro') {
                queryText += ` AND t.id IS NULL`;
            }
            else {
                queryText += ` AND t.estatus = $${paramIndex}`;
                params.push(estatus);
                paramIndex++;
            }
        }
        queryText += ` ORDER BY a.nombre_completo ASC`;
        const result = await database_1.pool.query(queryText, params);
        const data = result.rows;
        // Crear libro Excel
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Estadías');
        // Configurar columnas
        worksheet.columns = [
            { header: 'Matrícula', key: 'matricula', width: 15 },
            { header: 'Alumno', key: 'alumno_nombre', width: 30 },
            { header: 'Carrera', key: 'carrera_nombre', width: 35 },
            { header: 'Campus', key: 'campus_nombre', width: 15 },
            { header: 'Sistema', key: 'sistema_nombre', width: 15 },
            { header: 'Teléfono', key: 'alumno_telefono', width: 15 },
            { header: 'NSS', key: 'alumno_nss', width: 15 },
            { header: 'Estatus del Trámite', key: 'estatus', width: 22 },
            { header: 'Asesor Académico', key: 'maestro_nombre', width: 28 },
            { header: 'Empresa', key: 'empresa_nombre', width: 30 },
            { header: 'Modalidad Estadía', key: 'modalidad_estadia', width: 18 },
            { header: 'Título del Proyecto', key: 'titulo_proyecto', width: 40 },
            { header: 'Asesor Industrial', key: 'asesor_ind_nombre', width: 28 },
            { header: 'Cargo Asesor Ind.', key: 'asesor_ind_cargo', width: 22 },
            { header: 'Email Asesor Ind.', key: 'asesor_ind_email', width: 25 },
            { header: 'Periodo', key: 'periodo_nombre', width: 20 }
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
        // Agregar filas y dar estilos
        data.forEach((row, index) => {
            const newRow = worksheet.addRow(row);
            newRow.height = 20;
            // Color alterno para filas (cebreado)
            const bgColor = index % 2 === 0 ? 'FFFFFF' : 'FDF0F4'; // Color vino extra claro
            newRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
                cell.font = {
                    size: 10,
                    name: 'Arial'
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'left'
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'E8D5DA' } },
                    left: { style: 'thin', color: { argb: 'E8D5DA' } },
                    bottom: { style: 'thin', color: { argb: 'E8D5DA' } },
                    right: { style: 'thin', color: { argb: 'E8D5DA' } }
                };
            });
        });
        // Enviar respuesta binaria
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-estadias-${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('Error en descargarReporteExcel:', error);
        res.status(500).json({ mensaje: 'Error al generar el archivo Excel.' });
    }
};
exports.descargarReporteExcel = descargarReporteExcel;
const getReporteCarreras = async (req, res) => {
    try {
        const result = await database_1.pool.query('SELECT id, nombre, nivel_academico FROM cat_carreras ORDER BY nombre ASC');
        return res.json(result.rows);
    }
    catch (error) {
        console.error('Error en getReporteCarreras:', error);
        res.status(500).json({ mensaje: 'Error al obtener las carreras.' });
    }
};
exports.getReporteCarreras = getReporteCarreras;
const getReportePeriodos = async (req, res) => {
    try {
        const result = await database_1.pool.query('SELECT id, nombre, anio, activo FROM periodos ORDER BY anio DESC, nombre DESC');
        return res.json(result.rows);
    }
    catch (error) {
        console.error('Error en getReportePeriodos:', error);
        res.status(500).json({ mensaje: 'Error al obtener los periodos.' });
    }
};
exports.getReportePeriodos = getReportePeriodos;
const getReporteCategorias = async (req, res) => {
    try {
        const categorias = ['Sin Registro', 'Borrador', 'En Revisión Digital', 'Rechazado Digital', 'Aprobado para Firmas', 'Completado'];
        return res.json(categorias);
    }
    catch (error) {
        console.error('Error en getReporteCategorias:', error);
        res.status(500).json({ mensaje: 'Error al obtener categorías.' });
    }
};
exports.getReporteCategorias = getReporteCategorias;
