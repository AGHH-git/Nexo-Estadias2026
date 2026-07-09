import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, AlertTriangle, X, FileSearch } from 'lucide-react';
import api from '../../services/api';
import { TramiteModal } from '../../components/TramiteModal';

interface AlumnoPendiente {
  matricula: string;
  nombre_completo: string;
  carrera: string;
}

interface Maestro {
  id: number;
  nombre_completo: string;
  area_adscripcion: string;
  cargo: string;
}

interface JefeStats {
  total_alumnos: number;
  asignados: number;
  pendientes: number;
  sin_registro: number;
  alumnos_pendientes: AlumnoPendiente[];
  carrera_asignada?: string;
}

interface AlumnoGlobal {
  matricula: string;
  nombre_completo: string;
  carrera: string;
  estatus: string;
  maestro_nombre: string | null;
}

export const JefeDashboard: React.FC = () => {
  const [stats, setStats] = useState<JefeStats | null>(null);
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Asignación
  const [alumnoAsignando, setAlumnoAsignando] = useState<AlumnoPendiente | null>(null);
  const [maestroSeleccionado, setMaestroSeleccionado] = useState('');
  const [asignando, setAsignando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Estados para Lista Global y Modal
  const [alumnos, setAlumnos] = useState<AlumnoGlobal[]>([]);
  const [tramiteActivo, setTramiteActivo] = useState<any>(null);
  const [loadingTramite, setLoadingTramite] = useState(false);

  const fetchData = async () => {
    try {
      const [resStats, resMaestros, resAlumnos] = await Promise.all([
        api.get('/admin/jefe/stats'),
        api.get('/admin/jefe/maestros'),
        api.get('/admin/jefe/alumnos')
      ]);
      setStats(resStats.data);
      setMaestros(resMaestros.data);
      setAlumnos(resAlumnos.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const abrirModalAsignacion = (alumno: AlumnoPendiente) => {
    setAlumnoAsignando(alumno);
    setMaestroSeleccionado('');
    setMensajeExito('');
  };

  const cerrarModal = () => {
    setAlumnoAsignando(null);
  };

  const handleAsignar = async () => {
    if (!alumnoAsignando || !maestroSeleccionado) return;
    setAsignando(true);
    setMensajeExito('');
    try {
      await api.post('/admin/jefe/asignar', {
        matricula: alumnoAsignando.matricula,
        maestro_id: maestroSeleccionado
      });
      setMensajeExito('¡Maestro asignado correctamente!');
      
      // Recargar la tabla
      setTimeout(() => {
        cerrarModal();
        fetchData();
      }, 1500);

    } catch (error: any) {
      console.error('Error al asignar maestro:', error);
      alert(error.response?.data?.mensaje || 'Ocurrió un error al asignar el maestro.');
    } finally {
      setAsignando(false);
    }
  };

  const abrirExpediente = async (matricula: string) => {
    setLoadingTramite(true);
    setTramiteActivo({ matricula });
    try {
      const res = await api.get(`/admin/tramite/${matricula}`);
      setTramiteActivo(res.data);
    } catch (error: any) {
      console.error('Error fetching tramite:', error);
      alert(error.response?.data?.mensaje || 'Error al cargar el expediente o no ha iniciado trámite.');
      setTramiteActivo(null);
    } finally {
      setLoadingTramite(false);
    }
  };

  const cerrarExpediente = () => {
    setTramiteActivo(null);
  };

  return (
    <div className="space-y-6 relative">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Panel de Jefe de Carrera</h2>
        <p className="mt-1 text-sm text-gray-500 font-medium">Asigna y distribuye a los alumnos con los asesores académicos{stats?.carrera_asignada ? ` de ${stats.carrera_asignada}` : ''}.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-premium">
            
            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Total de Alumnos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_alumnos || 0}</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <BookOpen size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Asignados</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.asignados || 0}</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <Clock size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendientes || 0}</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Sin Registro</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.sin_registro || 0}</p>
              </div>
            </div>

          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-utcv overflow-hidden animate-fade-in-premium" style={{animationDelay: '100ms'}}>
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Lista de Alumnos Pendientes de Asignación (Muestra de 10)</h3>
            </div>
            <div className="p-0">
              {stats?.alumnos_pendientes && stats.alumnos_pendientes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carrera</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.alumnos_pendientes.map((alumno) => (
                        <tr key={alumno.matricula} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                {alumno.nombre_completo.substring(0, 2)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-bold text-gray-900">{alumno.nombre_completo}</div>
                                <div className="text-xs text-gray-500">{alumno.matricula}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 truncate max-w-xs" title={alumno.carrera}>{alumno.carrera}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => abrirModalAsignacion(alumno)}
                              className="px-4 py-2 bg-utcv-primary text-white rounded hover:bg-utcv-primary-dark transition-colors font-semibold text-xs"
                            >
                              Asignar Maestro
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Users size={32} className="text-gray-400" />
                  </div>
                  <h4 className="text-md font-semibold text-gray-800">No hay alumnos pendientes</h4>
                  <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Todos los alumnos han sido asignados a un Asesor Académico.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lista Global de Alumnos de la Carrera */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-utcv overflow-hidden animate-fade-in-premium mt-6" style={{animationDelay: '200ms'}}>
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Listado Completo de Alumnos de la Carrera</h3>
            </div>
            <div className="p-0">
              {alumnos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asesor Académico</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expediente</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alumnos.map((alumno) => (
                        <tr key={alumno.matricula} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                {alumno.nombre_completo.substring(0, 2)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-bold text-gray-900">{alumno.nombre_completo}</div>
                                <div className="text-xs text-gray-500">{alumno.matricula}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{alumno.maestro_nombre || <span className="text-gray-400 italic">Sin asignar</span>}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                              ${alumno.estatus === 'Aprobado para Firmas' || alumno.estatus === 'Completado' ? 'bg-green-50 border-green-200 text-green-700' : 
                                alumno.estatus === 'Rechazado Digital' ? 'bg-red-50 border-red-200 text-red-700' :
                                alumno.estatus === 'En Revisión Digital' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                alumno.estatus === 'Borrador' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                'bg-gray-50 border-gray-200 text-gray-500'
                              }
                            `}>
                              {alumno.estatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => abrirExpediente(alumno.matricula)}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-semibold text-xs inline-flex items-center"
                              disabled={alumno.estatus === 'Sin Registro'}
                            >
                              <FileSearch size={14} className="mr-1.5" />
                              Ver Archivos
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">No hay alumnos registrados en esta carrera.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de Asignación */}
      {alumnoAsignando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-utcv shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Asignar Asesor Académico</h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {mensajeExito ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center space-x-3 border border-green-200">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold">{mensajeExito}</p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Alumno Seleccionado</p>
                    <p className="text-sm font-bold text-gray-900">{alumnoAsignando.nombre_completo}</p>
                    <p className="text-xs text-gray-600">{alumnoAsignando.matricula} - {alumnoAsignando.carrera}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Selecciona un Maestro</label>
                    <select
                      value={maestroSeleccionado}
                      onChange={(e) => setMaestroSeleccionado(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-utcv-primary focus:border-utcv-primary text-sm p-2.5 bg-gray-50 border"
                    >
                      <option value="">-- Seleccionar --</option>
                      {maestros.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre_completo} ({m.area_adscripcion})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={cerrarModal}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      disabled={asignando}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAsignar}
                      disabled={!maestroSeleccionado || asignando}
                      className="px-6 py-2 bg-utcv-primary text-white text-sm font-semibold rounded hover:bg-utcv-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {asignando ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Asignando...
                        </>
                      ) : (
                        'Confirmar Asignación'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visor de Expediente (Jefe puede dar visto bueno a documentos) */}
      <TramiteModal
        tramiteActivo={tramiteActivo}
        loadingTramite={loadingTramite}
        comentarios=""
        setComentarios={() => {}}
        evaluando={false}
        handleEvaluar={() => {}}
        cerrarRevision={cerrarExpediente}
        soloLectura={true}
        rolUsuario="JEFE_CARRERA"
        onDocumentoAprobado={(tramiteActualizado) => {
          setTramiteActivo(tramiteActualizado);
        }}
      />

    </div>
  );
};
