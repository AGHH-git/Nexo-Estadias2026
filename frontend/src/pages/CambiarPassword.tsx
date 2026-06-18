import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShieldAlert, ShieldCheck, ArrowLeft } from 'lucide-react';

export const CambiarPassword: React.FC = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const nombre = localStorage.getItem('utcv_nombre') || 'Usuario';
  const rol = localStorage.getItem('utcv_rol') || '';

  const handleVolver = () => {
    localStorage.removeItem('utcv_token');
    localStorage.removeItem('utcv_rol');
    localStorage.removeItem('utcv_nombre');
    localStorage.removeItem('utcv_requiere_cambio');
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);
    try {
      await api.post('/auth/cambiar-password', {
        currentPassword,
        newPassword
      });

      setSuccess('Contraseña actualizada con éxito.');
      localStorage.setItem('utcv_requiere_cambio', 'false');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        switch (rol) {
          case 'ALUMNO': return navigate('/alumno/inicio');
          case 'MAESTRO': return navigate('/maestro/dashboard');
          case 'JEFE_CARRERA': return navigate('/jefe/dashboard');
          case 'VINCULACION': return navigate('/vinculacion/dashboard');
          default: return navigate('/login');
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.response?.data?.mensaje || 'Error al actualizar la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 font-sans animate-fade-in-premium">
      <div className="max-w-md w-full bg-white rounded-utcv shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
        
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-utcv-accent"></div>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Acción Requerida</h2>
          <p className="text-sm text-gray-500 mt-2">
            Hola <span className="font-bold text-gray-700">{nombre}</span>, por motivos de seguridad debes cambiar tu contraseña provisional antes de continuar.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 animate-slide-up font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">¡Contraseña Segura!</h3>
            <p className="text-gray-500 mt-2 text-sm">Serás redirigido a tu panel en un momento...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Contraseña Actual (Provisional)
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ej. 123456"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Vuelve a escribirla"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={cargando || !currentPassword || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center px-4 py-3 bg-utcv-primary text-white rounded-lg font-bold text-sm shadow-md hover:bg-utcv-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-custom"></div>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>

            <button
              type="button"
              onClick={handleVolver}
              className="w-full flex items-center justify-center px-4 py-2 text-gray-500 hover:text-gray-700 font-semibold text-sm transition-colors mt-2"
            >
              <ArrowLeft size={16} className="mr-2" />
              Cancelar y volver al inicio
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
