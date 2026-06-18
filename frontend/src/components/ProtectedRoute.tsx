// ARCHIVO: frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { RolUsuario } from '../types';

interface ProtectedRouteProps {
  rolesPermitidos?: RolUsuario[];
  redirectPath?: string;
  isPasswordRoute?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  rolesPermitidos,
  redirectPath = '/login',
  isPasswordRoute = false
}) => {
  const token = localStorage.getItem('utcv_token');
  const rol = localStorage.getItem('utcv_rol') as RolUsuario | null;
  const requiereCambio = localStorage.getItem('utcv_requiere_cambio') === 'true';

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  const getDashboardPath = () => {
    switch (rol) {
      case 'ALUMNO': return '/alumno/inicio';
      case 'MAESTRO': return '/maestro/dashboard';
      case 'JEFE_CARRERA': return '/jefe/dashboard';
      case 'VINCULACION': return '/vinculacion/dashboard';
      default: return '/login';
    }
  };

  // Lógica para forzar el cambio de contraseña
  if (requiereCambio && !isPasswordRoute) {
    return <Navigate to="/cambiar-password" replace />;
  }

  // Si no requiere cambio y está intentando acceder a la vista de cambio, redirigir al dashboard
  if (!requiereCambio && isPasswordRoute) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  // Si se especifican roles permitidos y el rol actual no está en la lista
  if (rolesPermitidos && rol && !rolesPermitidos.includes(rol)) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  // Si está autenticado y tiene rol permitido, renderiza los componentes hijos
  return <Outlet />;
};
