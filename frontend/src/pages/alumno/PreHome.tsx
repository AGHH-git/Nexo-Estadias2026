import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import api from '../../services/api';
import { Alumno } from '../../types';

export const PreHome: React.FC = () => {
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const resPerfil = await api.get<Alumno>('/alumno/perfil');
        setAlumno(resPerfil.data);
      } catch (err) {
        console.error('Error al cargar perfil en pre-home:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-28 pb-12 space-y-10 animate-fade-in-premium">
        {/* Encabezado */}
        <div className="bg-white rounded-utcv shadow-utcv p-8 md:p-10 flex flex-col items-center justify-center text-center border-b border-gray-150">
          <img 
            src="/logo_utcv.png" 
            alt="Logo UTCV" 
            className="h-24 w-auto object-contain mb-4" 
          />
          <h2 className="text-3xl md:text-4xl font-extrabold text-utcv-primary">
            ¡Bienvenido a tu Espacio, {cargando ? 'Cargando...' : alumno?.nombre_completo || 'Estudiante'}!
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-3 max-w-2xl mx-auto leading-relaxed">
            Aquí comienza tu camino profesional. Elige la opción que necesites: explora las oportunidades disponibles en empresas o continúa con el registro y seguimiento de tu proyecto de estadía.
          </p>
        </div>

        {/* Tarjetas de Selección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tarjeta: Ver Vacantes */}
          <button 
            onClick={() => navigate('/alumno/vacantes')}
            className="group relative bg-white rounded-utcv shadow-utcv overflow-hidden border border-gray-150 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-left"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-utcv-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-gray-900">Ver Vacantes</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Explora las ofertas y vacantes disponibles en diversas empresas buscando talento como el tuyo. Encuentra el lugar ideal para realizar tus estadías.
                </p>
              </div>
              <div className="flex items-center text-orange-600 font-bold text-sm uppercase tracking-wider group-hover:text-orange-700 transition-colors">
                <span>Explorar vacantes</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </button>

          {/* Tarjeta: Registro FODVIC */}
          <button 
            onClick={() => navigate('/alumno/inicio')}
            className="group relative bg-white rounded-utcv shadow-utcv overflow-hidden border border-gray-150 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-left"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-utcv-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-xl bg-blue-50 text-utcv-primary flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-gray-900">Registro de Estadías (FODVIC)</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  ¿Ya tienes una empresa? Ingresa aquí para registrar tus datos, llenar el FODVI08-H y dar seguimiento al trámite de tus estadías profesionales.
                </p>
              </div>
              <div className="flex items-center text-utcv-primary font-bold text-sm uppercase tracking-wider group-hover:text-utcv-primary-dark transition-colors">
                <span>Continuar al registro</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </button>

        </div>
      </main>
    </div>
  );
};
