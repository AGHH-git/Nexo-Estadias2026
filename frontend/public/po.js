/**
 * po.js — Llenado automático del FODVI08
 * Se carga desde fodvic.html. Obtiene el trámite desde la API del backend
 * y mapea los datos a los campos del formulario HTML oficial.
 */

(async function () {
  // ─── Configuración ────────────────────────────────────────────────────────
  const API_URL = 'http://' + window.location.hostname + ':3000/api';

  // ─── Utilidades ───────────────────────────────────────────────────────────
  const set = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.value = value || '';
  };

  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value || '';
  };

  const check = (selector, shouldCheck) => {
    const el = document.querySelector(selector);
    if (el) el.checked = !!shouldCheck;
  };

  const radio = (name, value) => {
    if (!value) return;
    const el = document.querySelector(`input[name="${name}"][value="${value.toLowerCase()}"]`);
    if (el) el.checked = true;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // ─── Obtener token ─────────────────────────────────────────────────────────
  const token = localStorage.getItem('utcv_token');
  if (!token) {
    document.body.innerHTML = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 80px 20px;">
        <h2 style="color:#c0392b;">⚠ Sesión no encontrada</h2>
        <p>Por favor, <a href="/login">inicia sesión</a> y regresa a esta página.</p>
      </div>`;
    return;
  }

  // ─── Mostrar indicador de carga ────────────────────────────────────────────
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'po-loading';
  loadingDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#1a4d8c;color:#fff;text-align:center;padding:12px;font-family:Arial,sans-serif;font-size:14px;';
  loadingDiv.textContent = '⏳ Cargando datos del trámite...';
  document.body.prepend(loadingDiv);

  const formatHorario = (horarioStr) => {
    if (!horarioStr) return '';
    try {
      const arr = JSON.parse(horarioStr);
      if (Array.isArray(arr)) {
        return arr
          .filter(d => d.activo)
          .map(d => `${d.nombre}: ${d.entrada} a ${d.salida}`)
          .join(', ');
      }
    } catch (e) {
      // Ignorar error si ya es texto normal
    }
    return horarioStr;
  };

  try {
    // ─── Llamar a la API ─────────────────────────────────────────────────────
    const res = await fetch(`${API_URL}/alumno/tramite`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener el trámite.`);
    }

    const t = await res.json();
    if (!t) {
      loadingDiv.style.background = '#e67e22';
      loadingDiv.textContent = '⚠ No tienes un trámite registrado aún. Este formato estará disponible una vez que registres tu estadía.';
      return;
    }

    // ─── SECCIÓN 1: Datos de la Empresa ──────────────────────────────────────
    set('[data-field="empresa_nombre"]',  t.nombre_comercial || t.razon_social);
    set('[data-field="razon_social"]',    t.razon_social);
    set('[data-field="domicilio"]',       t.domicilio);
    set('[data-field="telefonos"]',       t.empresa_telefono);
    set('[data-field="cp"]',              t.cp);
    set('[data-field="municipio"]',       t.municipio);
    set('[data-field="estado"]',          t.estado);
    set('[data-field="fecha"]',           formatDate(t.fecha_registro));

    // Giro
    const giroMap = {
      'Comercial': 'giro_comercial',
      'Industrial': 'giro_industrial',
      'Servicios': 'giro_servicios',
      'Educativo': 'giro_educativo'
    };
    if (t.giro && giroMap[t.giro]) {
      check(`[data-check="${giroMap[t.giro]}"]`, true);
    } else if (t.giro) {
      check('[data-check="giro_otro"]', true);
      set('[data-field="giro_otro_texto"]', t.giro);
    }

    // Tamaño empresa
    const tamanoVal = (t.tamano || '').toLowerCase().split(' ')[0]; // "micro", "pequeña"→"pequena", etc.
    const tamanoNorm = tamanoVal.replace('ñ', 'n').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    radio('tamano_empresa', tamanoNorm);

    // Utilidad para quitar acentos
    const norm = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';

    // Tipo empresa
    radio('tipo_empresa', norm(t.tipo_empresa));

    // ─── SECCIÓN 2: Descripción del Proyecto ─────────────────────────────────
    // Nivel académico
    if ((t.nivel_academico || '').toUpperCase() === 'TSU') {
      check('[data-level="tsu"]', true);
    } else if ((t.nivel_academico || '').toUpperCase() === 'ING') {
      check('[data-level="ing"]', true);
    }

    set('[data-field="programa_educativo"]', t.carrera);
    set('[data-field="area"]',               t.area_empresa);
    set('[data-field="alias"]',              t.titulo_proyecto);

    // Problemática
    const problematicaEl = document.querySelector('[data-field="problematica"]');
    if (problematicaEl) problematicaEl.value = t.problematica || '';

    // ─── SECCIÓN 3: Alcance del Proyecto ─────────────────────────────────────
    const alcanceMap = {
      'Transferencia Tecnológica': 'tecnologica',
      'Innovación de Métodos': 'metodos'
    };
    if (t.alcance && alcanceMap[t.alcance]) {
      check(`[data-alcance="${alcanceMap[t.alcance]}"]`, true);
    } else if (t.alcance) {
      check('[data-alcance="otro"]', true);
      set('[data-field="alcance_otro"]', t.alcance);
    }

    const productoEl = document.querySelector('[data-field="producto_generar"]');
    if (productoEl) productoEl.value = t.producto_generar || '';

    set('[data-field="linea_investigacion"]', t.linea_investigacion);

    // ─── SECCIÓN 4: Datos del Asesor Industrial ───────────────────────────────
    set('[data-field="asesor_nombre"]',   t.asesor_ind_nombre);
    set('[data-field="asesor_cargo"]',    t.asesor_ind_cargo);
    set('[data-field="asesor_telefono"]', t.asesor_ind_telefono);
    set('[data-field="asesor_email"]',    t.asesor_ind_email);

    // ─── SECCIÓN 5: Compromisos del Alumno ───────────────────────────────────
    check('[data-compromiso="local"]',   (t.modalidad_estadia || '').toLowerCase() === 'local');
    check('[data-compromiso="foranea"]', (t.modalidad_estadia || '').toLowerCase() === 'foránea' || (t.modalidad_estadia || '').toLowerCase() === 'foranea');

    set('[data-field="alumno_nombre"]', t.nombre_completo);
    set('[data-field="matricula"]',     t.matricula);
    set('[data-field="nss"]',           t.nss);
    set('[data-field="celular"]',       t.telefono);
    set('[data-field="horario_trabajo"]', formatHorario(t.horario_alumno));
    set('[data-field="fecha_inicio"]',  formatDate(t.fecha_inicio));
    set('[data-field="fecha_termino"]', formatDate(t.fecha_termino));

    // Campus / Sistema (busca desde datos del alumno si están disponibles)
    radio('campus', norm(t.campus) || 'cuitlahuac');
    radio('sistema', norm(t.sistema) || 'escolarizado');

    // ─── SECCIÓN 6: Datos del Asesor Académico ────────────────────────────────
    set('[data-field="academico_nombre"]',    t.maestro_nombre);
    set('[data-field="academico_area"]',      t.maestro_area_adscripcion);
    set('[data-field="academico_extension"]', t.maestro_extension);
    set('[data-field="academico_email"]',     t.maestro_email);

    // Cargo del asesor académico
    if (t.maestro_cargo) {
      const cargoStr = norm(t.maestro_cargo);
      check('[data-cargo="pa"]',  cargoStr.includes('asociado') || cargoStr.includes('asignatura'));
      check('[data-cargo="ptc"]', cargoStr.includes('titular'));
    }

    // Sexo (Heurística simple basada en el primer nombre, ya que no está en la BD)
    if (t.nombre_completo) {
      const primerNombre = t.nombre_completo.split(' ')[0].toLowerCase();
      const nombresFemeninos = ['maria', 'ana', 'guadalupe', 'margarita', 'juana', 'carmen', 'rosa', 'leticia', 'silvia', 'alejandra', 'diana', 'andrea', 'daniela', 'paola', 'lizbeth', 'karen', 'valeria', 'sofia', 'fernanda', 'lucia', 'gabriela'];
      if (primerNombre.endsWith('a') || nombresFemeninos.includes(norm(primerNombre))) {
        radio('sexo', 'femenino');
      } else {
        radio('sexo', 'masculino');
      }
    }

    // Fechas de evaluación
    set('[data-field="eval_parcial"]', formatDate(t.eval_parcial));
    set('[data-field="eval_final"]',   formatDate(t.eval_final));

    // Seguimiento con alumno
    radio('seguimiento_alumno', t.seguimiento_alumno);
    set('[data-field="seguimiento_dias"]', t.seguimiento_dias);

    // Comunicación con asesor industrial
    radio('contacto_asesor', t.contacto_asesor);
    set('[data-field="contacto_dias"]', t.contacto_dias);

    // Ajustar altura de textareas para que no se corte el texto al imprimir
    document.querySelectorAll('textarea').forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = (ta.scrollHeight + 2) + 'px';
    });

    // Ocultar indicador de carga
    loadingDiv.style.display = 'none';

    // Auto-imprimir después de 1 segundo
    setTimeout(() => window.print(), 1000);

  } catch (err) {
    console.error('po.js error:', err);
    loadingDiv.style.background = '#c0392b';
    loadingDiv.textContent = `❌ Error al cargar los datos: ${err.message}`;
  }
})();
