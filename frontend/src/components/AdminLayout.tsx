import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LogOut, 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  ChevronRight
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const rol = localStorage.getItem('utcv_rol') || '';
  const nombre = localStorage.getItem('utcv_nombre') || 'Usuario';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('utcv_token');
    localStorage.removeItem('utcv_rol');
    localStorage.removeItem('utcv_nombre');
    if (document.startViewTransition) {
      document.documentElement.classList.add('transition-logout');
      document.startViewTransition(() => {
        navigate('/login');
        document.documentElement.classList.remove('transition-logout');
      });
    } else {
      navigate('/login');
    }
  };

  const getMenuByRol = () => {
    switch (rol) {
      case 'VINCULACION':
        return [
          { name: 'Inicio', path: '/vinculacion/dashboard', icon: <Home size={20} /> },
          { name: 'Periodos', path: '/vinculacion/periodos', icon: <Calendar size={20} /> },
          { name: 'Reportes', path: '/vinculacion/reportes', icon: <FileText size={20} /> },
          { name: 'Ajustes', path: '/vinculacion/configuracion', icon: <Settings size={20} /> }
        ];
      case 'JEFE_CARRERA':
        return [
          { name: 'Inicio', path: '/jefe/dashboard', icon: <Home size={20} /> },
          { name: 'Asignaciones', path: '/jefe/asignaciones', icon: <Users size={20} /> },
          { name: 'Expedientes', path: '/jefe/expedientes', icon: <FileText size={20} /> },
        ];
      case 'MAESTRO':
        return [
          { name: 'Inicio', path: '/maestro/dashboard', icon: <Home size={20} /> },
          { name: 'Mis Alumnos', path: '/maestro/alumnos', icon: <Users size={20} /> },
          { name: 'Revisión', path: '/maestro/revision', icon: <FileText size={20} /> },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuByRol();

  const getRoleBadgeInfo = () => {
    switch (rol) {
      case 'VINCULACION': return { label: 'Super Admin', color: 'bg-utcv-accent text-white' };
      case 'JEFE_CARRERA': return { label: 'Administrador', color: 'bg-blue-600 text-white' };
      case 'MAESTRO': return { label: 'Asesor Académico', color: 'bg-green-600 text-white' };
      default: return { label: 'Usuario', color: 'bg-gray-500 text-white' };
    }
  };

  const badgeInfo = getRoleBadgeInfo();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-inter animate-fade-in-premium">
      
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside 
        className={`fixed md:relative z-50 h-full transition-all duration-300 ease-in-out flex flex-col justify-between shadow-xl
          ${isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full md:w-20 md:translate-x-0'}
        `}
        style={{ backgroundColor: 'var(--color-primary-dark)' }}
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className={`flex items-center space-x-3 overflow-hidden ${!isSidebarOpen && 'md:opacity-0 hidden'}`}>
            <img src="/logo_utcv.png" alt="UTCV" className="h-10 w-auto bg-white/10 p-1 rounded" />
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-tight">UTCV Panel</span>
              <span className="text-white/70 text-[10px] uppercase font-semibold">Estadías 2026</span>
            </div>
          </div>
          {!isSidebarOpen && !isMobile && (
            <div className="mx-auto flex justify-center w-full">
              <img src="/logo_utcv.png" alt="UTCV" className="h-8 w-auto bg-white/10 p-1 rounded" />
            </div>
          )}
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-white/70 hover:text-white">
              <X size={24} />
            </button>
          )}
        </div>

        <div className={`p-4 border-b border-white/10 transition-opacity duration-300 ${!isSidebarOpen ? 'hidden md:block opacity-0 h-0 p-0 border-0' : 'opacity-100'}`}>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 border border-white/10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white mb-2 shadow-inner">
              <span className="font-bold text-xl">{nombre.charAt(0).toUpperCase()}</span>
            </div>
            <p className="text-white font-medium text-sm truncate w-full" title={nombre}>{nombre}</p>
            <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${badgeInfo.color}`}>
              {badgeInfo.label}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item, index) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group
                  ${isActive 
                    ? 'bg-utcv-primary text-white shadow-md border border-white/10' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
                title={!isSidebarOpen ? item.name : ''}
              >
                <div className={`${isActive ? 'text-utcv-accent' : 'text-white/60 group-hover:text-white'} transition-colors`}>
                  {item.icon}
                </div>
                {isSidebarOpen && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
                {isSidebarOpen && isActive && (
                  <ChevronRight size={16} className="ml-auto opacity-70" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center md:justify-start space-x-3 px-3 py-3 rounded-lg text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors group
              ${!isSidebarOpen && 'md:justify-center'}
            `}
            title={!isSidebarOpen ? 'Cerrar Sesión' : ''}
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-medium text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 mr-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-utcv-primary"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">
              {menuItems.find(m => location.pathname.startsWith(m.path))?.name || 'Panel de Administración'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-200 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="font-medium hidden sm:inline-block">Sesión Activa</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8 relative">
          <div className="animate-fade-in-premium min-h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
