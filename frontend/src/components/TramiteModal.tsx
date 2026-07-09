import React from 'react';
import { X, CheckCircle, XCircle, Download, BadgeCheck, Clock } from 'lucide-react';
import api from '../services/api';

export type RolUsuario = 'MAESTRO' | 'JEFE_CARRERA' | 'VINCULACION' | 'ALUMNO';

interface TramiteModalProps {
  tramiteActivo: any;
  loadingTramite: boolean;
  comentarios: string;
  setComentarios: (val: string) => void;
  evaluando: boolean;
  handleEvaluar: (
    estatus: 'Aprobado para Firmas' | 'Rechazado Digital',
    nssRechazado?: boolean,
    ineRechazado?: boolean
  ) => void;
  cerrarRevision: () => void;
  soloLectura?: boolean;
  rolUsuario?: RolUsuario;
  onDocumentoAprobado?: (tramiteActualizado: any) => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Desconocida';
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Badge de aprobación: muestra ✓ Aprobado por [nombre] [fecha]
const BadgeAprobacion: React.FC<{
  aprobado: boolean;
  nombre: string | null;
  fecha: string | null;
  label: string;
  colorClase: string;
}> = ({ aprobado, nombre, fecha, label, colorClase }) => {
  if (!aprobado || !nombre) return null;
  return (
    <div className={`flex items-start gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg border ${colorClase}`}>
      <BadgeCheck size={14} className="shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-xs font-semibold truncate">{nombre}</p>
        {fecha && (
          <p className="text-[10px] opacity-60 flex items-center gap-1">
            <Clock size={9} />
            {formatDate(fecha)}
          </p>
        )}
      </div>
    </div>
  );
};

// Botón para dar visto bueno
const BotonVistoBueno: React.FC<{
  onClick: () => void;
  cargando: boolean;
}> = ({ onClick, cargando }) => (
  <button
    onClick={onClick}
    disabled={cargando}
    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {cargando ? (
      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ) : (
      <BadgeCheck size={13} />
    )}
    {cargando ? 'Registrando...' : '✓ Dar visto bueno'}
  </button>
);

export const TramiteModal: React.FC<TramiteModalProps> = ({
  tramiteActivo,
  loadingTramite,
  comentarios,
  setComentarios,
  evaluando,
  handleEvaluar,
  cerrarRevision,
  soloLectura = false,
  rolUsuario,
  onDocumentoAprobado
}) => {
  const [nssRechazado, setNssRechazado] = React.useState(false);
  const [ineRechazado, setIneRechazado] = React.useState(false);
  const [aprobandoDoc, setAprobandoDoc] = React.useState<string | null>(null);
  const [tramiteLocal, setTramiteLocal] = React.useState<any>(null);

  React.useEffect(() => {
    if (tramiteActivo) {
      setNssRechazado(!!tramiteActivo.nss_rechazado);
      setIneRechazado(!!tramiteActivo.ine_tutor_rechazado);
      setTramiteLocal(tramiteActivo);
    }
  }, [tramiteActivo]);

  if (!tramiteActivo) return null;

  const tramite = tramiteLocal || tramiteActivo;

  // ¿Puede este usuario dar visto bueno?
  const esMaestro = rolUsuario === 'MAESTRO';
  const esJefe = rolUsuario === 'JEFE_CARRERA';
  const puedeAprobar = esMaestro || esJefe;
  const rolApi = esMaestro ? 'maestro' : 'jefe';

  const handleAprobarDoc = async (documento: 'nss' | 'ine_tutor' | 'evidencia') => {
    if (!tramite?.id || !puedeAprobar) return;
    setAprobandoDoc(documento);
    try {
      const res = await api.post('/admin/aprobar-documento', {
        tramite_id: tramite.id,
        documento,
        rol: rolApi
      });
      // Actualizar estado local con los nuevos datos de aprobación
      const docKey = documento === 'ine_tutor' ? 'ine' : documento;
      const colAprobado = `aprobacion_${docKey}_${rolApi}`;
      const colNombre = `aprobacion_${docKey}_${rolApi}_nombre`;
      const colFecha = `aprobacion_${docKey}_${rolApi}_fecha`;

      const aprobacionData = res.data.aprobacion;
      const tramiteActualizado = {
        ...tramite,
        [colAprobado]: aprobacionData?.aprobado ?? true,
        [colNombre]: aprobacionData?.nombre,
        [colFecha]: aprobacionData?.fecha ?? new Date().toISOString()
      };
      setTramiteLocal(tramiteActualizado);
      if (onDocumentoAprobado) onDocumentoAprobado(tramiteActualizado);
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al registrar el visto bueno.');
    } finally {
      setAprobandoDoc(null);
    }
  };

  // Componente de tarjeta de documento con aprobaciones
  const TarjetaDocumento: React.FC<{
    etiqueta: string;
    ruta: string | null;
    rechazado?: boolean;
    docKey: 'nss' | 'ine_tutor' | 'evidencia';
    colorBase?: 'blue' | 'green';
    faltaLabel?: string;
    faltaDesc?: string;
  }> = ({ etiqueta, ruta, rechazado = false, docKey, colorBase = 'blue', faltaLabel, faltaDesc }) => {
    const docKeyDb = docKey === 'ine_tutor' ? 'ine' : docKey;

    // Datos de aprobación maestro
    const aprobadoMaestro = tramite[`aprobacion_${docKeyDb}_maestro`];
    const nombreMaestro = tramite[`aprobacion_${docKeyDb}_maestro_nombre`];
    const fechaMaestro = tramite[`aprobacion_${docKeyDb}_maestro_fecha`];

    // Datos de aprobación jefe
    const aprobadoJefe = tramite[`aprobacion_${docKeyDb}_jefe`];
    const nombreJefe = tramite[`aprobacion_${docKeyDb}_jefe_nombre`];
    const fechaJefe = tramite[`aprobacion_${docKeyDb}_jefe_fecha`];

    // ¿Ya aprobó el usuario actual?
    const yaAprobeMaestro = esMaestro && aprobadoMaestro;
    const yaAprobeJefe = esJefe && aprobadoJefe;
    const yaAprobe = yaAprobeMaestro || yaAprobeJefe;

    // Colores del borde de la tarjeta según estado
    const borderClass = rechazado
      ? 'border-red-300 bg-red-50/40'
      : aprobadoMaestro && aprobadoJefe
        ? 'border-green-300 bg-green-50/30'
        : 'border-gray-200';

    if (!ruta) {
      if (!faltaLabel) return null;
      return (
        <div className="flex flex-col p-3 border border-red-100 bg-red-50 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 text-red-500 rounded-lg mr-3">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-700">{faltaLabel}</p>
              <p className="text-xs text-red-500">{faltaDesc}</p>
            </div>
          </div>
        </div>
      );
    }

    const bgIcon = rechazado
      ? 'bg-red-100 text-red-600'
      : colorBase === 'green'
        ? 'bg-green-100 text-green-600'
        : 'bg-blue-100 text-blue-600';

    return (
      <div className={`flex flex-col p-3 border rounded-lg transition-colors ${borderClass}`}>
        {/* Enlace al documento */}
        <a
          href={`http://localhost:3000/storage/${ruta}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center hover:opacity-80 transition-opacity group"
        >
          <div className={`p-2 rounded-lg mr-3 shrink-0 ${bgIcon}`}>
            <Download size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-bold text-gray-900">{etiqueta}</p>
              {rechazado && (
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-bold uppercase tracking-wider">
                  Rechazado
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Ver documento</p>
          </div>
        </a>

        {/* Badges de aprobación */}
        <div className="mt-1 space-y-1">
          <BadgeAprobacion
            aprobado={aprobadoMaestro}
            nombre={nombreMaestro}
            fecha={fechaMaestro}
            label="Visto bueno — Maestro Asesor"
            colorClase="bg-teal-50 border-teal-200 text-teal-800"
          />
          <BadgeAprobacion
            aprobado={aprobadoJefe}
            nombre={nombreJefe}
            fecha={fechaJefe}
            label="Visto bueno — Jefe de Carrera"
            colorClase="bg-indigo-50 border-indigo-200 text-indigo-800"
          />
        </div>

        {/* Botón de visto bueno si el usuario puede aprobar y aún no lo hizo */}
        {puedeAprobar && !yaAprobe && (
          <BotonVistoBueno
            onClick={() => handleAprobarDoc(docKey)}
            cargando={aprobandoDoc === docKey}
          />
        )}

        {/* Indicador de que ya se aprobó */}
        {puedeAprobar && yaAprobe && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 font-semibold">
            <CheckCircle size={13} />
            Ya diste tu visto bueno
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in p-4 overflow-hidden">
      <div className="bg-white rounded-utcv shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Expediente Digital del Alumno</h3>
            <p className="text-xs text-gray-500">Matrícula: {tramiteActivo.matricula}</p>
          </div>
          <button onClick={cerrarRevision} className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-1 rounded-full border">
            <X size={20} />
          </button>
        </div>

        {/* Contenido (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-6">
          {loadingTramite ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
              <p className="text-sm font-semibold text-gray-500">Cargando expediente...</p>
            </div>
          ) : !tramite.id ? (
            <div className="text-center py-10 text-red-500 font-bold">Error al cargar datos del expediente.</div>
          ) : (
            <>
              {/* 1. Datos del Alumno */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-utcv-primary uppercase tracking-wider mb-4 border-b pb-2">1. Datos del Alumno</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Nombre Completo</p>
                    <p className="text-sm font-bold text-gray-900">{tramite.alumno_nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Carrera</p>
                    <p className="text-sm font-medium text-gray-900">{tramite.carrera}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Teléfono</p>
                    <p className="text-sm font-medium text-gray-900">{tramite.alumno_telefono || 'No registrado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Número de Seguridad Social (NSS)</p>
                    <p className="text-sm font-medium text-gray-900">{tramite.alumno_nss || tramite.nss || 'No registrado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Modalidad de Estadía</p>
                    <p className="text-sm font-bold text-utcv-accent">{tramite.modalidad_estadia}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Estatus del Trámite</p>
                    <p className="text-sm font-bold text-gray-900">{tramite.estatus}</p>
                  </div>
                </div>
              </div>

              {/* 2. Datos de la Empresa */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-utcv-primary uppercase tracking-wider mb-4 border-b pb-2">2. Datos de la Empresa</h4>
                {tramite.razon_social ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-500 font-semibold">Razón Social</p>
                      <p className="text-sm font-bold text-gray-900">{tramite.razon_social}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-500 font-semibold">Nombre Comercial</p>
                      <p className="text-sm font-medium text-gray-900">{tramite.nombre_comercial}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">RFC</p>
                      <p className="text-sm font-medium text-gray-900">{tramite.rfc}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 font-semibold">Domicilio</p>
                      <p className="text-sm font-medium text-gray-900">{tramite.domicilio}, {tramite.municipio}, {tramite.estado}. CP: {tramite.cp}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">La empresa no ha sido registrada completamente.</p>
                )}
              </div>

              {/* 3. Proyecto y Asesor Industrial */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-utcv-primary uppercase tracking-wider mb-4 border-b pb-2">3. Proyecto y Asesor Industrial</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Título del Proyecto</p>
                      <p className="text-sm font-bold text-gray-900">{tramite.titulo_proyecto || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Problemática</p>
                      <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded border">{tramite.problematica || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Producto a Generar</p>
                      <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded border">{tramite.producto_generar || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Asesor Industrial (Tutor en Empresa)</p>
                      <p className="text-sm font-bold text-gray-900">{tramite.asesor_ind_nombre || 'N/A'}</p>
                      <p className="text-xs text-gray-600">{tramite.asesor_ind_cargo}</p>
                      <p className="text-xs text-blue-600">{tramite.asesor_ind_email} • {tramite.asesor_ind_telefono}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Horario del Alumno</p>
                      <p className="text-sm font-medium text-gray-900">{tramite.horario_alumno || 'N/A'}</p>
                    </div>
                    <div className="flex space-x-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Fecha Inicio</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(tramite.fecha_inicio).split(',')[0]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Fecha Término</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(tramite.fecha_termino).split(',')[0]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Archivos Digitales con aprobaciones */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                  <h4 className="text-sm font-bold text-utcv-primary uppercase tracking-wider">4. Archivos Digitales</h4>
                  {puedeAprobar && (
                    <span className="text-xs text-gray-500 italic">
                      {esMaestro ? 'Maestro Asesor — puedes dar visto bueno' : 'Jefe de Carrera — puedes dar visto bueno'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Constancia NSS */}
                  <TarjetaDocumento
                    etiqueta="Constancia NSS"
                    ruta={tramite.ruta_nss}
                    rechazado={tramite.nss_rechazado}
                    docKey="nss"
                    colorBase="blue"
                    faltaLabel="Constancia NSS"
                    faltaDesc="No subido"
                  />

                  {/* INE Tutor */}
                  {(tramite.ruta_ine_tutor || tramite.modalidad_estadia === 'Foránea') && (
                    <TarjetaDocumento
                      etiqueta="INE Tutor"
                      ruta={tramite.ruta_ine_tutor}
                      rechazado={tramite.ine_tutor_rechazado}
                      docKey="ine_tutor"
                      colorBase="blue"
                      faltaLabel="INE Tutor (Falta)"
                      faltaDesc="Requerido por ser foráneo"
                    />
                  )}

                  {/* Evidencia Firmada (FODVI08-H) */}
                  {tramite.ruta_evidencia && (
                    <TarjetaDocumento
                      etiqueta="Evidencia (FODVI08-H)"
                      ruta={tramite.ruta_evidencia}
                      docKey="evidencia"
                      colorBase="green"
                    />
                  )}

                  {!tramite.ruta_evidencia && (
                    <div className="flex items-center p-3 border border-gray-100 bg-gray-50 rounded-lg opacity-70">
                      <div className="p-2 bg-gray-200 text-gray-400 rounded-lg mr-3">
                        <XCircle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">Evidencia Firmada</p>
                        <p className="text-xs text-gray-400">Aún no completado</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* 5. Historial de Observaciones */}
              {tramite.observaciones && tramite.observaciones.length > 0 && (
                <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200 shadow-sm">
                  <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-3">Historial de Observaciones Previas</h4>
                  <div className="space-y-3">
                    {tramite.observaciones.map((obs: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded border border-yellow-100 text-sm">
                        <p className="text-xs text-gray-500 mb-1">{formatDate(obs.fecha)}</p>
                        <p className="text-gray-800">{obs.comentarios}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Panel de Evaluación (Fijo abajo) - SOLO PARA MAESTRO ASESOR (soloLectura=false) */}
        {!soloLectura && !loadingTramite && tramite?.id && tramite.estatus !== 'Aprobado para Firmas' && tramite.estatus !== 'Completado' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white shrink-0">
            {/* Casillas de verificación para indicar documentos incorrectos */}
            <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 mb-4 space-y-3">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Marcar documentos incorrectos para corregir:</p>
              <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nssRechazado}
                    onChange={(e) => setNssRechazado(e.target.checked)}
                    className="rounded border-gray-300 text-utcv-primary focus:ring-utcv-primary"
                  />
                  <span>Constancia NSS incorrecta</span>
                </label>
                {tramite.modalidad_estadia === 'Foránea' && (
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ineRechazado}
                      onChange={(e) => setIneRechazado(e.target.checked)}
                      className="rounded border-gray-300 text-utcv-primary focus:ring-utcv-primary"
                    />
                    <span>INE de Tutor incorrecto</span>
                  </label>
                )}
              </div>
            </div>

            <label className="block text-sm font-bold text-gray-700 mb-2">Ingresa observaciones (Obligatorio si rechazas el trámite):</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-utcv-primary focus:border-utcv-primary mb-4"
              rows={2}
              placeholder="Ej. Falta corregir la redacción de la problemática, el formato de horario no es correcto..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              disabled={evaluando}
            ></textarea>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => handleEvaluar('Rechazado Digital', nssRechazado, ineRechazado)}
                disabled={evaluando || !comentarios.trim()}
                className="flex items-center justify-center px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                <XCircle size={18} className="mr-2" />
                Rechazar y Notificar
              </button>
              <button
                onClick={() => handleEvaluar('Aprobado para Firmas', false, false)}
                disabled={evaluando}
                className="flex items-center justify-center px-6 py-2.5 bg-utcv-primary text-white hover:bg-utcv-primary-dark rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                <CheckCircle size={18} className="mr-2" />
                Aprobar Trámite Digital
              </button>
            </div>
          </div>
        )}
        
        {/* Si ya está aprobado o completado */}
        {!loadingTramite && tramite?.id && (
           ((!soloLectura && (tramite.estatus === 'Aprobado para Firmas' || tramite.estatus === 'Completado'))) ? (
            <div className="px-6 py-4 border-t border-gray-200 bg-green-50 shrink-0 text-center">
              <p className="text-green-800 font-bold text-sm">Este trámite ya ha sido evaluado y aprobado o completado.</p>
            </div>
           ) : soloLectura && !puedeAprobar ? (
            <div className="px-6 py-4 border-t border-gray-200 bg-blue-50 shrink-0 text-center">
              <p className="text-blue-800 font-bold text-sm">Modo de sólo lectura. Solo el Asesor Académico puede evaluar el trámite digital.</p>
            </div>
           ) : null
        )}
      </div>
    </div>
  );
};
