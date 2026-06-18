// ARCHIVO: frontend/src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { LoginResponse } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados del formulario
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  
  // Estados de control
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');
  const [errorsInline, setErrorsInline] = useState({ identificador: '', password: '' });

  // Mensaje de redirección de sesión expirada
  useEffect(() => {
    if (searchParams.get('mensaje') === 'sesion_expirada') {
      setErrorGlobal('Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.');
    }
  }, [searchParams]);

  // Si ya hay sesión iniciada, redirigir automáticamente según rol
  useEffect(() => {
    const token = localStorage.getItem('utcv_token');
    const rol = localStorage.getItem('utcv_rol');
    if (token && rol) {
      redirigirPorRol(rol);
    }
  }, []);

  const redirigirPorRol = (rol: string) => {
    switch (rol) {
      case 'ALUMNO':
        navigate('/alumno/pre-home');
        break;
      case 'MAESTRO':
        navigate('/maestro/dashboard');
        break;
      case 'JEFE_CARRERA':
        navigate('/jefe/dashboard');
        break;
      case 'VINCULACION':
        navigate('/vinculacion/dashboard');
        break;
      default:
        setErrorGlobal('Rol de usuario no reconocido.');
    }
  };

  const handleIngresar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGlobal('');
    setErrorsInline({ identificador: '', password: '' });

    // Validaciones en cliente
    let hayErrores = false;
    const tempErrors = { identificador: '', password: '' };

    if (!identificador.trim()) {
      tempErrors.identificador = 'El identificador o matrícula es obligatorio.';
      hayErrores = true;
    }
    if (!password) {
      tempErrors.password = 'La contraseña es obligatoria.';
      hayErrores = true;
    }

    if (hayErrores) {
      setErrorsInline(tempErrors);
      return;
    }

    setCargando(true);

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        identificador,
        password
      });

      const { token, rol, nombre, requiereCambioPassword } = response.data as any;

      // Almacenar en LocalStorage
      localStorage.setItem('utcv_token', token);
      localStorage.setItem('utcv_rol', rol);
      localStorage.setItem('utcv_nombre', nombre);
      localStorage.setItem('utcv_requiere_cambio', requiereCambioPassword ? 'true' : 'false');

      // Redirigir
      if (requiereCambioPassword) {
        navigate('/cambiar-password');
      } else {
        redirigirPorRol(rol);
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      if (error.response && error.response.data && error.response.data.mensaje) {
        setErrorGlobal(error.response.data.mensaje);
      } else {
        setErrorGlobal('No se pudo establecer conexión con el servidor. Inténtalo más tarde.');
      }
    } finally {
      setCargando(false);
    }
  };

  const isFormVacio = !identificador || !password;

  return (
    <div className="min-h-screen w-full flex flex-row animate-fade-in-premium">
      {/* MITAD IZQUIERDA (Visible solo en desktop - md y superiores) */}
      <div 
        className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden select-none"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {/* Patrón geométrico sutil */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Header Izquierda */}
        <div></div>

        {/* Centro de la Mitad Izquierda */}
        <div className="z-10 text-center flex flex-col items-center">
          <img 
            src="/logo_utcv.png" 
            alt="Logo UTCV" 
            className="h-40 w-auto object-contain drop-shadow-md mb-4 bg-white/10 rounded-lg p-2" 
          />
          <h1 className="text-white font-extrabold text-5xl tracking-wider drop-shadow-md">
            UTCV
          </h1>
          <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1.5 max-w-sm">
            Universidad Tecnológica del Centro de Veracruz
          </p>
          <div 
            className="w-24 h-1 my-4 rounded"
            style={{ backgroundColor: 'var(--color-accent)' }}
          ></div>
          <p className="text-white text-lg font-medium max-w-md tracking-wide">
            Sistema de Gestión de Estadías Profesionales
          </p>
        </div>

        {/* Sección de 2 Iconos Descriptivos al Pie */}
        <div className="z-10 grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
          <div className="text-center flex flex-col items-center">
            {/* SVG Registro Digital */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white mb-1 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-[10px] sm:text-xs text-white/80 font-medium block">
              Registro digital
            </span>
          </div>
          <div className="text-center flex flex-col items-center">
            {/* SVG Generación de FODVI08-H */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white mb-1 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] sm:text-xs text-white/80 font-medium block">
              Generación de FODVI08-H
            </span>
          </div>
        </div>
      </div>

      {/* MITAD DERECHA (Fondo Blanco, Centrado) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-white relative">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo visible solo en móvil */}
          <div className="flex md:hidden flex-col items-center select-none text-center">
            <img 
              src="/logo_utcv.png" 
              alt="Logo UTCV" 
              className="h-28 w-auto object-contain mb-3" 
            />
            <h1 className="font-extrabold text-4xl tracking-wider" style={{ color: 'var(--color-primary)' }}>
              UTCV
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-gray-500 max-w-xs">
              Universidad Tecnológica del Centro de Veracruz
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider mt-1.5" style={{ color: 'var(--color-accent-dark)' }}>
              Sistema de Estadías Profesionales
            </p>
          </div>

          {/* Títulos */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-gray-950 tracking-tight">
              Bienvenido
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Ingresa tu matrícula o correo institucional
            </p>
          </div>

          {/* Alerta de Error Global */}
          {errorGlobal && (
            <div 
              className="p-4 rounded-utcv border text-sm flex items-start space-x-2 animate-fade-in"
              style={{ 
                backgroundColor: 'rgba(192, 57, 43, 0.05)', 
                borderColor: 'rgba(192, 57, 43, 0.2)',
                color: 'var(--color-danger)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-utcv-danger shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorGlobal}</span>
            </div>
          )}

          {/* Formulario */}
          <form className="mt-8 space-y-6" onSubmit={handleIngresar}>
            
            {/* Campo Identificador */}
            <div className="space-y-1">
              <label htmlFor="identificador" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Identificador
              </label>
              <div className="relative rounded-utcv shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  {/* Icono Usuario */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="identificador"
                  type="text"
                  required
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="Matrícula o correo institucional"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-utcv text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary text-sm transition-colors"
                  style={{ borderRadius: 'var(--border-radius)' }}
                />
              </div>
              {errorsInline.identificador && (
                <p className="text-xs font-medium mt-1 transition-colors" style={{ color: 'var(--color-danger)' }}>
                  {errorsInline.identificador}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative rounded-utcv shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  {/* Icono Candado */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-utcv text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary text-sm transition-colors"
                  style={{ borderRadius: 'var(--border-radius)' }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                >
                  {/* Icono Ojo / Ojo Tachado */}
                  {mostrarPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 14H3a1 1 0 01-1-1v-5a1 1 0 011-1h1.729l-1.78-1.781A9.96 9.96 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .93 0 1.83-.1 2.7-.294l-1.246-1.246z" />
                    </svg>
                  )}
                </button>
              </div>
              {errorsInline.password && (
                <p className="text-xs font-medium mt-1 transition-colors" style={{ color: 'var(--color-danger)' }}>
                  {errorsInline.password}
                </p>
              )}
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={isFormVacio || cargando}
              className="w-full h-12 flex items-center justify-center border border-transparent text-sm font-bold text-white rounded-utcv transition-all select-none duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-utcv-primary shadow-sm"
              style={{
                backgroundColor: isFormVacio || cargando ? '#d6cbd0' : 'var(--color-primary)',
                color: 'var(--color-white)',
                cursor: isFormVacio || cargando ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => {
                if (!isFormVacio && !cargando) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
                }
              }}
              onMouseOut={(e) => {
                if (!isFormVacio && !cargando) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                }
              }}
            >
              {cargando ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-custom"></div>
                  <span>Verificando...</span>
                </div>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>



          {/* Pie de Página */}
          <div className="text-center pt-8">
            <span className="text-xs text-gray-500 font-medium select-none">
              Acceso exclusivo para la comunidad UTCV
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
