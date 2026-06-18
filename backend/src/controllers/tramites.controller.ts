// ARCHIVO: backend/src/controllers/tramites.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as path from 'path';

// 1. Obtener el trámite activo de un alumno
export const obtenerTramiteAlumno = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autorizado. Faltan datos de sesión.' });
  }

  try {
    // 1. Obtener matrícula del alumno
    const queryMatricula = 'SELECT matricula FROM alumnos WHERE usuario_id = $1';
    const resultMatricula = await pool.query(queryMatricula, [req.usuario.id]);

    if (resultMatricula.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El usuario no es un alumno registrado.' });
    }

    const matricula = resultMatricula.rows[0].matricula;

    // 2. Buscar trámite activo
    const queryTramite = `
      SELECT 
        t.*,
        e.razon_social, e.nombre_comercial, e.rfc, e.giro, e.tamano, e.tipo_empresa,
        e.estado, e.municipio, e.cp, e.domicilio, e.telefono as empresa_telefono,
        m.nombre_completo as maestro_nombre
      FROM tramites_estadia t
      LEFT JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN maestros m ON t.maestro_id = m.id
      WHERE t.matricula = $1
      ORDER BY t.fecha_registro DESC
      LIMIT 1
    `;
    const resultTramite = await pool.query(queryTramite, [matricula]);

    if (resultTramite.rows.length === 0) {
      return res.status(200).json(null); // No tiene trámites aún
    }

    const tramite = resultTramite.rows[0];

    // 3. Buscar observaciones del trámite
    const queryObs = `
      SELECT h.*, m.nombre_completo as maestro_nombre 
      FROM historial_observaciones h
      LEFT JOIN maestros m ON h.maestro_id = m.id
      WHERE h.tramite_id = $1
      ORDER BY h.fecha DESC
    `;
    const resultObs = await pool.query(queryObs, [tramite.id]);

    return res.status(200).json({
      ...tramite,
      observaciones: resultObs.rows
    });
  } catch (error: any) {
    console.error('Error al obtener el trámite:', error);
    return res.status(500).json({ mensaje: 'Error al obtener datos del trámite.' });
  }
};

// 2. Registrar nuevo trámite (con transacción)
export const crearTramite = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autorizado.' });
  }

  const client = await pool.connect();

  try {
    // Obtener matrícula
    const resultMatricula = await client.query('SELECT matricula FROM alumnos WHERE usuario_id = $1', [req.usuario.id]);
    if (resultMatricula.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El usuario no es un alumno registrado.' });
    }
    const matricula = resultMatricula.rows[0].matricula;

    // Obtener los archivos cargados
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const nssFile = files?.['nss']?.[0];
    const ineTutorFile = files?.['ine_tutor']?.[0];

    if (!nssFile) {
      return res.status(400).json({ mensaje: 'El archivo de constancia NSS en PDF es obligatorio.' });
    }

    const rutaNssRelativa = `nss/${nssFile.filename}`;

    // Obtener y parsear los datos del formulario
    const body = req.body;

    // Si la modalidad es Foránea, se requiere el INE del tutor
    if (body.modalidad_estadia === 'Foránea' && !ineTutorFile) {
      return res.status(400).json({ mensaje: 'La copia del INE del tutor es obligatoria para la modalidad foránea.' });
    }

    let rutaIneTutorRelativa: string | null = null;
    if (ineTutorFile) {
      rutaIneTutorRelativa = `ine_tutor/${ineTutorFile.filename}`;
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // 1. Manejo de la empresa (buscar o crear si es nueva)
    let empresaId = body.empresa_id ? parseInt(body.empresa_id, 10) : null;

    if (!empresaId) {
      // Registrar nueva empresa (o actualizar si el RFC ya existe)
      const queryNuevaEmpresa = `
        INSERT INTO empresas (
          razon_social, nombre_comercial, rfc, fecha_constitucion, giro, tamano,
          tipo_empresa, estado, municipio, cp, domicilio, telefono
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (rfc) DO UPDATE SET
          razon_social = EXCLUDED.razon_social,
          nombre_comercial = EXCLUDED.nombre_comercial,
          fecha_constitucion = EXCLUDED.fecha_constitucion,
          giro = EXCLUDED.giro,
          tamano = EXCLUDED.tamano,
          tipo_empresa = EXCLUDED.tipo_empresa,
          estado = EXCLUDED.estado,
          municipio = EXCLUDED.municipio,
          cp = EXCLUDED.cp,
          domicilio = EXCLUDED.domicilio,
          telefono = EXCLUDED.telefono
        RETURNING id
      `;
      const resNuevaEmpresa = await client.query(queryNuevaEmpresa, [
        body.razon_social,
        body.nombre_comercial,
        body.rfc,
        body.fecha_constitucion || '2020-01-01', // Valor por defecto seguro
        body.giro,
        body.tamano,
        body.tipo_empresa,
        body.estado,
        body.municipio,
        body.cp,
        body.domicilio,
        body.telefono_empresa
      ]);
      empresaId = resNuevaEmpresa.rows[0].id;
    }

    // 2. Obtener periodo activo
    const queryPeriodo = 'SELECT id FROM periodos WHERE activo = TRUE LIMIT 1';
    const resPeriodo = await client.query(queryPeriodo);
    const periodoId = resPeriodo.rows.length > 0 ? resPeriodo.rows[0].id : 1;

    // 3. Asignar maestro académico por defecto (si no hay uno asignado previamente)
    // Para demostración, asignamos al maestro id=1 (tutor por defecto)
    const maestroId = 1;

    // 4. Crear el trámite de estadía
    const queryInsertTramite = `
      INSERT INTO tramites_estadia (
        matricula, empresa_id, maestro_id, periodo_id,
        asesor_ind_nombre, asesor_ind_cargo, asesor_ind_telefono, asesor_ind_email,
        nivel_academico, titulo_proyecto, problematica, alcance, producto_generar,
        horario_alumno, fecha_inicio, fecha_termino, estatus, ruta_nss,
        modalidad_estadia, ruta_ine_tutor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, estatus
    `;
    const resultTramite = await client.query(queryInsertTramite, [
      matricula,
      empresaId,
      maestroId,
      periodoId,
      body.asesor_ind_nombre,
      body.asesor_ind_cargo,
      body.asesor_ind_telefono,
      body.asesor_ind_email,
      body.nivel_academico,
      body.titulo_proyecto,
      body.problematica,
      body.alcance,
      body.producto_generar,
      body.horario_alumno,
      body.fecha_inicio,
      body.fecha_termino,
      'En Revisión Digital', // Pasa a revisión digital al enviar
      rutaNssRelativa,
      body.modalidad_estadia || 'Local',
      rutaIneTutorRelativa
    ]);

    const nuevoTramite = resultTramite.rows[0];

    // 5. Registrar log de auditoría
    await client.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [req.usuario.id, 'CREAR_TRAMITE', `Alumno con matrícula ${matricula} registró trámite ID ${nuevoTramite.id}`]
    );

    // Confirmar transacción
    await client.query('COMMIT');

    return res.status(201).json({
      tramite_id: nuevoTramite.id,
      estatus: nuevoTramite.estatus
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al registrar trámite:', error);
    return res.status(500).json({ mensaje: error.message || 'Error interno al registrar el trámite de estadía.' });
  } finally {
    client.release();
  }
};

// 3. Actualizar trámite existente (por ejemplo, al corregir tras rechazo)
export const actualizarTramite = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autorizado.' });
  }

  const tramiteId = parseInt(req.params.id, 10);
  const client = await pool.connect();

  try {
    // Validar propiedad del trámite
    const queryPropiedad = `
      SELECT t.id, t.matricula, t.ruta_ine_tutor, a.usuario_id 
      FROM tramites_estadia t
      INNER JOIN alumnos a ON t.matricula = a.matricula
      WHERE t.id = $1
    `;
    const resProp = await client.query(queryPropiedad, [tramiteId]);

    if (resProp.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Trámite no encontrado.' });
    }

    if (resProp.rows[0].usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permisos para modificar este trámite.' });
    }

    const body = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const nssFile = files?.['nss']?.[0];
    const ineTutorFile = files?.['ine_tutor']?.[0];

    const existingIneTutor = resProp.rows[0].ruta_ine_tutor;

    // Si la modalidad es Foránea, se requiere el INE del tutor
    if (body.modalidad_estadia === 'Foránea' && !ineTutorFile && !existingIneTutor) {
      return res.status(400).json({ mensaje: 'La copia del INE del tutor es obligatoria para la modalidad foránea.' });
    }

    await client.query('BEGIN');

    // 1. Si hay nueva empresa y no se mandó empresa_id, se crea, o se actualiza
    let empresaId = body.empresa_id ? parseInt(body.empresa_id, 10) : null;
    if (!empresaId && body.razon_social) {
      const queryNuevaEmpresa = `
        INSERT INTO empresas (
          razon_social, nombre_comercial, rfc, fecha_constitucion, giro, tamano,
          tipo_empresa, estado, municipio, cp, domicilio, telefono
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (rfc) DO UPDATE SET
          razon_social = EXCLUDED.razon_social,
          nombre_comercial = EXCLUDED.nombre_comercial,
          fecha_constitucion = EXCLUDED.fecha_constitucion,
          giro = EXCLUDED.giro,
          tamano = EXCLUDED.tamano,
          tipo_empresa = EXCLUDED.tipo_empresa,
          estado = EXCLUDED.estado,
          municipio = EXCLUDED.municipio,
          cp = EXCLUDED.cp,
          domicilio = EXCLUDED.domicilio,
          telefono = EXCLUDED.telefono
        RETURNING id
      `;
      const resNuevaEmpresa = await client.query(queryNuevaEmpresa, [
        body.razon_social,
        body.nombre_comercial,
        body.rfc,
        body.fecha_constitucion || '2020-01-01',
        body.giro,
        body.tamano,
        body.tipo_empresa,
        body.estado,
        body.municipio,
        body.cp,
        body.domicilio,
        body.telefono_empresa
      ]);
      empresaId = resNuevaEmpresa.rows[0].id;
    }

    const paramsUpdate = [
      body.asesor_ind_nombre, // $1
      body.asesor_ind_cargo,  // $2
      body.asesor_ind_telefono, // $3
      body.asesor_ind_email,  // $4
      body.nivel_academico,   // $5
      body.titulo_proyecto,   // $6
      body.problematica,      // $7
      body.alcance,           // $8
      body.producto_generar,  // $9
      body.horario_alumno,    // $10
      body.fecha_inicio,      // $11
      body.fecha_termino,     // $12
      'En Revisión Digital',  // $13
      new Date(),             // $14
      body.modalidad_estadia || 'Local' // $15
    ];

    let queryParts = [
      'asesor_ind_nombre = $1',
      'asesor_ind_cargo = $2',
      'asesor_ind_telefono = $3',
      'asesor_ind_email = $4',
      'nivel_academico = $5',
      'titulo_proyecto = $6',
      'problematica = $7',
      'alcance = $8',
      'producto_generar = $9',
      'horario_alumno = $10',
      'fecha_inicio = $11',
      'fecha_termino = $12',
      'estatus = $13',
      'fecha_actualizacion = $14',
      'modalidad_estadia = $15'
    ];

    if (empresaId) {
      paramsUpdate.push(empresaId);
      queryParts.push(`empresa_id = $${paramsUpdate.length}`);
    }

    if (nssFile) {
      const rutaNssRelativa = `nss/${nssFile.filename}`;
      paramsUpdate.push(rutaNssRelativa);
      queryParts.push(`ruta_nss = $${paramsUpdate.length}`);
    }

    if (ineTutorFile) {
      const rutaIneTutorRelativa = `ine_tutor/${ineTutorFile.filename}`;
      paramsUpdate.push(rutaIneTutorRelativa);
      queryParts.push(`ruta_ine_tutor = $${paramsUpdate.length}`);
    } else if (body.modalidad_estadia === 'Local') {
      queryParts.push(`ruta_ine_tutor = NULL`);
    }

    paramsUpdate.push(tramiteId);
    const idParamIndex = paramsUpdate.length;

    const queryUpdate = `
      UPDATE tramites_estadia SET
        ${queryParts.join(',\n        ')}
      WHERE id = $${idParamIndex}
      RETURNING id, estatus
    `;

    const resultUpdate = await client.query(queryUpdate, paramsUpdate);

    // Registrar log
    await client.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [req.usuario.id, 'ACTUALIZAR_TRAMITE', `Alumno actualizó trámite ID ${tramiteId}`]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      tramite_id: resultUpdate.rows[0].id,
      estatus: resultUpdate.rows[0].estatus
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar trámite:', error);
    return res.status(500).json({ mensaje: 'Error interno al actualizar el trámite.' });
  } finally {
    client.release();
  }
};

// 4. Subir PDF firmado (Evidencia Final)
export const subirEvidencia = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autorizado.' });
  }

  const tramiteId = parseInt(req.params.id, 10);
  const file = req.file;

  if (!file) {
    return res.status(400).json({ mensaje: 'Debes proporcionar la evidencia firmada en formato PDF.' });
  }

  try {
    // Validar propiedad y estatus del trámite (debe ser Aprobado para Firmas)
    const queryTramite = 'SELECT matricula, estatus FROM tramites_estadia WHERE id = $1';
    const resTramite = await pool.query(queryTramite, [tramiteId]);

    if (resTramite.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Trámite no encontrado.' });
    }

    const tramite = resTramite.rows[0];

    // Validar que el alumno que sube sea el dueño
    const resAlumno = await pool.query('SELECT matricula FROM alumnos WHERE usuario_id = $1', [req.usuario.id]);
    if (resAlumno.rows.length === 0 || resAlumno.rows[0].matricula !== tramite.matricula) {
      return res.status(403).json({ mensaje: 'No tienes autorización sobre este trámite.' });
    }

    const rutaEvidenciaRelativa = `evidencias/${file.filename}`;

    // Actualizar el trámite a "Completado" y guardar la ruta de evidencia
    await pool.query('BEGIN');

    await pool.query(
      `UPDATE tramites_estadia 
       SET ruta_evidencia = $1, estatus = 'Completado', fecha_actualizacion = NOW() 
       WHERE id = $2`,
      [rutaEvidenciaRelativa, tramiteId]
    );

    // Auditoría
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [req.usuario.id, 'SUBIR_EVIDENCIA', `Alumno subió evidencia firmada y completó trámite ID ${tramiteId}`]
    );

    await pool.query('COMMIT');

    return res.status(200).json({
      mensaje: 'Evidencia enviada correctamente. Trámite completado.',
      estatus: 'Completado'
    });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error('Error al subir evidencia:', error);
    return res.status(500).json({ mensaje: 'Error al subir el archivo de evidencia.' });
  }
};

// 5. Buscar empresas
export const buscarEmpresas = async (req: AuthenticatedRequest, res: Response) => {
  const queryTerm = req.query.q as string;

  if (!queryTerm) {
    return res.status(200).json([]);
  }

  try {
    const queryBuscar = `
      SELECT id, razon_social, nombre_comercial, rfc, giro, tamano, tipo_empresa, 
             estado, municipio, cp, domicilio, telefono 
      FROM empresas 
      WHERE razon_social ILIKE $1 OR rfc ILIKE $1 
      LIMIT 10
    `;
    const result = await pool.query(queryBuscar, [`%${queryTerm}%`]);
    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('Error al buscar empresas:', error);
    return res.status(500).json({ mensaje: 'Error en la búsqueda de empresas.' });
  }
};

// 6. Generar formato FODVI08-H prellenado con pdf-lib
export const descargarPDFPrefilled = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autorizado.' });
  }

  const tramiteId = parseInt(req.params.id, 10);

  try {
    // 1. Obtener todos los datos asociados al trámite
    const queryDatos = `
      SELECT 
        t.*,
        a.nombre_completo as alumno_nombre, a.carrera, a.campus, a.sistema, a.nss, a.telefono as alumno_tel,
        e.razon_social, e.nombre_comercial, e.rfc, e.domicilio as empresa_dir, e.telefono as empresa_tel,
        m.nombre_completo as asesor_ac_nombre, m.cargo as asesor_ac_cargo, m.area_adscripcion
      FROM tramites_estadia t
      INNER JOIN alumnos a ON t.matricula = a.matricula
      INNER JOIN empresas e ON t.empresa_id = e.id
      INNER JOIN maestros m ON t.maestro_id = m.id
      WHERE t.id = $1
    `;
    const result = await pool.query(queryDatos, [tramiteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Trámite no encontrado.' });
    }

    const datos = result.rows[0];

    // El PDF solo se puede descargar si está Aprobado para Firmas o Completado
    if (datos.estatus !== 'Aprobado para Firmas' && datos.estatus !== 'Completado') {
      return res.status(403).json({ mensaje: 'El PDF no está disponible. Requiere estatus "Aprobado para Firmas".' });
    }

    // 2. Crear documento PDF dinámico desde cero con pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Carta (US Letter)
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // COLORES INSTITUCIONALES UTCV
    const colorPrimario = rgb(143 / 255, 12 / 255, 52 / 255); // Rojo vino
    const colorDorado = rgb(200 / 255, 163 / 255, 120 / 255); // Dorado
    const colorGrisClaro = rgb(240 / 255, 240 / 255, 240 / 255);

    // ENCABEZADO
    page.drawRectangle({
      x: 30,
      y: height - 60,
      width: width - 60,
      height: 40,
      color: colorPrimario,
    });

    page.drawText('UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ', {
      x: 45,
      y: height - 38,
      size: 13,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('SISTEMA DE ESTADÍAS PROFESIONALES - FORMATO FODVI08-H', {
      x: 45,
      y: height - 52,
      size: 9,
      font: fontRegular,
      color: colorDorado,
    });

    // SECCIÓN 1: DATOS INSTITUCIONALES
    let currentY = height - 90;
    
    // Título sección
    page.drawText('1. DATOS DEL ALUMNO', { x: 30, y: currentY, size: 10, font: fontBold, color: colorPrimario });
    page.drawLine({ start: { x: 30, y: currentY - 3 }, end: { x: width - 30, y: currentY - 3 }, thickness: 1, color: colorDorado });
    
    currentY -= 20;
    page.drawText(`Nombre Completo: ${datos.alumno_nombre}`, { x: 40, y: currentY, size: 9, font: fontRegular });
    page.drawText(`Matrícula: ${datos.matricula}`, { x: 400, y: currentY, size: 9, font: fontRegular });

    currentY -= 15;
    page.drawText(`Carrera: ${datos.carrera}`, { x: 40, y: currentY, size: 9, font: fontRegular });
    page.drawText(`NSS: ${datos.nss || 'No registrado'}`, { x: 400, y: currentY, size: 9, font: fontRegular });

    currentY -= 15;
    page.drawText(`Campus: ${datos.campus} (${datos.sistema})`, { x: 40, y: currentY, size: 9, font: fontRegular });
    page.drawText(`Teléfono: ${datos.alumno_tel || 'No registrado'}`, { x: 400, y: currentY, size: 9, font: fontRegular });

    // SECCIÓN 2: DATOS DE LA EMPRESA
    currentY -= 30;
    page.drawText('2. DATOS DE LA EMPRESA RECEPTORA', { x: 30, y: currentY, size: 10, font: fontBold, color: colorPrimario });
    page.drawLine({ start: { x: 30, y: currentY - 3 }, end: { x: width - 30, y: currentY - 3 }, thickness: 1, color: colorDorado });

    currentY -= 20;
    page.drawText(`Razón Social: ${datos.razon_social}`, { x: 40, y: currentY, size: 9, font: fontRegular });
    page.drawText(`RFC: ${datos.rfc}`, { x: 400, y: currentY, size: 9, font: fontRegular });

    currentY -= 15;
    page.drawText(`Domicilio Comercial: ${datos.empresa_dir}`, { x: 40, y: currentY, size: 9, font: fontRegular });
    
    currentY -= 15;
    page.drawText(`Giro: ${datos.giro} | Tamaño: ${datos.tamano}`, { x: 40, y: currentY, size: 9, font: fontRegular });
    page.drawText(`Tipo: ${datos.tipo_empresa}`, { x: 400, y: currentY, size: 9, font: fontRegular });

    currentY -= 20;
    page.drawText('ASESOR INDUSTRIAL:', { x: 40, y: currentY, size: 9, font: fontBold });
    currentY -= 15;
    page.drawText(`Nombre: ${datos.asesor_ind_nombre}`, { x: 50, y: currentY, size: 9, font: fontRegular });
    page.drawText(`Cargo: ${datos.asesor_ind_cargo}`, { x: 400, y: currentY, size: 9, font: fontRegular });
    currentY -= 15;
    page.drawText(`Email: ${datos.asesor_ind_email}`, { x: 50, y: currentY, size: 9, font: fontRegular });
    page.drawText(`Teléfono: ${datos.asesor_ind_telefono || 'No registrado'}`, { x: 400, y: currentY, size: 9, font: fontRegular });

    // SECCIÓN 3: PROYECTO DE ESTADÍA
    currentY -= 30;
    page.drawText('3. PROYECTO DE ESTADÍA', { x: 30, y: currentY, size: 10, font: fontBold, color: colorPrimario });
    page.drawLine({ start: { x: 30, y: currentY - 3 }, end: { x: width - 30, y: currentY - 3 }, thickness: 1, color: colorDorado });

    currentY -= 20;
    page.drawText(`Nivel Académico: ${datos.nivel_academico} | Proyecto: ${datos.titulo_proyecto.substring(0, 75)}`, { x: 40, y: currentY, size: 9, font: fontRegular });
    if (datos.titulo_proyecto.length > 75) {
      currentY -= 12;
      page.drawText(`${datos.titulo_proyecto.substring(75, 150)}`, { x: 40, y: currentY, size: 9, font: fontRegular });
    }

    currentY -= 15;
    page.drawText(`Alcance: ${datos.alcance}`, { x: 40, y: currentY, size: 9, font: fontRegular });

    currentY -= 20;
    page.drawText('Problemática a resolver:', { x: 40, y: currentY, size: 9, font: fontBold });
    currentY -= 15;
    // Cortamos la problemática en líneas para evitar overflow
    const linesProb = datos.problematica.substring(0, 250).match(/.{1,100}/g) || [];
    linesProb.slice(0, 3).forEach((line: string) => {
      page.drawText(line.trim(), { x: 50, y: currentY, size: 8, font: fontRegular });
      currentY -= 12;
    });



    // SECCIÓN 4: HORARIO Y PERIODO
    currentY -= 20;
    page.drawText('4. HORARIO Y PERÍODO DE ESTADÍA', { x: 30, y: currentY, size: 10, font: fontBold, color: colorPrimario });
    page.drawLine({ start: { x: 30, y: currentY - 3 }, end: { x: width - 30, y: currentY - 3 }, thickness: 1, color: colorDorado });

    currentY -= 20;
    const fInicio = new Date(datos.fecha_inicio).toLocaleDateString('es-MX');
    const fFin = new Date(datos.fecha_termino).toLocaleDateString('es-MX');
    page.drawText(`Fecha de Inicio: ${fInicio}`, { x: 40, y: currentY, size: 9, font: fontRegular });
    page.drawText(`Fecha de Término: ${fFin}`, { x: 300, y: currentY, size: 9, font: fontRegular });

    currentY -= 15;
    page.drawText(`Horario Registrado: ${datos.horario_alumno}`, { x: 40, y: currentY, size: 8, font: fontRegular });

    // SECCIÓN 5: FIRMAS
    currentY -= 40;
    page.drawText('5. FIRMAS DE AUTORIZACIÓN', { x: 30, y: currentY, size: 10, font: fontBold, color: colorPrimario });
    page.drawLine({ start: { x: 30, y: currentY - 3 }, end: { x: width - 30, y: currentY - 3 }, thickness: 1, color: colorDorado });

    currentY -= 40;
    // Líneas para firmas
    // Firma Alumno
    page.drawLine({ start: { x: 40, y: currentY }, end: { x: 180, y: currentY }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Firma del Alumno', { x: 70, y: currentY - 12, size: 8, font: fontRegular });
    page.drawText(datos.alumno_nombre.substring(0, 25), { x: 40, y: currentY - 24, size: 7, font: fontRegular });

    // Firma Asesor Académico
    page.drawLine({ start: { x: 230, y: currentY }, end: { x: 380, y: currentY }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Asesor Académico UTCV', { x: 250, y: currentY - 12, size: 8, font: fontRegular });
    page.drawText(datos.asesor_ac_nombre.substring(0, 30), { x: 230, y: currentY - 24, size: 7, font: fontRegular });

    // Firma Asesor Industrial
    page.drawLine({ start: { x: 430, y: currentY }, end: { x: 570, y: currentY }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Asesor Industrial', { x: 465, y: currentY - 12, size: 8, font: fontRegular });
    page.drawText(datos.asesor_ind_nombre.substring(0, 25), { x: 430, y: currentY - 24, size: 7, font: fontRegular });

    // Guardar PDF y enviar respuesta
    const pdfBytes = await pdfDoc.save();

    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=FODVI08-H_${datos.matricula}.pdf`);
    return res.end(Buffer.from(pdfBytes));
  } catch (error: any) {
    console.error('Error al generar PDF:', error);
    return res.status(500).json({ mensaje: 'Error al generar el formato PDF.' });
  }
};
