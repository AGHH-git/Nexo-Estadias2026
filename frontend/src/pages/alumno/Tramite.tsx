// ARCHIVO: frontend/src/pages/alumno/Tramite.tsx
import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Stepper } from '../../components/Stepper';
import { Fase1Institucional } from './fases/Fase1Institucional';
import { Fase2Empresa } from './fases/Fase2Empresa';
import { Fase3Proyecto } from './fases/Fase3Proyecto';
import { Fase4Logistica } from './fases/Fase4Logistica';
import { Fase5Documentos } from './fases/Fase5Documentos';
import api from '../../services/api';
import { Alumno, EstatusTramite } from '../../types';

export const Tramite: React.FC = () => {
  const [pasoActivo, setPasoActivo] = useState(1);
  const [direccion, setDireccion] = useState<'forward' | 'backward'>('forward');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Perfil del Alumno
  const [alumno, setAlumno] = useState<Alumno | null>(null);

  // ID y estatus del trámite en la BD
  const [tramiteId, setTramiteId] = useState<number | null>(null);
  const [estatusActual, setEstatusActual] = useState<EstatusTramite | 'Borrador'>('Borrador');
  const [archivoIneTutor, setArchivoIneTutor] = useState<File | null>(null);

  // Datos globales del formulario unificados
  const [formData, setFormData] = useState<any>({
    empresa_id: null,
    razon_social: '',
    nombre_comercial: '',
    rfc: '',
    fecha_constitucion: '2020-01-01',
    giro: 'Servicios',
    tamano: 'Micro 1-10',
    tipo_empresa: 'Privada',
    estado: 'Veracruz',
    municipio: '',
    cp: '',
    domicilio: '',
    telefono_empresa: '',

    asesor_ind_nombre: '',
    asesor_ind_cargo: '',
    asesor_ind_telefono: '',
    asesor_ind_email: '',

    nivel_academico: 'TSU',
    nombre_programa: '',
    titulo_proyecto: '',
    problematica: '',
    alcance: '',
    linea_investigacion: '',
    producto_generar: '',

    horario_alumno: '',
    fecha_inicio: '',
    fecha_termino: '',
    modalidad_estadia: 'Local',

    ruta_nss: '',
    ruta_ine_tutor: '',
    ruta_evidencia: '',
    observaciones: [],
  });

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      // 1. Cargar perfil del alumno
      const resPerfil = await api.get<Alumno>('/alumno/perfil');
      setAlumno(resPerfil.data);

      // Actualizar nombre_programa en formData si está vacío con la carrera del alumno
      setFormData((prev: any) => ({
        ...prev,
        nombre_programa: prev.nombre_programa || resPerfil.data.carrera,
        periodo_nombre: (resPerfil.data as any).periodo_nombre,
        periodo_anio: (resPerfil.data as any).periodo_anio,
      }));

      // 2. Cargar trámite activo si existe
      const resTramite = await api.get<any>('/alumno/tramite');
      
      if (resTramite.data) {
        const tramite = resTramite.data;
        setTramiteId(tramite.id);
        setEstatusActual(tramite.estatus);

        // Prellenar el formulario con los datos cargados de la base de datos
        setFormData({
          empresa_id: tramite.empresa_id,
          razon_social: tramite.razon_social || '',
          nombre_comercial: tramite.nombre_comercial || '',
          rfc: tramite.rfc || '',
          fecha_constitucion: tramite.fecha_constitucion ? tramite.fecha_constitucion.split('T')[0] : '2020-01-01',
          giro: tramite.giro || 'Servicios',
          tamano: tramite.tamano || 'Micro 1-10',
          tipo_empresa: tramite.tipo_empresa || 'Privada',
          estado: tramite.estado || 'Veracruz',
          municipio: tramite.municipio || '',
          cp: tramite.cp || '',
          domicilio: tramite.domicilio || '',
          telefono_empresa: tramite.empresa_telefono || '',

          asesor_ind_nombre: tramite.asesor_ind_nombre || '',
          asesor_ind_cargo: tramite.asesor_ind_cargo || '',
          asesor_ind_telefono: tramite.asesor_ind_telefono || '',
          asesor_ind_email: tramite.asesor_ind_email || '',

          nivel_academico: tramite.nivel_academico || 'TSU',
          nombre_programa: tramite.nombre_programa || resPerfil.data.carrera,
          titulo_proyecto: tramite.titulo_proyecto || '',
          problematica: tramite.problematica || '',
          alcance: tramite.alcance || '',
          linea_investigacion: tramite.linea_investigacion || '',
          producto_generar: tramite.producto_generar || '',

          horario_alumno: tramite.horario_alumno || '',
          fecha_inicio: tramite.fecha_inicio ? tramite.fecha_inicio.split('T')[0] : '',
          fecha_termino: tramite.fecha_termino ? tramite.fecha_termino.split('T')[0] : '',
          modalidad_estadia: tramite.modalidad_estadia || 'Local',

          ruta_nss: tramite.ruta_nss || '',
          ruta_ine_tutor: tramite.ruta_ine_tutor || '',
          ruta_evidencia: tramite.ruta_evidencia || '',
          observaciones: tramite.observaciones || [],
        });

        // Si el trámite no está en Borrador o Rechazado, mandar al paso 5 directo para ver estatus
        if (tramite.estatus !== 'Borrador' && tramite.estatus !== 'Rechazado Digital') {
          setPasoActivo(5);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar datos de estadías:', err);
      setError('Ocurrió un error al cargar tus datos. Revisa tu conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleActualizarDatos = (campos: Partial<any>) => {
    setFormData((prev: any) => ({
      ...prev,
      ...campos,
    }));
  };

  const irAPasoSiguiente = () => {
    setDireccion('forward');
    setPasoActivo((prev) => Math.min(prev + 1, 5));
  };

  const irAPasoAnterior = () => {
    setDireccion('backward');
    setPasoActivo((prev) => Math.max(prev - 1, 1));
  };

  const irAPasoEspecifico = (paso: number) => {
    setDireccion(paso > pasoActivo ? 'forward' : 'backward');
    setPasoActivo(paso);
  };

  // Renderizar la fase activa del formulario
  const renderFaseActiva = () => {
    switch (pasoActivo) {
      case 1:
        return (
          <Fase1Institucional 
            alumno={alumno} 
            onSiguiente={irAPasoSiguiente} 
          />
        );
      case 2:
        return (
          <Fase2Empresa
            formData={formData}
            onActualizarDatos={handleActualizarDatos}
            onSiguiente={irAPasoSiguiente}
            onAnterior={irAPasoAnterior}
          />
        );
      case 3:
        return (
          <Fase3Proyecto
            formData={formData}
            onActualizarDatos={handleActualizarDatos}
            onSiguiente={irAPasoSiguiente}
            onAnterior={irAPasoAnterior}
          />
        );
      case 4:
        return (
          <Fase4Logistica
            formData={formData}
            archivoIneTutor={archivoIneTutor}
            setArchivoIneTutor={setArchivoIneTutor}
            onActualizarDatos={handleActualizarDatos}
            onSiguiente={irAPasoSiguiente}
            onAnterior={irAPasoAnterior}
          />
        );
      case 5:
        return (
          <Fase5Documentos
            formData={formData}
            estatusActual={estatusActual}
            tramiteId={tramiteId}
            archivoIneTutor={archivoIneTutor}
            onAnterior={irAPasoAnterior}
            onRecargarTramite={cargarDatos}
            onIrAPaso={irAPasoEspecifico}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Navbar Superior Fijo */}
      <Navbar />

      {/* Contenido Principal con Animación de Entrada */}
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12 space-y-6 animate-fade-in-premium">
        
        {/* Encabezado del Formulario */}
        <div className="bg-white rounded-utcv shadow-utcv p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo_utcv.png" 
                alt="Logo UTCV" 
                className="h-20 w-auto object-contain shrink-0" 
              />
              <div>
                <h2 className="text-2xl font-extrabold text-utcv-primary">
                  Trámite de Estadía Profesional
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  Universidad Tecnológica del Centro de Veracruz
                </p>
              </div>
            </div>
            
            {/* Estatus Global Badge */}
            <div className="select-none">
              <span 
                className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: 
                    estatusActual === 'Completado' 
                      ? 'rgba(39, 174, 96, 0.1)' 
                      : estatusActual === 'Aprobado para Firmas'
                      ? 'rgba(41, 128, 185, 0.1)'
                      : estatusActual === 'En Revisión Digital'
                      ? 'rgba(230, 126, 34, 0.1)'
                      : estatusActual === 'Rechazado Digital'
                      ? 'rgba(192, 57, 43, 0.1)'
                      : 'rgba(85, 85, 85, 0.1)',
                  color: 
                    estatusActual === 'Completado' 
                      ? 'var(--color-success)' 
                      : estatusActual === 'Aprobado para Firmas'
                      ? 'var(--color-info)'
                      : estatusActual === 'En Revisión Digital'
                      ? 'var(--color-warning)'
                      : estatusActual === 'Rechazado Digital'
                      ? 'var(--color-danger)'
                      : 'var(--color-text-secondary)',
                  borderColor: 'currentColor'
                }}
              >
                Estatus: {estatusActual}
              </span>
            </div>
          </div>

          {/* Stepper Horizontal */}
          <div className="border-t border-gray-100 mt-6 pt-2">
            <Stepper pasoActivo={pasoActivo} />
          </div>
        </div>

        {/* Carga o Contenido */}
        {cargando ? (
          <div className="bg-white rounded-utcv shadow-utcv p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
            <p className="text-sm font-semibold text-gray-500">Cargando expediente digital...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-utcv shadow-utcv p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-utcv-danger rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-utcv-danger">Error de carga</h3>
            <p className="text-sm text-gray-600 font-medium">{error}</p>
            <button
              onClick={cargarDatos}
              className="px-5 py-2 bg-utcv-primary hover:bg-utcv-primary-dark text-white rounded text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Reintentar
            </button>
          </div>
        ) : alumno?.asesor_academico === 'No asignado aún' ? (
          <div className="bg-white rounded-utcv shadow-utcv p-16 text-center space-y-6 animate-fade-in-premium border border-red-100">
            <div className="w-20 h-20 bg-red-50 text-utcv-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Registro Bloqueado</h3>
            <p className="text-base text-gray-600 font-medium max-w-xl mx-auto leading-relaxed">
              No puedes iniciar el registro de tu trámite porque <strong>aún no tienes un Asesor Académico asignado</strong> por tu Jefe de Carrera.
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto mt-2">
              El proceso de estadías requiere que tengas un maestro asignado para que revise la documentación que estás a punto de enviar. Comunícate con tu jefatura de carrera para solicitarlo.
            </p>
          </div>
        ) : (
          <div key={pasoActivo} className={direccion === 'forward' ? 'animate-slide-left-enter' : 'animate-slide-right-enter'}>
            {renderFaseActiva()}
          </div>
        )}
      </main>
    </div>
  );
};
