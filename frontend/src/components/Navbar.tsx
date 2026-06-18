// ARCHIVO: frontend/src/components/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const nombreUsuario = localStorage.getItem('utcv_nombre') || 'Usuario UTCV';
  const rolUsuario = localStorage.getItem('utcv_rol') || 'ALUMNO';

  const handleCerrarSesion = () => {
    const irALogin = () => {
      localStorage.removeItem('utcv_token');
      localStorage.removeItem('utcv_rol');
      localStorage.removeItem('utcv_nombre');
      navigate('/login');
    };

    if ((document as any).startViewTransition) {
      document.documentElement.classList.add('transition-logout');
      document.documentElement.classList.remove('transition-forward', 'transition-backward', 'transition-login');
      (document as any).startViewTransition(irALogin);
    } else {
      irALogin();
    }
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-[100] text-white shadow-md"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {/* LADO IZQUIERDO: Logo estilizado */}
      <div className="flex items-center space-x-3 select-none">
        <img 
          src="/logo_utcv.png" 
          alt="Logo UTCV" 
          className="h-12 w-auto object-contain bg-white/10 rounded p-1" 
        />
        <div className="flex flex-col">
          <span className="font-extrabold text-lg leading-tight tracking-wider" style={{ color: 'var(--color-white)' }}>
            UTCV
          </span>
          <span className="text-[8px] font-bold uppercase tracking-wider text-white/70 leading-none">
            Universidad Tecnológica del Centro de Veracruz
          </span>
        </div>
        <span className="h-8 w-px bg-white/30 hidden sm:inline-block"></span>
        <span 
          className="text-xs font-semibold uppercase tracking-widest hidden sm:inline-block"
          style={{ color: 'var(--color-accent)' }}
        >
          Sistema de Estadías
        </span>
      </div>

      {/* CENTRO: Nombre del usuario logueado */}
      <div className="text-sm font-medium hidden md:block opacity-90">
        Bienvenido, <span className="font-semibold">{nombreUsuario}</span>
      </div>

      {/* LADO DERECHO: Badge de Rol y Cerrar Sesión */}
      <div className="flex items-center space-x-4">
        {/* Badge del rol */}
        <span 
          className="px-3 py-1 rounded text-xs font-semibold tracking-wider border"
          style={{ 
            color: 'var(--color-accent-dark)', 
            borderColor: 'var(--color-accent)',
            backgroundColor: 'rgba(224, 187, 148, 0.1)'
          }}
        >
          {rolUsuario === 'ALUMNO' ? 'ALUMNO' : rolUsuario}
        </span>

        {/* Botón Cerrar Sesión */}
        <button
          onClick={handleCerrarSesion}
          className="flex items-center space-x-1 px-3 py-1.5 rounded text-sm font-medium hover:bg-white/10 transition-colors"
          title="Cerrar sesión"
        >
          {/* Icono de salida */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
};
