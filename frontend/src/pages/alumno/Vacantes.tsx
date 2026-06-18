import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import api from '../../services/api';

export const Vacantes: React.FC = () => {
  const navigate = useNavigate();
  const [vacantes, setVacantes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showInteresadoModal, setShowInteresadoModal] = useState(false);
  const [vacanteSeleccionada, setVacanteSeleccionada] = useState<any>(null);

  useEffect(() => {
    const fetchVacantes = async () => {
      try {
        const res = await api.get('/vacantes');
        setVacantes(res.data);
      } catch (error) {
        console.error('Error al cargar vacantes', error);
      } finally {
        setCargando(false);
      }
    };
    fetchVacantes();
  }, []);

  const handleInteresado = (vacante: any) => {
    setVacanteSeleccionada(vacante);
    setShowInteresadoModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 pt-28 pb-12 animate-fade-in-premium">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Vacantes de Estadías</h2>
            <p className="text-gray-500 font-medium mt-1">
              Explora las ofertas disponibles y postúlate para realizar tu proyecto de estadía.
            </p>
          </div>
          <button
            onClick={() => navigate('/alumno/pre-home')}
            className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-bold rounded-utcv text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Volver al inicio
          </button>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
          </div>
        ) : vacantes.length === 0 ? (
          <div className="bg-white rounded-utcv shadow-utcv p-10 text-center border border-gray-150">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-lg">Por el momento no hay vacantes publicadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vacantes.map((v) => (
              <div key={v.id} className="bg-white rounded-utcv shadow-utcv overflow-hidden border border-gray-150 hover:shadow-lg transition-shadow flex flex-col">
                <div className="relative h-48 bg-gray-100 flex-shrink-0">
                  {v.foto_url ? (
                    <img src={`http://localhost:3000${v.foto_url}`} alt={v.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Sin imagen</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-utcv-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Estadía
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-1">{v.titulo}</h3>
                    <div className="flex items-center text-utcv-primary font-bold text-sm mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {v.empresa_nombre}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
                      {v.descripcion}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => handleInteresado(v)}
                      className="w-full py-2.5 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold rounded-lg transition-colors flex justify-center items-center"
                    >
                      <span>Estoy interesado</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Estoy Interesado */}
      {showInteresadoModal && vacanteSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-gray-100">
            <div className="bg-utcv-primary p-6 text-center text-white relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold">¡Excelente elección!</h3>
              <button 
                onClick={() => setShowInteresadoModal(false)} 
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8 text-center space-y-6">
              <p className="text-gray-700 text-base font-medium leading-relaxed">
                Si estas interesado envia un correo a <strong>practicas.estadias@utcv.edu.mx</strong> y con el asunto y el nombre de la empresa CV y asistir a Vinculacion para confirmar la informacion
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-left">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Vacante Seleccionada:</p>
                <p className="font-bold text-gray-900">{vacanteSeleccionada.titulo}</p>
                <p className="text-sm text-utcv-primary font-semibold">{vacanteSeleccionada.empresa_nombre}</p>
              </div>

              <button 
                onClick={() => setShowInteresadoModal(false)}
                className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
