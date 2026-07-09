import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorGlobal('Enlace de recuperación inválido o inexistente.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGlobal('');
    setMensajeExito('');

    if (newPassword.length < 6) {
      setErrorGlobal('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorGlobal('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });

      if (response.data.mensaje) {
        setMensajeExito(response.data.mensaje);
        // Opcional: Redirigir al login después de unos segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);
      if (error.response && error.response.data && error.response.data.mensaje) {
        setErrorGlobal(error.response.data.mensaje);
      } else {
        setErrorGlobal('Ocurrió un error al intentar restablecer la contraseña.');
      }
    } finally {
      setCargando(false);
    }
  };

  const isFormVacio = !newPassword || !confirmPassword || !token;

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
            Restablecer Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium text-center">
            Ingresa tu nueva contraseña a continuación.
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
            <span>{mensajeExito} Redirigiendo...</span>
          </div>
        )}

        {/* Formulario */}
        {!mensajeExito && token && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Al menos 6 caracteres"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm transition-colors"
                  />
                </div>
              </div>
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
              {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
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
