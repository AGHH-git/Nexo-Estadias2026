import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, X, ChevronDown, ChevronUp, 
  AlertTriangle, CheckCircle, Link2, Unlink, Filter, RefreshCw
} from 'lucide-react';
import api from '../../services/api';

interface AlumnoAsignado {
  matricula: string;
  nombre_completo: string;
  carrera: string;
  estatus: string;
  maestro_id: number | null;
}

interface MaestroConAlumnos {
  id: number;
  nombre_completo: string;
  area_adscripcion: string;
  cargo: string;
  telefono: string | null;
  extension: string | null;
  alumnos_asignados: AlumnoAsignado[];
  total_asignados: number;
}

interface AsignacionesData {
  maestros: MaestroConAlumnos[];
  alumnos_sin_asignar: AlumnoAsignado[];
  total_alumnos: number;
  total_sin_asignar: number;
  carrera: string;
}

export const JefeAsignaciones: React.FC = () => {
  const [data, setData] = useState<AsignacionesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estado de búsqueda y filtro
  const [busquedaMaestro, setBusquedaMaestro] = useState('');
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [filtroVista, setFiltroVista] = useState<'todos' | 'con_alumnos' | 'sin_alumnos'>('todos');

  // Estado de expansión de tarjetas de maestros
  const [maestrosExpandidos, setMaestrosExpandidos] = useState<Set<number>>(new Set());

  // Modal de asignación masiva
  const [modalAsignacion, setModalAsignacion] = useState(false);
  const [maestroParaAsignar, setMaestroParaAsignar] = useState<MaestroConAlumnos | null>(null);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<Set<string>>(new Set());
  const [busquedaModal, setBusquedaModal] = useState('');
  const [asignando, setAsignando] = useState(false);

  // Feedback
  const [mensajeFeedback, setMensajeFeedback] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await api.get('/admin/jefe/asignaciones');
      setData(res.data);
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-hide feedback
  useEffect(() => {
    if (mensajeFeedback) {
      const timer = setTimeout(() => setMensajeFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensajeFeedback]);

  // Maestros filtrados
  const maestrosFiltrados = useMemo(() => {
    if (!data) return [];
    let lista = data.maestros;

    // Filtro por búsqueda
    if (busquedaMaestro.trim()) {
      const q = busquedaMaestro.toLowerCase();
      lista = lista.filter(m =>
        m.nombre_completo.toLowerCase().includes(q) ||
        m.area_adscripcion.toLowerCase().includes(q) ||
        m.cargo.toLowerCase().includes(q)
      );
    }

    // Filtro por vista
    if (filtroVista === 'con_alumnos') {
      lista = lista.filter(m => m.total_asignados > 0);
    } else if (filtroVista === 'sin_alumnos') {
      lista = lista.filter(m => m.total_asignados === 0);
    }

    return lista;
  }, [data, busquedaMaestro, filtroVista]);

  // Alumnos sin asignar filtrados (para el modal)
  const alumnosSinAsignarFiltrados = useMemo(() => {
    if (!data) return [];
    if (!busquedaModal.trim()) return data.alumnos_sin_asignar;
    const q = busquedaModal.toLowerCase();
    return data.alumnos_sin_asignar.filter(a =>
      a.nombre_completo.toLowerCase().includes(q) ||
      a.matricula.toLowerCase().includes(q)
    );
  }, [data, busquedaModal]);

  const toggleExpansion = (maestroId: number) => {
    setMaestrosExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(maestroId)) {
        next.delete(maestroId);
      } else {
        next.add(maestroId);
      }
      return next;
    });
  };

  const abrirModalAsignacion = (maestro: MaestroConAlumnos) => {
    setMaestroParaAsignar(maestro);
    setAlumnosSeleccionados(new Set());
    setBusquedaModal('');
    setModalAsignacion(true);
  };

  const cerrarModal = () => {
    setModalAsignacion(false);
    setMaestroParaAsignar(null);
    setAlumnosSeleccionados(new Set());
    setBusquedaModal('');
  };

  const toggleAlumnoSeleccion = (matricula: string) => {
    setAlumnosSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(matricula)) {
        next.delete(matricula);
      } else {
        next.add(matricula);
      }
      return next;
    });
  };

  const seleccionarTodos = () => {
    if (alumnosSeleccionados.size === alumnosSinAsignarFiltrados.length) {
      setAlumnosSeleccionados(new Set());
    } else {
      setAlumnosSeleccionados(new Set(alumnosSinAsignarFiltrados.map(a => a.matricula)));
    }
  };

  const handleAsignacionMasiva = async () => {
    if (!maestroParaAsignar || alumnosSeleccionados.size === 0) return;
    setAsignando(true);
    try {
      await api.post('/admin/jefe/asignar-masivo', {
        maestro_id: maestroParaAsignar.id,
        matriculas: Array.from(alumnosSeleccionados)
      });
      setMensajeFeedback({
        tipo: 'exito',
        texto: `Se vincularon ${alumnosSeleccionados.size} alumno(s) con ${maestroParaAsignar.nombre_completo} correctamente.`
      });
      cerrarModal();
      fetchData(true);
    } catch (error: any) {
      setMensajeFeedback({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al procesar la asignación masiva.'
      });
    } finally {
      setAsignando(false);
    }
  };

  const handleDesasignar = async (matricula: string, nombreAlumno: string) => {
    if (!confirm(`¿Estás seguro de desvincular a "${nombreAlumno}" de su maestro actual?`)) return;
    try {
      await api.post('/admin/jefe/desasignar', { matricula });
      setMensajeFeedback({
        tipo: 'exito',
        texto: `${nombreAlumno} ha sido desvinculado correctamente.`
      });
      fetchData(true);
    } catch (error: any) {
      setMensajeFeedback({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al desvincular al alumno.'
      });
    }
  };

  const handleAsignarIndividual = async (matricula: string, maestroId: number) => {
    try {
      await api.post('/admin/jefe/asignar', { matricula, maestro_id: maestroId });
      setMensajeFeedback({ tipo: 'exito', texto: 'Alumno vinculado correctamente.' });
      fetchData(true);
    } catch (error: any) {
      setMensajeFeedback({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al vincular al alumno.'
      });
    }
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Aprobado para Firmas':
      case 'Completado':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'Rechazado Digital':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'En Revisión Digital':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Borrador':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const avatarColors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-teal-100 text-teal-600',
    'bg-rose-100 text-rose-600',
    'bg-amber-100 text-amber-600',
    'bg-emerald-100 text-emerald-600',
    'bg-indigo-100 text-indigo-600',
    'bg-cyan-100 text-cyan-600',
  ];

  const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];

  return (
    <div className="space-y-6 relative">
      {/* Feedback Global */}
      {mensajeFeedback && (
        <div className={`fixed top-4 right-4 z-[60] max-w-md px-5 py-4 rounded-utcv shadow-2xl border flex items-center space-x-3 animate-slide-up
          ${mensajeFeedback.tipo === 'exito' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {mensajeFeedback.tipo === 'exito' ? (
            <CheckCircle size={20} className="text-green-500 shrink-0" />
          ) : (
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
          )}
          <p className="text-sm font-medium flex-1">{mensajeFeedback.texto}</p>
          <button onClick={() => setMensajeFeedback(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Vinculación de Maestros y Alumnos</h2>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Gestiona la asignación de asesores académicos a los alumnos de tu carrera
            {data?.carrera ? ` (${data.carrera})` : ''}.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-utcv text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
        </div>
      ) : data ? (
        <>
          {/* Resumen Rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-premium">
            <div className="bg-white border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Alumnos</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_alumnos}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <Link2 size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vinculados</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_alumnos - data.total_sin_asignar}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <AlertTriangle size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sin Asignar</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_sin_asignar}</p>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white border border-gray-200 rounded-utcv p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center animate-fade-in-premium" style={{animationDelay: '100ms'}}>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar maestro por nombre, área o cargo..."
                value={busquedaMaestro}
                onChange={(e) => setBusquedaMaestro(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary bg-gray-50"
              />
              {busquedaMaestro && (
                <button onClick={() => setBusquedaMaestro('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select
                value={filtroVista}
                onChange={(e) => setFiltroVista(e.target.value as any)}
                className="border border-gray-300 rounded-lg text-sm py-2.5 px-3 bg-gray-50 focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary"
              >
                <option value="todos">Todos los maestros</option>
                <option value="con_alumnos">Con alumnos asignados</option>
                <option value="sin_alumnos">Sin alumnos asignados</option>
              </select>
            </div>
          </div>

          {/* Grid de Maestros */}
          <div className="space-y-4 animate-fade-in-premium" style={{animationDelay: '200ms'}}>
            {maestrosFiltrados.length > 0 ? (
              maestrosFiltrados.map((maestro) => {
                const isExpanded = maestrosExpandidos.has(maestro.id);
                return (
                  <div key={maestro.id} className="bg-white border border-gray-200 rounded-utcv overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Cabecera del Maestro */}
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(maestro.id)} shrink-0`}>
                          {getInitials(maestro.nombre_completo)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold text-gray-900 truncate">{maestro.nombre_completo}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{maestro.area_adscripcion}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">{maestro.cargo}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0 ml-4">
                        {/* Badge de cantidad */}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border
                          ${maestro.total_asignados > 0 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}
                        >
                          {maestro.total_asignados} alumno{maestro.total_asignados !== 1 ? 's' : ''}
                        </span>

                        {/* Botón Asignar */}
                        <button
                          onClick={() => abrirModalAsignacion(maestro)}
                          disabled={data.total_sin_asignar === 0}
                          className="inline-flex items-center px-3 py-2 bg-utcv-primary text-white rounded-lg text-xs font-bold hover:bg-utcv-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={data.total_sin_asignar === 0 ? 'No hay alumnos sin asignar' : 'Vincular alumnos a este maestro'}
                        >
                          <UserPlus size={14} className="mr-1.5" />
                          Vincular
                        </button>

                        {/* Botón Expandir */}
                        {maestro.total_asignados > 0 && (
                          <button
                            onClick={() => toggleExpansion(maestro.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lista de Alumnos (expandible) */}
                    {isExpanded && maestro.total_asignados > 0 && (
                      <div className="border-t border-gray-100">
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Alumnos Vinculados ({maestro.total_asignados})
                          </p>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {maestro.alumnos_asignados.map((alumno) => (
                            <div key={alumno.matricula} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">
                                  {getInitials(alumno.nombre_completo)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{alumno.nombre_completo}</p>
                                  <p className="text-xs text-gray-500">{alumno.matricula}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 shrink-0 ml-3">
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getEstatusColor(alumno.estatus)}`}>
                                  {alumno.estatus}
                                </span>
                                <button
                                  onClick={() => handleDesasignar(alumno.matricula, alumno.nombre_completo)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Desvincular alumno"
                                >
                                  <Unlink size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-gray-200 rounded-utcv p-12 text-center">
                <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                  <Users size={32} className="text-gray-400" />
                </div>
                <h4 className="text-md font-semibold text-gray-800">No se encontraron maestros</h4>
                <p className="text-sm text-gray-500 mt-1">Intenta ajustar los filtros de búsqueda.</p>
              </div>
            )}
          </div>

          {/* Sección: Alumnos Sin Asignar */}
          {data.alumnos_sin_asignar.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-utcv overflow-hidden shadow-sm animate-fade-in-premium" style={{animationDelay: '300ms'}}>
              <div className="px-6 py-5 border-b border-gray-200 bg-yellow-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Alumnos Sin Maestro Asignado</h3>
                    <p className="text-xs text-gray-500">{data.total_sin_asignar} alumno{data.total_sin_asignar !== 1 ? 's' : ''} pendiente{data.total_sin_asignar !== 1 ? 's' : ''} de vinculación</p>
                  </div>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar alumno..."
                    value={busquedaAlumno}
                    onChange={(e) => setBusquedaAlumno(e.target.value)}
                    className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary bg-white w-48"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Asignar Maestro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.alumnos_sin_asignar
                      .filter(a => {
                        if (!busquedaAlumno.trim()) return true;
                        const q = busquedaAlumno.toLowerCase();
                        return a.nombre_completo.toLowerCase().includes(q) || a.matricula.toLowerCase().includes(q);
                      })
                      .map((alumno) => (
                        <tr key={alumno.matricula} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xs">
                                {getInitials(alumno.nombre_completo)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-bold text-gray-900">{alumno.nombre_completo}</div>
                                <div className="text-xs text-gray-500">{alumno.matricula}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getEstatusColor(alumno.estatus)}`}>
                              {alumno.estatus}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAsignarIndividual(alumno.matricula, parseInt(e.target.value));
                                  e.target.value = '';
                                }
                              }}
                              className="border border-gray-300 rounded-lg text-xs py-1.5 px-2 bg-white focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary max-w-[200px]"
                            >
                              <option value="">Seleccionar maestro...</option>
                              {data.maestros.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.nombre_completo} ({m.total_asignados})
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-utcv p-12 text-center">
          <AlertTriangle size={32} className="text-gray-400 mx-auto mb-4" />
          <h4 className="text-md font-semibold text-gray-800">Error al cargar los datos</h4>
          <p className="text-sm text-gray-500 mt-1">No se pudieron obtener las asignaciones. Intenta recargar la página.</p>
        </div>
      )}

      {/* Modal de Asignación Masiva */}
      {modalAsignacion && maestroParaAsignar && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-utcv shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Vinculación Masiva</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Selecciona los alumnos a vincular</p>
                </div>
                <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Maestro seleccionado */}
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 shrink-0">
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(maestroParaAsignar.id)}`}>
                  {getInitials(maestroParaAsignar.nombre_completo)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{maestroParaAsignar.nombre_completo}</p>
                  <p className="text-xs text-gray-600">{maestroParaAsignar.area_adscripcion} • {maestroParaAsignar.total_asignados} alumno(s) actuales</p>
                </div>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="px-6 py-3 border-b border-gray-200 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar alumno por nombre o matrícula..."
                  value={busquedaModal}
                  onChange={(e) => setBusquedaModal(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary bg-gray-50"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={seleccionarTodos}
                  className="text-xs text-utcv-primary hover:text-utcv-primary-dark font-semibold"
                >
                  {alumnosSeleccionados.size === alumnosSinAsignarFiltrados.length && alumnosSinAsignarFiltrados.length > 0 
                    ? 'Deseleccionar todos' 
                    : 'Seleccionar todos'
                  }
                </button>
                <span className="text-xs text-gray-500">
                  {alumnosSeleccionados.size} seleccionado{alumnosSeleccionados.size !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Lista de alumnos */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {alumnosSinAsignarFiltrados.length > 0 ? (
                alumnosSinAsignarFiltrados.map((alumno) => {
                  const isSelected = alumnosSeleccionados.has(alumno.matricula);
                  return (
                    <label
                      key={alumno.matricula}
                      className={`flex items-center px-6 py-3 cursor-pointer transition-colors
                        ${isSelected ? 'bg-utcv-primary/5' : 'hover:bg-gray-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAlumnoSeleccion(alumno.matricula)}
                        className="h-4 w-4 rounded border-gray-300 text-utcv-primary focus:ring-utcv-primary shrink-0"
                      />
                      <div className="ml-3 flex items-center space-x-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">
                          {getInitials(alumno.nombre_completo)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{alumno.nombre_completo}</p>
                          <p className="text-xs text-gray-500">{alumno.matricula}</p>
                        </div>
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">
                    {data.total_sin_asignar === 0 
                      ? 'Todos los alumnos ya están asignados.' 
                      : 'No se encontraron alumnos con esa búsqueda.'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-between items-center">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={asignando}
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignacionMasiva}
                disabled={alumnosSeleccionados.size === 0 || asignando}
                className="px-6 py-2.5 bg-utcv-primary text-white text-sm font-bold rounded-lg hover:bg-utcv-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {asignando ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Vinculando...
                  </>
                ) : (
                  <>
                    <Link2 size={16} className="mr-1.5" />
                    Vincular {alumnosSeleccionados.size} Alumno{alumnosSeleccionados.size !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
