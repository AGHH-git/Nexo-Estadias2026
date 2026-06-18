"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVacante = exports.getVacantes = void 0;
const database_1 = require("../config/database");
const getVacantes = async (req, res) => {
    try {
        const result = await database_1.pool.query('SELECT id, titulo, empresa_nombre, descripcion, foto_url, creado_en FROM vacantes ORDER BY creado_en DESC');
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener vacantes:', error);
        res.status(500).json({ mensaje: 'Error interno al obtener las vacantes' });
    }
};
exports.getVacantes = getVacantes;
const createVacante = async (req, res) => {
    try {
        const { titulo, empresa_nombre, descripcion } = req.body;
        const file = req.file;
        if (!titulo || !empresa_nombre || !descripcion) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }
        let foto_url = null;
        if (file) {
            foto_url = `/storage/vacantes/${file.filename}`;
        }
        const result = await database_1.pool.query('INSERT INTO vacantes (titulo, empresa_nombre, descripcion, foto_url) VALUES ($1, $2, $3, $4) RETURNING *', [titulo, empresa_nombre, descripcion, foto_url]);
        res.status(201).json({ mensaje: 'Vacante creada exitosamente', vacante: result.rows[0] });
    }
    catch (error) {
        console.error('Error al crear vacante:', error);
        res.status(500).json({ mensaje: 'Error interno al crear la vacante' });
    }
};
exports.createVacante = createVacante;
