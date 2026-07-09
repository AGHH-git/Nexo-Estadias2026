// ARCHIVO: frontend/src/pages/alumno/InicioAlumno.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import api from '../../services/api';
import { Alumno, EstatusTramite } from '../../types';

export const InicioAlumno: React.FC = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [estatusActual, setEstatusActual] = useState<EstatusTramite | 'Sin Iniciar'>('Sin Iniciar');

  const cargarResumen = async () => {
    setCargando(true);
    setError('');
    try {
      // 1. Cargar perfil del alumno
      const resPerfil = await api.get<Alumno>('/alumno/perfil');
      setAlumno(resPerfil.data);

      // 2. Cargar trámite activo si existe
      const resTramite = await api.get<any>('/alumno/tramite');
      if (resTramite.data) {
        setEstatusActual(resTramite.data.estatus);
      } else {
        setEstatusActual('Sin Iniciar');
      }
    } catch (err: any) {
      console.error('Error al cargar resumen del alumno:', err);
      setError('Ocurrió un error al obtener la información de tu cuenta.');
    } finally {
      setCargando(false);
    }
  };

  const handleImprimirFormato = () => {
    window.open('/fodvic.html', '_blank');
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  const handleIrAlTramite = () => {
    navigate('/alumno/tramite');
  };

  // Obtener estilos y textos descriptivos según el estatus
  const getEstatusInfo = () => {
    switch (estatusActual) {
      case 'Borrador':
        return {
          texto: 'Borrador (Faltan datos por enviar)',
          claseBg: 'bg-gray-100 border-gray-300 text-gray-700',
          descripcion: 'Estás llenando tu expediente digital. No olvides enviarlo para revisión cuando completes las primeras 4 fases.',
        };
      case 'En Revisión Digital':
        return {
          texto: 'En Revisión Digital',
          claseBg: 'bg-orange-50 border-orange-200 text-orange-700',
          descripcion: 'Tus asesores académicos y el jefe de carrera están validando la información y la logística de tu estadía.',
        };
      case 'Rechazado Digital':
        return {
          texto: 'Observaciones en Registro',
          claseBg: 'bg-red-50 border-red-200 text-red-700',
          descripcion: 'Se han encontrado observaciones en tu registro de estadía. Por favor revisa los comentarios y corrige los datos.',
        };
      case 'Aprobado para Firmas':
        return {
          texto: 'Aprobado para Firmas',
          claseBg: 'bg-blue-50 border-blue-200 text-blue-700',
          descripcion: '¡Tu registro digital ha sido aprobado! Descarga el formato prellenado FODVI08-H, recaba las firmas físicas y súbelo escaneado.',
        };
      case 'Completado':
        return {
          texto: 'Trámite Completado',
          claseBg: 'bg-green-50 border-green-200 text-green-700',
          descripcion: '¡Felicidades! Tu expediente de estadía profesional está completamente autorizado y archivado en vinculación.',
        };
      default:
        return {
          texto: 'Sin Iniciar',
          claseBg: 'bg-gray-50 border-gray-200 text-gray-500',
          descripcion: 'Aún no has iniciado tu proceso de registro de estadías profesionales para este cuatrimestre.',
        };
    }
  };

  const estatusInfo = getEstatusInfo();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Navbar Superior Fijo */}
      <Navbar />

      {/* Contenido Principal con Entrada Premium */}
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12 space-y-8 animate-fade-in-premium">
        
        {/* Encabezado del Portal */}
        <div className="bg-white rounded-utcv shadow-utcv p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-150">
          <div className="flex items-center space-x-4 md:space-x-6">
            <img 
              src="/logo_utcv.png" 
              alt="Logo UTCV" 
              className="h-20 w-auto object-contain shrink-0" 
            />
            <div>
              <p className="text-xs font-bold text-utcv-accent uppercase tracking-widest leading-none">Portal del Alumno</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-utcv-primary mt-1">
                Universidad Tecnológica del Centro de Veracruz
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">
                Sistema de Gestión y Registro de Estadías Profesionales
              </p>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="bg-white rounded-utcv shadow-utcv p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
            <p className="text-sm font-semibold text-gray-500">Cargando menú de inicio...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-utcv shadow-utcv p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-utcv-danger rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-utcv-danger">Error de datos</h3>
            <p className="text-sm text-gray-600 font-medium">{error}</p>
            <button
              onClick={cargarResumen}
              className="px-5 py-2 bg-utcv-primary hover:bg-utcv-primary-dark text-white rounded text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
              {/* Tarjeta de Bienvenida y Perfil del Alumno */}
              <div className="bg-white rounded-utcv shadow-utcv p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 leading-tight">
                      ¡Hola, {alumno?.nombre_completo || 'Estudiante'}!
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-semibold">
                      Matrícula: {alumno?.matricula} | Carrera: {alumno?.carrera}
                    </p>
                  </div>

                  <div className="shrink-0 select-none">
                    <span className={`px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-wider ${estatusInfo.claseBg}`}>
                      {estatusInfo.texto}
                    </span>
                  </div>
                </div>

                {/* Información sobre el estatus actual del trámite */}
                <div className="bg-gray-50 rounded-utcv p-4 border border-gray-150 flex items-start space-x-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-utcv-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wider">Estado actual del proceso:</h4>
                    <p className="text-sm text-gray-600 font-medium mt-1 leading-relaxed">{estatusInfo.descripcion}</p>
                  </div>
                </div>
              </div>

              {/* Si NO tiene maestro asignado, mostrar pantalla de bloqueo */}
              {alumno?.asesor_academico === 'No asignado aún' ? (
                <div className="bg-white rounded-utcv shadow-utcv p-8 text-center space-y-6 animate-fade-in-premium border border-red-100">
                  <div className="w-16 h-16 bg-red-50 text-utcv-primary rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Acceso Bloqueado</h3>
                  <p className="text-sm text-gray-600 font-medium max-w-lg mx-auto leading-relaxed">
                    Aún no se te ha asignado un <strong>Asesor Académico</strong> para tu estadía. El Jefe de Carrera de tu área debe asignarte un asesor antes de que puedas comenzar a llenar tu registro.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg inline-block text-left text-sm text-blue-800 mt-4">
                    <p><strong>Siguiente paso:</strong> Contacta a tu Jefe de Carrera para solicitar tu asignación.</p>
                  </div>
                </div>
              ) : (
                /* Menú de Acciones / Tarjetas de Navegación */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Tarjeta 1: Registrar o Seguir Trámite */}
                  <div className="bg-white rounded-utcv shadow-utcv hover:shadow-lg border border-gray-150 overflow-hidden group transition-all duration-300 flex flex-col">
                    <div className="p-6 flex-1 space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-utcv-primary-light text-utcv-primary flex items-center justify-center transition-colors group-hover:bg-utcv-primary group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-gray-950">Registro del Trámite</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                          Registra los datos institucionales, la empresa receptora, el nombre del proyecto y los horarios de tu estadía.
                        </p>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <button 
                        onClick={handleIrAlTramite}
                        className="text-xs font-bold text-utcv-primary group-hover:underline flex items-center space-x-1 uppercase tracking-wider"
                      >
                        <span>{estatusActual === 'Sin Iniciar' ? 'Iniciar trámite' : 'Continuar trámite'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Tarjeta 2: Documentos y Descarga */}
                  <div className="bg-white rounded-utcv shadow-utcv hover:shadow-lg border border-gray-150 overflow-hidden group transition-all duration-300 flex flex-col">
                    <div className="p-6 flex-1 space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-utcv-primary-light text-utcv-primary flex items-center justify-center transition-colors group-hover:bg-utcv-primary group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-gray-950">Documentación y Envío</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                          Descarga tu formato oficial FODVI08-H prellenado, sube tu NSS y el archivo escaneado con las firmas de autorización físicas.
                        </p>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <button 
                        onClick={handleIrAlTramite}
                        className="text-xs font-bold text-utcv-primary group-hover:underline flex items-center space-x-1 uppercase tracking-wider"
                      >
                        <span>Ir a documentos</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Tarjeta FODVI08: Imprimir Formato (solo visible si aprobado o completado) */}
                  {(estatusActual === 'Aprobado para Firmas' || estatusActual === 'Completado') && (
                    <div className="bg-white rounded-utcv shadow-utcv hover:shadow-lg border border-blue-100 overflow-hidden group transition-all duration-300 flex flex-col">
                      <div className="p-6 flex-1 space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-gray-950">Imprimir Formato FODVI08</h4>
                          <p className="text-xs text-gray-500 leading-relaxed font-medium">
                            Abre el formato oficial de registro de estadías prellenado con tus datos. Solo presiona Ctrl+P para imprimirlo.
                          </p>
                        </div>
                      </div>
                      <div className="px-6 py-4 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
                        <button
                          id="btn-imprimir-fodvi08"
                          onClick={handleImprimirFormato}
                          className="text-xs font-bold text-blue-600 group-hover:underline flex items-center space-x-1 uppercase tracking-wider"
                        >
                          <span>Imprimir Formato</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tarjeta 3: Reglamento y Requisitos */}
                  <div className="bg-white rounded-utcv shadow-utcv hover:shadow-lg border border-gray-150 overflow-hidden group transition-all duration-300 flex flex-col md:col-span-2">
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 shrink-0 rounded-lg bg-utcv-primary-light text-utcv-primary flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-gray-950">Guía de Estadías y Reglamento Oficial</h4>
                          <p className="text-xs text-gray-500 leading-relaxed font-medium">
                            Conoce las normas académicas e institucionales para la realización y acreditación de tu proyecto de estadía profesional en la UTCV.
                          </p>
                        </div>
                      </div>
                      <a
                        href="https://www.utcv.edu.mx" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="shrink-0 text-center px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-utcv text-xs font-bold text-gray-700 transition-colors uppercase tracking-wider"
                      >
                        Ver Portal UTCV
                      </a>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  };
