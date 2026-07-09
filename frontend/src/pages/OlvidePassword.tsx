import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const OlvidePassword: React.FC = () => {
  const navigate = useNavigate();
  
  const [identificador, setIdentificador] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorGlobal, setErrorGlobal] = useState('');
  const [errorInput, setErrorInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGlobal('');
    setErrorInput('');
    setMensajeExito('');

    if (!identificador.trim()) {
      setErrorInput('El identificador o matrícula es obligatorio.');
      return;
    }

    setCargando(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        identificador,
      });

      if (response.data.mensaje) {
        setMensajeExito(response.data.mensaje);
      }
    } catch (error: any) {
      console.error('Error al recuperar contraseña:', error);
      if (error.response && error.response.data && error.response.data.mensaje) {
        setErrorGlobal(error.response.data.mensaje);
      } else {
        setErrorGlobal('No se pudo establecer conexión con el servidor.');
      }
    } finally {
      setCargando(false);
    }
  };

  const isFormVacio = !identificador;

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-6 sm:p-12 bg-gray-50 relative animate-fade-in-premium">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Logo y Título */}
        <div className="flex flex-col items-center select-none text-center">
          <img 
            src="/logo_utcv.png" 
            alt="Logo UTCV" 
            className="h-20 w-auto object-contain mb-3" 
          />
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium text-center">
            Ingresa tu matrícula o correo para recibir un enlace de recuperación.
          </p>
        </div>

        {/* Alertas */}
        {errorGlobal && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm flex items-start space-x-2 text-red-600 animate-fade-in">
            <span>{errorGlobal}</span>
          </div>
        )}

        {mensajeExito && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm flex items-start space-x-2 text-green-700 animate-fade-in">
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Formulario */}
        {!mensajeExito && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="identificador" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Identificador
              </label>
              <div className="relative rounded-lg shadow-sm">
                <input
                  id="identificador"
                  type="text"
                  required
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="Matrícula o correo institucional"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm transition-colors"
                />
              </div>
              {errorInput && (
                <p className="text-xs font-medium mt-1 text-red-500 transition-colors">
                  {errorInput}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isFormVacio || cargando}
              className="w-full h-12 flex items-center justify-center rounded-lg text-white font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
              style={{
                backgroundColor: isFormVacio || cargando ? '#d6cbd0' : 'var(--color-primary)',
                cursor: isFormVacio || cargando ? 'not-allowed' : 'pointer'
              }}
            >
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}

        {/* Botón Volver */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Volver a inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
};
