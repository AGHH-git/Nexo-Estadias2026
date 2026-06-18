// ARCHIVO: frontend/src/pages/alumno/fases/Fase5Documentos.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { EstatusTramite } from '../../../types';

interface Fase5Props {
  formData: any;
  estatusActual: EstatusTramite | 'Borrador';
  tramiteId: number | null;
  archivoIneTutor: File | null;
  onAnterior: () => void;
  onRecargarTramite: () => void;
  onIrAPaso: (paso: number) => void;
}

export const Fase5Documentos: React.FC<Fase5Props> = ({
  formData,
  estatusActual,
  tramiteId,
  archivoIneTutor,
  onAnterior,
  onRecargarTramite,
  onIrAPaso,
}) => {
  const navigate = useNavigate();
  // Manejo de Archivos NSS
  const [archivoNss, setArchivoNss] = useState<File | null>(null);
  const [nssError, setNssError] = useState('');
  const fileInputNssRef = useRef<HTMLInputElement>(null);

  // Manejo de Archivos Evidencia Firmada
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);
  const [evidenciaError, setEvidenciaError] = useState('');
  const fileInputEvidenciaRef = useRef<HTMLInputElement>(null);

  // Estados de carga y modal
  const [enviando, setEnviando] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  // Drag & drop states
  const [dragNssOver, setDragNssOver] = useState(false);
  const [dragEvidenciaOver, setDragEvidenciaOver] = useState(false);

  // Parsear horario para el resumen
  const [horarioResumen, setHorarioResumen] = useState('');
  useEffect(() => {
    if (formData.horario_alumno) {
      try {
        const parsed = JSON.parse(formData.horario_alumno);
        if (Array.isArray(parsed)) {
          const diasActivos = parsed
            .filter((d: any) => d.activo)
            .map((d: any) => `${d.nombre} (${d.entrada} a ${d.salida})`);
          setHorarioResumen(diasActivos.join(', '));
        }
      } catch (e) {
        setHorarioResumen(formData.horario_alumno);
      }
    }
  }, [formData.horario_alumno]);

  // Manejar arrastre y soltado de archivos NSS
  const handleDragOverNss = (e: React.DragEvent) => {
    e.preventDefault();
    setDragNssOver(true);
  };
  const handleDragLeaveNss = () => setDragNssOver(false);
  const handleDropNss = (e: React.DragEvent) => {
    e.preventDefault();
    setDragNssOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validarYEstablecerNss(e.dataTransfer.files[0]);
    }
  };

  const validarYEstablecerNss = (file: File) => {
    setNssError('');
    if (file.type !== 'application/pdf') {
      setNssError('El archivo debe ser un documento PDF (.pdf)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNssError('El tamaño del archivo no debe superar los 5MB.');
      return;
    }
    setArchivoNss(file);
  };

  // Manejar arrastre y soltado de archivos Evidencia
  const handleDragOverEvidencia = (e: React.DragEvent) => {
    e.preventDefault();
    setDragEvidenciaOver(true);
  };
  const handleDragLeaveEvidencia = () => setDragEvidenciaOver(false);
  const handleDropEvidencia = (e: React.DragEvent) => {
    e.preventDefault();
    setDragEvidenciaOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validarYEstablecerEvidencia(e.dataTransfer.files[0]);
    }
  };

  const validarYEstablecerEvidencia = (file: File) => {
    setEvidenciaError('');
    if (file.type !== 'application/pdf') {
      setEvidenciaError('El archivo debe ser un documento PDF (.pdf)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEvidenciaError('El tamaño del archivo no debe superar los 5MB.');
      return;
    }
    setArchivoEvidencia(file);
  };

  // Acción Enviar Trámite Completo a Revisión Digital
  const handleEnviarTramite = async () => {
    setErrorEnvio('');
    
    // Si no está registrado en DB, exige cargar NSS
    if (!archivoNss && !formData.ruta_nss) {
      setNssError('Es obligatorio cargar tu constancia de vigencia del NSS en PDF.');
      return;
    }

    if (formData.modalidad_estadia === 'Foránea' && !archivoIneTutor && !formData.ruta_ine_tutor) {
      setErrorEnvio('Es obligatorio cargar la copia del INE del tutor para la modalidad foránea.');
      return;
    }

    setEnviando(true);
    const fd = new FormData();

    // Añadir todos los campos de texto
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined && key !== 'observaciones' && key !== 'nss' && key !== 'evidencia') {
        fd.append(key, formData[key]);
      }
    });

    // Añadir archivo si se cargó uno nuevo
    if (archivoNss) {
      fd.append('nss', archivoNss);
    }

    if (archivoIneTutor) {
      fd.append('ine_tutor', archivoIneTutor);
    }

    try {
      if (tramiteId) {
        // Actualizar (en caso de edición posterior a rechazo)
        await api.put(`/tramites/${tramiteId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Crear nuevo trámite
        await api.post('/tramites', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setMostrarModalExito(true);
    } catch (err: any) {
      console.error('Error al registrar trámite:', err);
      if (err.response?.data?.mensaje) {
        setErrorEnvio(err.response.data.mensaje);
      } else {
        setErrorEnvio('Error de red o del servidor. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  };

  // Descargar formato FODVI08-H prellenado
  const handleDescargarPDF = async () => {
    if (!tramiteId) return;

    try {
      const response = await api.get(`/tramites/${tramiteId}/pdf`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `FODVI08-H_PRELLENADO.pdf`;
      link.click();
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      alert('Hubo un error al generar y descargar el archivo PDF.');
    }
  };

  // Subir Evidencia Final firmada
  const handleEnviarEvidencia = async () => {
    setEvidenciaError('');
    if (!archivoEvidencia) {
      setEvidenciaError('Por favor selecciona el formato FODVI08-H debidamente firmado.');
      return;
    }

    setEnviando(true);
    const fd = new FormData();
    fd.append('evidencia', archivoEvidencia);

    try {
      await api.post(`/tramites/${tramiteId}/evidencia`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      alert('¡Evidencia cargada con éxito! Trámite de estadía completado.');
      onRecargarTramite();
    } catch (err: any) {
      console.error('Error al subir evidencia:', err);
      if (err.response?.data?.mensaje) {
        setEvidenciaError(err.response.data.mensaje);
      } else {
        setEvidenciaError('Error al subir la evidencia. Inténtalo más tarde.');
      }
    } finally {
      setEnviando(false);
    }
  };

  // Renderizar Timeline de Estado
  const renderTimeline = (activoIndex: number) => {
    const hitos = [
      { label: 'Trámite enviado' },
      { label: 'En revisión por asesor' },
      { label: 'Aprobado para firmas' },
      { label: 'Completado' },
    ];

    return (
      <div className="py-6 select-none">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Estado del Trámite Digital</p>
        <div className="flex flex-col space-y-4">
          {hitos.map((hito, idx) => {
            const completado = idx < activoIndex;
            const activo = idx === activoIndex;
            return (
              <div key={idx} className="flex items-center space-x-3">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    completado 
                      ? 'text-white' 
                      : activo 
                      ? 'text-utcv-primary-dark animate-pulse-custom' 
                      : 'text-gray-400 border border-gray-200'
                  }`}
                  style={{
                    backgroundColor: completado ? 'var(--color-primary)' : activo ? 'var(--color-accent)' : 'var(--color-white)',
                  }}
                >
                  {completado ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className={`text-sm font-semibold ${activo ? 'text-utcv-primary font-bold' : completado ? 'text-gray-700' : 'text-gray-400'}`}>
                  {hito.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==========================================
  // VISTAS SEGÚN EL ESTATUS ACTUAL
  // ==========================================

  // 1. VISTA DE BORRADOR
  if (estatusActual === 'Borrador') {
    return (
      <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-8">
        <div>
          <h3 className="text-xl font-bold text-gray-950">Documentos y envío</h3>
          <p className="text-sm text-gray-500 mt-1">
            Por favor, carga tu Constancia de Vigencia de Derechos del NSS y envía tu solicitud a revisión académica.
          </p>
        </div>

        {/* Zona Carga NSS */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider select-none">
            Constancia de Vigencia de Derechos NSS (Obligatoria, PDF, Máx. 5MB)
          </label>
          
          <div
            onDragOver={handleDragOverNss}
            onDragLeave={handleDragLeaveNss}
            onDrop={handleDropNss}
            onClick={() => fileInputNssRef.current?.click()}
            className={`border-2 border-dashed rounded-utcv p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragNssOver ? 'bg-utcv-primary-light border-utcv-primary' : 'bg-gray-50 border-gray-300 hover:bg-gray-100/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputNssRef}
              onChange={(e) => e.target.files?.[0] && validarYEstablecerNss(e.target.files[0])}
              accept=".pdf"
              className="hidden"
            />
            
            {archivoNss ? (
              <div className="flex flex-col items-center space-y-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-utcv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-bold text-gray-800">{archivoNss.name}</span>
                <span className="text-xs text-gray-400 font-medium">({(archivoNss.size / (1024 * 1024)).toFixed(2)} MB)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArchivoNss(null);
                  }}
                  className="px-2 py-1 text-xs bg-red-50 text-utcv-danger font-bold hover:bg-red-100 transition-colors rounded"
                >
                  Eliminar archivo
                </button>
              </div>
            ) : (
              <div className="text-center space-y-1 text-gray-500 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 block mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-sm font-semibold text-gray-700">Arrastra tu archivo aquí o haz clic para buscar</p>
                <p className="text-xs">Solo formato PDF, tamaño menor a 5MB</p>
              </div>
            )}
          </div>

          {nssError && <p className="text-xs text-utcv-danger font-medium mt-1">{nssError}</p>}
        </div>

        {/* Card Resumen de Datos */}
        <div className="border border-utcv-border rounded-utcv p-5 bg-gray-50/50 space-y-4 text-sm text-gray-700">
          <h4 className="font-bold text-gray-900 border-l-4 border-utcv-primary pl-2 uppercase text-xs tracking-wider">
            Confirmación de Trámite
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-xs text-gray-500 uppercase">Empresa Receptora:</p>
              <p className="font-medium text-gray-900">{formData.razon_social || 'No especificada'}</p>
            </div>
            <div>
              <p className="font-bold text-xs text-gray-500 uppercase">Título del Proyecto:</p>
              <p className="font-medium text-gray-900 truncate">{formData.titulo_proyecto || 'Sin título'}</p>
            </div>
            <div>
              <p className="font-bold text-xs text-gray-500 uppercase">Asesor Industrial:</p>
              <p className="font-medium text-gray-900">
                {formData.asesor_ind_nombre || 'No asignado'} ({formData.asesor_ind_email || 's/c'})
              </p>
            </div>
            <div>
              <p className="font-bold text-xs text-gray-500 uppercase">Horas Semanales:</p>
              <p className="font-medium text-gray-900">{horarioResumen ? 'Configurado' : 'Sin configurar'}</p>
            </div>
          </div>
        </div>

        {errorEnvio && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-utcv-danger font-semibold flex items-center space-x-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-utcv-danger shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Error: {errorEnvio}</span>
          </div>
        )}

        {/* Botón Principal Envío */}
        <button
          type="button"
          onClick={handleEnviarTramite}
          disabled={enviando || (!archivoNss && !formData.ruta_nss)}
          className="w-full h-12 flex items-center justify-center text-sm font-bold text-white rounded-utcv transition-all select-none shadow"
          style={{
            backgroundColor: (enviando || (!archivoNss && !formData.ruta_nss)) ? '#d6cbd0' : 'var(--color-primary)',
            cursor: (enviando || (!archivoNss && !formData.ruta_nss)) ? 'not-allowed' : 'pointer'
          }}
          onMouseOver={(e) => {
            if (!enviando && (archivoNss || formData.ruta_nss)) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }
          }}
          onMouseOut={(e) => {
            if (!enviando && (archivoNss || formData.ruta_nss)) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }
          }}
        >
          {enviando ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-custom"></div>
              <span>Registrando trámite...</span>
            </div>
          ) : (
            'Enviar a revisión digital'
          )}
        </button>

        {/* Botón Atrás */}
        <div className="flex justify-start pt-2 select-none">
          <button
            type="button"
            onClick={onAnterior}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-utcv text-sm font-semibold text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Anterior</span>
          </button>
        </div>

        {/* Modal de éxito de registro */}
        {mostrarModalExito && (
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[200] p-4 select-none">
            <div className="bg-white rounded-utcv shadow-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 animate-scale-up">
              <div className="w-16 h-16 bg-green-50 text-utcv-success rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-950">¡Trámite enviado correctamente!</h4>
              <p className="text-sm text-gray-500">
                Tu asesor académico revisará tu información digital. Te notificaremos vía correo electrónico o sistema cuando haya observaciones o aprobación.
              </p>
              
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalExito(false);
                    onRecargarTramite();
                  }}
                  className="w-full py-2.5 bg-utcv-primary hover:bg-utcv-primary-dark text-white text-sm font-bold rounded-utcv transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Ver estado de mi trámite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalExito(false);
                    navigate('/alumno/inicio');
                  }}
                  className="w-full py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-utcv transition-colors"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. VISTA EN REVISIÓN DIGITAL
  if (estatusActual === 'En Revisión Digital') {
    return (
      <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-950">Estatus del trámite</h3>
          <p className="text-sm text-gray-500 mt-1">El trámite está en validación académica.</p>
        </div>

        {/* Info card */}
        <div 
          className="p-4 rounded-utcv border text-sm flex items-start space-x-3"
          style={{ 
            backgroundColor: 'rgba(41, 128, 185, 0.05)', 
            borderColor: 'rgba(41, 128, 185, 0.2)',
            color: 'var(--color-info)'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-utcv-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 102 0v-3a1 1 0 00-2 0v3z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-bold">Trámite en Revisión Digital</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Tu asesor académico asignado está evaluando la información ingresada. No se requieren más acciones por tu parte.
            </p>
          </div>
        </div>

        {/* Timeline */}
        {renderTimeline(1)}

        {/* Botón Volver al Inicio */}
        <div className="pt-4 select-none">
          <button
            type="button"
            onClick={() => navigate('/alumno/inicio')}
            className="w-full py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-utcv transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // 3. VISTA RECHAZADO DIGITAL
  if (estatusActual === 'Rechazado Digital') {
    const observaciones = formData.observaciones || [];

    return (
      <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-950">Trámite con observaciones</h3>
          <p className="text-sm text-gray-500 mt-1">Tu asesor ha detectado detalles por corregir.</p>
        </div>

        {/* Alerta rechazo */}
        <div 
          className="p-4 rounded-utcv border text-sm flex items-start space-x-3"
          style={{ 
            backgroundColor: 'rgba(192, 57, 43, 0.05)', 
            borderColor: 'rgba(192, 57, 43, 0.2)',
            color: 'var(--color-danger)'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-utcv-danger shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-bold">Solicitud Rechazada para Corrección</p>
            <p className="text-xs text-red-800 mt-0.5 font-medium">
              Por favor, revisa las observaciones descritas abajo, edita la información en las fases correspondientes y reenvía el formulario a revisión.
            </p>
          </div>
        </div>

        {/* Observaciones */}
        {observaciones.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Historial de Observaciones:</p>
            <div className="border border-utcv-border rounded-utcv divide-y divide-gray-150 overflow-hidden bg-gray-50/50">
              {observaciones.map((obs: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-white text-sm">
                  <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                    <span>Revisor: {obs.maestro_nombre || 'Asesor Académico'}</span>
                    <span>{new Date(obs.fecha).toLocaleString('es-MX')}</span>
                  </div>
                  <p className="text-gray-800 font-semibold mt-1 bg-red-50/40 p-2 border-l-2 border-utcv-primary rounded-r">
                    {obs.comentarios}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón Editar y reescribir */}
        <button
          type="button"
          onClick={() => onIrAPaso(2)} // Volver a los datos de la empresa
          className="w-full py-2.5 text-center text-sm font-bold text-white rounded-utcv hover:bg-utcv-primary-dark transition-colors shadow-sm select-none"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Editar información y volver a enviar
        </button>
      </div>
    );
  }

  // 4. VISTA APROBADO PARA FIRMAS (DESCARGA DE FORMATO Y CARGA DE FIRMAS)
  if (estatusActual === 'Aprobado para Firmas') {
    return (
      <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-950">Aprobado para firmas</h3>
            <p className="text-sm text-gray-500 mt-1">Tu formato FODVI08-H está listo para firmarse.</p>
          </div>
          
          <span 
            className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider select-none flex items-center space-x-1"
            style={{ backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-success)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Aprobado por asesor</span>
          </span>
        </div>

        {/* 1. Botón de Descarga */}
        <div className="space-y-3 bg-utcv-primary-light/45 border border-utcv-border rounded-utcv p-5">
          <p className="text-xs font-bold text-utcv-primary uppercase tracking-wider">Paso 1: Descargar el Formato</p>
          <p className="text-sm text-gray-600 font-medium">
            Descarga el archivo PDF de registro de estadía (FODVI08-H) que hemos generado automáticamente con tus datos.
          </p>
          
          <button
            type="button"
            onClick={handleDescargarPDF}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-utcv text-sm font-bold transition-colors shadow-sm border border-utcv-accent-dark select-none"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary-dark)' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
          >
            <span>Descargar FODVI08-H prellenado</span>
          </button>
        </div>

        {/* 2. Zona Carga PDF firmado */}
        <div className="space-y-4 pt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Paso 2: Carga tu formato firmado</p>
          <p className="text-sm text-gray-600 font-medium">
            Imprime el documento PDF, recaba la firma física del Alumno, Asesor Académico y Asesor Industrial, escanéalo completo de nuevo a PDF y cárgalo aquí.
          </p>

          <div
            onDragOver={handleDragOverEvidencia}
            onDragLeave={handleDragLeaveEvidencia}
            onDrop={handleDropEvidencia}
            onClick={() => fileInputEvidenciaRef.current?.click()}
            className={`border-2 border-dashed rounded-utcv p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragEvidenciaOver ? 'bg-utcv-primary-light border-utcv-primary' : 'bg-gray-50 border-gray-300 hover:bg-gray-100/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputEvidenciaRef}
              onChange={(e) => e.target.files?.[0] && validarYEstablecerEvidencia(e.target.files[0])}
              accept=".pdf"
              className="hidden"
            />
            
            {archivoEvidencia ? (
              <div className="flex flex-col items-center space-y-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-utcv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-bold text-gray-800">{archivoEvidencia.name}</span>
                <span className="text-xs text-gray-400 font-medium">({(archivoEvidencia.size / (1024 * 1024)).toFixed(2)} MB)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArchivoEvidencia(null);
                  }}
                  className="px-2 py-1 text-xs bg-red-50 text-utcv-danger font-bold hover:bg-red-100 transition-colors rounded"
                >
                  Eliminar archivo
                </button>
              </div>
            ) : (
              <div className="text-center space-y-1 text-gray-500 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 block mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-sm font-semibold text-gray-700">Arrastra tu archivo firmado aquí o haz clic</p>
                <p className="text-xs">Solo formato PDF firmado, tamaño menor a 5MB</p>
              </div>
            )}
          </div>

          {evidenciaError && <p className="text-xs text-utcv-danger font-medium mt-1">{evidenciaError}</p>}
        </div>

        {/* Botón de envío final */}
        <button
          type="button"
          onClick={handleEnviarEvidencia}
          disabled={enviando || !archivoEvidencia}
          className="w-full h-12 flex items-center justify-center text-sm font-bold text-white rounded-utcv transition-all select-none shadow"
          style={{
            backgroundColor: (enviando || !archivoEvidencia) ? '#d6cbd0' : 'var(--color-primary)',
            cursor: (enviando || !archivoEvidencia) ? 'not-allowed' : 'pointer'
          }}
          onMouseOver={(e) => {
            if (!enviando && archivoEvidencia) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }
          }}
          onMouseOut={(e) => {
            if (!enviando && archivoEvidencia) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }
          }}
        >
          {enviando ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-custom"></div>
              <span>Subiendo archivo...</span>
            </div>
          ) : (
            'Enviar evidencia final firmada'
          )}
        </button>

        {/* Timeline */}
        {renderTimeline(2)}
      </div>
    );
  }

  // 5. VISTA COMPLETADO
  if (estatusActual === 'Completado') {
    return (
      <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-green-50 text-utcv-success rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-950">¡Trámite de Estadía Completado!</h3>
          <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">
            Has cargado satisfactoriamente toda la documentación digital firmada y el trámite ha finalizado con éxito.
          </p>
        </div>

        {/* Links a los archivos finalizados */}
        <div className="space-y-3 bg-gray-50 p-4 border border-utcv-border rounded-utcv text-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Archivos Digitales:</p>
          
          <div className="flex flex-col space-y-2.5">
            {formData.ruta_nss && (
              <a 
                href={`http://localhost:3000/storage/${formData.ruta_nss}`}
                target="_blank"
                rel="noreferrer"
                className="text-utcv-primary font-bold hover:underline flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Constancia de Vigencia de Derechos NSS (Descargar)</span>
              </a>
            )}

            {formData.ruta_ine_tutor && (
              <a 
                href={`http://localhost:3000/storage/${formData.ruta_ine_tutor}`}
                target="_blank"
                rel="noreferrer"
                className="text-utcv-primary font-bold hover:underline flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Copia del INE del Tutor (Descargar)</span>
              </a>
            )}
            
            {formData.ruta_evidencia && (
              <a 
                href={`http://localhost:3000/storage/${formData.ruta_evidencia}`}
                target="_blank"
                rel="noreferrer"
                className="text-utcv-primary font-bold hover:underline flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Formato FODVI08-H con Firmas de Autorización (Descargar)</span>
              </a>
            )}
          </div>
        </div>

        {/* Timeline */}
        {renderTimeline(3)}

        {/* Botón Volver al Inicio */}
        <div className="pt-4 select-none">
          <button
            type="button"
            onClick={() => navigate('/alumno/inicio')}
            className="w-full py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-utcv transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return null;
};
