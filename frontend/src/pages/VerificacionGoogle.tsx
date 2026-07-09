import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import api from '../services/api';
import { ArrowLeft } from 'lucide-react';

export const VerificacionGoogle: React.FC = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleVolver = () => {
    localStorage.removeItem('utcv_token');
    localStorage.removeItem('utcv_rol');
    localStorage.removeItem('utcv_nombre');
    localStorage.removeItem('utcv_requiere_cambio');
    navigate('/login');
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setCargando(true);
    setError('');
    try {
      const res = await api.post('/auth/verificar-google', {
        credential: credentialResponse.credential,
      });
      // Guardar el nuevo token que tiene googleVerificado = true
      localStorage.setItem('utcv_token', res.data.token);
      // Redirigir ahora sí al cambio de contraseña
      navigate('/cambiar-password');
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.mensaje) {
        setError(err.response.data.mensaje);
      } else {
        setError('Error al verificar tu cuenta con Google Institucional.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 animate-fade-in-premium">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img 
          src="/logo_utcv.png" 
          alt="Logo UTCV" 
          className="mx-auto h-24 w-auto object-contain mb-4" 
        />
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Verificación Institucional
        </h2>
        <p className="mt-3 text-center text-sm text-gray-600 font-medium px-4">
          Como es tu primer inicio de sesión, debes comprobar tu identidad con tu correo institucional UTCV antes de actualizar tu contraseña.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-xl sm:rounded-xl sm:px-10 flex flex-col items-center border border-gray-100">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm w-full flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {cargando ? (
            <div className="flex flex-col items-center space-y-3 my-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-utcv-primary rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Verificando...</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-2 space-y-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('El inicio de sesión con Google falló o fue cancelado.')}
                theme="filled_blue"
                size="large"
                shape="rectangular"
                width="100%"
                text="continue_with"
              />
              
              {import.meta.env.VITE_DISABLE_GOOGLE_AUTH === 'true' && (
                <button
                  type="button"
                  onClick={() => navigate('/cambiar-password')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-bold text-sm transition-colors mt-2 rounded-utcv"
                >
                  Saltar Verificación (Modo Prueba)
                </button>
              )}

              <button
                type="button"
                onClick={handleVolver}
                className="w-full flex items-center justify-center px-4 py-2 text-gray-500 hover:text-gray-700 font-semibold text-sm transition-colors mt-2"
              >
                <ArrowLeft size={16} className="mr-2" />
                Cancelar y volver al inicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
