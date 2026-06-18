import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Tramite } from './pages/alumno/Tramite';
import { InicioAlumno } from './pages/alumno/InicioAlumno';
import { PreHome } from './pages/alumno/PreHome';
import { Vacantes } from './pages/alumno/Vacantes';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { VinculacionDashboard } from './pages/vinculacion/VinculacionDashboard';
import { VacantesAdmin } from './pages/vinculacion/VacantesAdmin';
import { JefeDashboard } from './pages/jefe/JefeDashboard';
import { JefeAsignaciones } from './pages/jefe/JefeAsignaciones';
import { MaestroDashboard } from './pages/maestro/MaestroDashboard';
import { CambiarPassword } from './pages/CambiarPassword';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública: Login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta Forzada: Cambio de Contraseña */}
        <Route element={<ProtectedRoute isPasswordRoute={true} />}>
          <Route path="/cambiar-password" element={<CambiarPassword />} />
        </Route>

        {/* Rutas Protegidas para ALUMNOS */}
        <Route element={<ProtectedRoute rolesPermitidos={['ALUMNO']} />}>
          <Route path="/alumno/pre-home" element={<PreHome />} />
          <Route path="/alumno/vacantes" element={<Vacantes />} />
          <Route path="/alumno/inicio" element={<InicioAlumno />} />
          <Route path="/alumno/tramite" element={<Tramite />} />
        </Route>

        {/* Admin Panels (Vinculación, Jefe de Carrera, Maestro) usando AdminLayout */}
        
        {/* MAESTRO */}
        <Route element={<ProtectedRoute rolesPermitidos={['MAESTRO']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/maestro/dashboard" element={<MaestroDashboard />} />
            {/* Otras rutas de maestro irán aquí */}
          </Route>
        </Route>

        {/* JEFE DE CARRERA */}
        <Route element={<ProtectedRoute rolesPermitidos={['JEFE_CARRERA']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/jefe/dashboard" element={<JefeDashboard />} />
            <Route path="/jefe/asignaciones" element={<JefeAsignaciones />} />
          </Route>
        </Route>

        {/* VINCULACION */}
        <Route element={<ProtectedRoute rolesPermitidos={['VINCULACION']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/vinculacion/dashboard" element={<VinculacionDashboard />} />
            <Route path="/vinculacion/vacantes" element={<VacantesAdmin />} />
            {/* Otras rutas de vinculacion irán aquí */}
          </Route>
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
