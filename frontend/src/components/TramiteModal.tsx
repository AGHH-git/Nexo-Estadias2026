import React from 'react';
import { X, CheckCircle, XCircle, Download } from 'lucide-react';

interface TramiteModalProps {
  tramiteActivo: any;
  loadingTramite: boolean;
  comentarios: string;
  setComentarios: (val: string) => void;
  evaluando: boolean;
  handleEvaluar: (estatus: 'Aprobado para Firmas' | 'Rechazado Digital') => void;
  cerrarRevision: () => void;
  soloLectura?: boolean;
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

export const TramiteModal: React.FC<TramiteModalProps> = ({
  tramiteActivo,
  loadingTramite,
  comentarios,
  setComentarios,
  evaluando,
  handleEvaluar,
  cerrarRevision,
  soloLectura = false
}) => {
  if (!tramiteActivo) return null;

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
          ) : !tramiteActivo.id ? (
            <div className="text-center py-10 text-red-500 font-bold">Error al cargar datos del expediente.</div>
          ) : (
            <>
              {/* 1. Datos del Alumno */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-utcv-primary uppercase tracking-wider mb-4 border-b pb-2">1. Datos del Alumno</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Nombre Completo</p>
                    <p className="text-sm font-bold text-gray-900">{tramiteActivo.alumno_nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Carrera</p>
                    <p className="text-sm font-medium text-gray-900">{tramiteActivo.carrera}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Teléfono</p>
                    <p className="text-sm font-medium text-gray-900">{tramiteActivo.alumno_telefono || 'No registrado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Número de Seguridad Social (NSS)</p>
                    <p className="text-sm font-medium text-gray-900">{tramiteActivo.alumno_nss || tramiteActivo.nss || 'No registrado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Modalidad de Estadía</p>
                    <p className="text-sm font-bold text-utcv-accent">{tramiteActivo.modalidad_estadia}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Estatus del Trámite</p>
                    <p className="text-sm font-bold text-gray-900">{tramiteActivo.estatus}</p>
                  </div>
                </div>
              </div>

              {/* 2. Datos de la Empresa */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-utcv-primary uppercase tracking-wider mb-4 border-b pb-2">2. Datos de la Empresa</h4>
                {tramiteActivo.razon_social ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-500 font-semibold">Razón Social</p>
                      <p className="text-sm font-bold text-gray-900">{tramiteActivo.razon_social}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-500 font-semibold">Nombre Comercial</p>
                      <p className="text-sm font-medium text-gray-900">{tramiteActivo.nombre_comercial}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">RFC</p>
                      <p className="text-sm font-medium text-gray-900">{tramiteActivo.rfc}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 font-semibold">Domicilio</p>
                      <p className="text-sm font-medium text-gray-900">{tramiteActivo.domicilio}, {tramiteActivo.municipio}, {tramiteActivo.estado}. CP: {tramiteActivo.cp}</p>
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
                      <p className="text-sm font-bold text-gray-900">{tramiteActivo.titulo_proyecto || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Problemática</p>
                      <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded border">{tramiteActivo.problematica || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Producto a Generar</p>
                      <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded border">{tramiteActivo.producto_generar || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Asesor Industrial (Tutor en Empresa)</p>
                      <p className="text-sm font-bold text-gray-900">{tramiteActivo.asesor_ind_nombre || 'N/A'}</p>
                      <p className="text-xs text-gray-600">{tramiteActivo.asesor_ind_cargo}</p>
                      <p className="text-xs text-blue-600">{tramiteActivo.asesor_ind_email} • {tramiteActivo.asesor_ind_telefono}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Horario del Alumno</p>
                      <p className="text-sm font-medium text-gray-900">{tramiteActivo.horario_alumno || 'N/A'}</p>
                    </div>
                    <div className="flex space-x-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Fecha Inicio</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(tramiteActivo.fecha_inicio).split(',')[0]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Fecha Término</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(tramiteActivo.fecha_termino).split(',')[0]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Archivos Digitales */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-utcv-primary uppercase tracking-wider mb-4 border-b pb-2">4. Archivos Digitales</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Constancia NSS */}
                  {tramiteActivo.ruta_nss ? (
                    <a 
                      href={`http://localhost:3000/storage/${tramiteActivo.ruta_nss}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                    >
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3 group-hover:bg-blue-200">
                        <Download size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Constancia NSS</p>
                        <p className="text-xs text-gray-500">Documento PDF</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center p-3 border border-gray-100 bg-gray-50 rounded-lg opacity-70">
                      <div className="p-2 bg-gray-200 text-gray-400 rounded-lg mr-3">
                        <XCircle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">Constancia NSS</p>
                        <p className="text-xs text-gray-400">No subido</p>
                      </div>
                    </div>
                  )}

                  {/* INE Tutor */}
                  {tramiteActivo.ruta_ine_tutor ? (
                    <a 
                      href={`http://localhost:3000/storage/${tramiteActivo.ruta_ine_tutor}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                    >
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3 group-hover:bg-blue-200">
                        <Download size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">INE Tutor</p>
                        <p className="text-xs text-gray-500">Documento/Imagen</p>
                      </div>
                    </a>
                  ) : tramiteActivo.modalidad_estadia === 'Foránea' ? (
                    <div className="flex items-center p-3 border border-red-100 bg-red-50 rounded-lg">
                      <div className="p-2 bg-red-100 text-red-500 rounded-lg mr-3">
                        <XCircle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-700">INE Tutor (Falta)</p>
                        <p className="text-xs text-red-500">Requerido por ser foráneo</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Evidencia Firmada (FODVI08-H) */}
                  {tramiteActivo.ruta_evidencia ? (
                    <a 
                      href={`http://localhost:3000/storage/${tramiteActivo.ruta_evidencia}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors group"
                    >
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg mr-3 group-hover:bg-green-200">
                        <Download size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Evidencia (FODVI08-H)</p>
                        <p className="text-xs text-gray-500">Formato firmado</p>
                      </div>
                    </a>
                  ) : (
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
              {tramiteActivo.observaciones && tramiteActivo.observaciones.length > 0 && (
                <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200 shadow-sm">
                  <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-3">Historial de Observaciones Previas</h4>
                  <div className="space-y-3">
                    {tramiteActivo.observaciones.map((obs: any, idx: number) => (
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

        {/* Panel de Evaluación (Fijo abajo) - SOLO PARA ASESORES (soloLectura=false) */}
        {!soloLectura && !loadingTramite && tramiteActivo?.id && tramiteActivo.estatus !== 'Aprobado para Firmas' && tramiteActivo.estatus !== 'Completado' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white shrink-0">
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
                onClick={() => handleEvaluar('Rechazado Digital')}
                disabled={evaluando || !comentarios.trim()}
                className="flex items-center justify-center px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                <XCircle size={18} className="mr-2" />
                Rechazar y Notificar
              </button>
              <button
                onClick={() => handleEvaluar('Aprobado para Firmas')}
                disabled={evaluando}
                className="flex items-center justify-center px-6 py-2.5 bg-utcv-primary text-white hover:bg-utcv-primary-dark rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                <CheckCircle size={18} className="mr-2" />
                Aprobar Trámite Digital
              </button>
            </div>
          </div>
        )}
        
        {/* Si ya está aprobado o completado - PARA TODOS LOS ROLES O PARA MODO LECTURA */}
        {!loadingTramite && tramiteActivo?.id && (
           ((!soloLectura && (tramiteActivo.estatus === 'Aprobado para Firmas' || tramiteActivo.estatus === 'Completado'))) ? (
            <div className="px-6 py-4 border-t border-gray-200 bg-green-50 shrink-0 text-center">
              <p className="text-green-800 font-bold text-sm">Este trámite ya ha sido evaluado y aprobado o completado.</p>
            </div>
           ) : soloLectura ? (
            <div className="px-6 py-4 border-t border-gray-200 bg-blue-50 shrink-0 text-center">
              <p className="text-blue-800 font-bold text-sm">Modo de sólo lectura. Solo el Asesor Académico puede evaluar el trámite digital.</p>
            </div>
           ) : null
        )}
      </div>
    </div>
  );
};
