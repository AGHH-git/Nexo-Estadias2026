import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, CheckCircle, FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { TramiteModal } from '../../components/TramiteModal';

interface VinculacionStats {
  alumnos_registrados: number;
  periodo_activo: string;
  tramites_en_proceso: number;
  tramites_completados: number;
}

interface AlumnoGlobal {
  matricula: string;
  nombre_completo: string;
  carrera: string;
  estatus: string;
  maestro_nombre: string | null;
}

export const VinculacionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VinculacionStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [nuevoPeriodo, setNuevoPeriodo] = useState('');
  const [nuevoAnio, setNuevoAnio] = useState(new Date().getFullYear());
  const [creando, setCreando] = useState(false);

  // Estados para Lista Global y Modal
  const [alumnos, setAlumnos] = useState<AlumnoGlobal[]>([]);
  const [tramiteActivo, setTramiteActivo] = useState<any>(null);
  const [loadingTramite, setLoadingTramite] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resStats, resAlumnos] = await Promise.all([
          api.get('/admin/vinculacion/stats'),
          api.get('/admin/vinculacion/alumnos')
        ]);
        setStats(resStats.data);
        setAlumnos(resAlumnos.data);
      } catch (error) {
        console.error('Error fetching vinculacion data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const handleAperturar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    try {
      await api.post('/admin/vinculacion/periodo', {
        nombre: nuevoPeriodo,
        anio: nuevoAnio
      });
      setShowModal(false);
      setNuevoPeriodo('');
      // Recargar stats y alumnos
      const [resStats, resAlumnos] = await Promise.all([
        api.get('/admin/vinculacion/stats'),
        api.get('/admin/vinculacion/alumnos')
      ]);
      setStats(resStats.data);
      setAlumnos(resAlumnos.data);
    } catch (error) {
      console.error('Error aperturando periodo', error);
      alert('Hubo un error al aperturar el periodo.');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Panel de Vinculación</h2>
        <p className="mt-1 text-sm text-gray-500 font-medium">Gestión global de procesos de estadías.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-premium">
            
            {/* Tarjeta 1 */}
            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-utcv-primary-light text-utcv-primary">
                <Calendar size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Periodo Activo</p>
                <p className="text-lg font-bold text-gray-900">{stats?.periodo_activo || 'Ninguno'}</p>
              </div>
            </div>

            {/* Tarjeta 2 */}
            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Alumnos Registrados</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.alumnos_registrados || 0}</p>
              </div>
            </div>

            {/* Tarjeta 3 */}
            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <FileText size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Trámites en Proceso</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.tramites_en_proceso || 0}</p>
              </div>
            </div>

            {/* Tarjeta 4 */}
            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircle size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Trámites Finalizados</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.tramites_completados || 0}</p>
              </div>
            </div>

          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-utcv overflow-hidden animate-fade-in-premium" style={{animationDelay: '100ms'}}>
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Acciones Rápidas</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setShowModal(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-utcv-primary hover:bg-utcv-primary-light transition-colors group"
              >
                <Calendar className="text-gray-400 group-hover:text-utcv-primary mb-3" size={32} />
                <span className="font-semibold text-gray-700 group-hover:text-utcv-primary">Aperturar Nuevo Periodo</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Cierra el periodo actual y abre uno nuevo.</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                <FileText className="text-gray-400 group-hover:text-blue-500 mb-3" size={32} />
                <span className="font-semibold text-gray-700 group-hover:text-blue-600">Generar Reporte Global</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Exporta el avance de todos los alumnos en el periodo actual.</span>
              </button>
              <button 
                onClick={() => navigate('/vinculacion/vacantes')}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
              >
                <Users className="text-gray-400 group-hover:text-orange-500 mb-3" size={32} />
                <span className="font-semibold text-gray-700 group-hover:text-orange-600">Gestionar Vacantes</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Publica y administra vacantes de estadías.</span>
              </button>
            </div>
          </div>

          {/* Lista Global de Alumnos */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-utcv overflow-hidden animate-fade-in-premium mt-6" style={{animationDelay: '200ms'}}>
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Listado Global de Alumnos y Trámites</h3>
            </div>
            <div className="p-0">
              {alumnos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno / Carrera</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asesor Académico</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expediente</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alumnos.map((alumno: AlumnoGlobal) => (
                        <tr key={alumno.matricula} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                {alumno.nombre_completo.substring(0, 2)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-bold text-gray-900">{alumno.nombre_completo}</div>
                                <div className="text-xs text-gray-500">{alumno.matricula} - {alumno.carrera}</div>
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
                <div className="p-8 text-center text-gray-500">No hay alumnos registrados en el sistema.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de Visor de Expediente (Solo Lectura) */}
      <TramiteModal
        tramiteActivo={tramiteActivo}
        loadingTramite={loadingTramite}
        comentarios=""
        setComentarios={() => {}}
        evaluando={false}
        handleEvaluar={() => {}}
        cerrarRevision={cerrarExpediente}
        soloLectura={true}
      />

      {/* Modal de Apertura de Periodo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Aperturar Nuevo Periodo</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAperturar} className="p-6 space-y-4">
              <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm mb-4 border border-orange-100">
                <strong>Atención:</strong> Al aperturar un nuevo periodo, el actual se marcará como inactivo automáticamente.
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Periodo</label>
                <select 
                  required
                  value={nuevoPeriodo}
                  onChange={(e) => setNuevoPeriodo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary"
                >
                  <option value="">Selecciona un periodo</option>
                  <option value="Enero - Abril">Enero - Abril</option>
                  <option value="Mayo - Agosto">Mayo - Agosto</option>
                  <option value="Septiembre - Diciembre">Septiembre - Diciembre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Año</label>
                <input 
                  type="number" 
                  required
                  value={nuevoAnio}
                  onChange={(e) => setNuevoAnio(parseInt(e.target.value))}
                  min={2020}
                  max={2100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary focus:border-utcv-primary"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={creando || !nuevoPeriodo}
                  className="px-4 py-2 bg-utcv-primary text-white rounded-lg font-bold shadow-md hover:bg-utcv-primary-dark transition-colors disabled:opacity-50"
                >
                  {creando ? 'Aperturando...' : 'Confirmar Apertura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
