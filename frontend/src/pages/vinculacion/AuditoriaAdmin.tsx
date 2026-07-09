import React, { useState, useEffect } from 'react';
import { Search, Activity, Clock, User, Filter, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface AuditoriaLog {
  id: number;
  accion: string;
  detalles: string;
  fecha: string;
  usuario_identificador: string;
  usuario_rol: string;
}

export const AuditoriaAdmin: React.FC = () => {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async (search = searchTerm, currentPage = page) => {
    setCargando(true);
    setError('');
    try {
      const response = await api.get(`/admin/vinculacion/auditoria?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(search)}`);
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.totalPages);
      setTotalLogs(response.data.pagination.total);
    } catch (error) {
      console.error('Error al cargar logs:', error);
      setError('Hubo un error al cargar el historial de actividad.');
    } finally {
      setCargando(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(searchTerm, 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(p => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(p => p + 1);
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getActionColor = (accion: string) => {
    const acc = accion.toLowerCase();
    if (acc.includes('login') || acc.includes('inicio')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (acc.includes('password') || acc.includes('contraseña')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (acc.includes('aprob') || acc.includes('complet')) return 'bg-green-100 text-green-800 border-green-200';
    if (acc.includes('rechaz') || acc.includes('elimin') || acc.includes('error')) return 'bg-red-100 text-red-800 border-red-200';
    if (acc.includes('carga') || acc.includes('subir') || acc.includes('actualiz')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-utcv-primary" size={28} />
            Monitor de Actividad
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Historial detallado de todas las acciones realizadas en el sistema.
          </p>
        </div>
        
        <div className="flex bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 items-center gap-3">
          <div className="p-2 bg-utcv-primary/10 rounded-full">
            <Clock size={20} className="text-utcv-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Registros Totales</p>
            <p className="text-lg font-bold text-gray-900">{totalLogs}</p>
          </div>
        </div>
      </div>

      {/* Buscador y Controles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-utcv-primary hover:bg-utcv-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Filter size={18} />
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[300px]">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-utcv-primary rounded-full animate-spin"></div>
                      <span className="text-gray-500 font-medium">Cargando registros...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Activity className="text-gray-300 mb-3" size={48} />
                      <p className="font-medium text-lg text-gray-600">No se encontraron registros</p>
                      <p className="text-sm">Intenta con otros términos de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatearFecha(log.fecha)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <User size={16} className="text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{log.usuario_identificador || 'Sistema'}</div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{log.usuario_rol || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getActionColor(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{log.detalles}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!cargando && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600 font-medium">
              Página <span className="font-bold text-gray-900">{page}</span> de <span className="font-bold text-gray-900">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
