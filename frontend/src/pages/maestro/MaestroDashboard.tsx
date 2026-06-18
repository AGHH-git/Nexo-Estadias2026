import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, FileCheck } from 'lucide-react';
import api from '../../services/api';
import { TramiteModal } from '../../components/TramiteModal';

interface AlumnoMaestro {
  nombre_completo: string;
  matricula: string;
  estatus: string;
  fecha_actualizacion: string;
}

interface MaestroStats {
  mis_alumnos: number;
  aprobados: number;
  pendientes: number;
  observaciones: number;
  lista: AlumnoMaestro[];
}

export const MaestroDashboard: React.FC = () => {
  const [stats, setStats] = useState<MaestroStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Revisión
  const [tramiteActivo, setTramiteActivo] = useState<any>(null);
  const [loadingTramite, setLoadingTramite] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [evaluando, setEvaluando] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/maestro/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching maestro stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Desconocida';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const abrirRevision = async (matricula: string) => {
    setLoadingTramite(true);
    setTramiteActivo({ matricula }); // placeholder to open modal
    try {
      const res = await api.get(`/admin/maestro/tramite/${matricula}`);
      setTramiteActivo(res.data);
    } catch (error: any) {
      console.error('Error fetching tramite:', error);
      alert(error.response?.data?.mensaje || 'Error al cargar el trámite del alumno.');
      setTramiteActivo(null);
    } finally {
      setLoadingTramite(false);
    }
  };

  const cerrarRevision = () => {
    setTramiteActivo(null);
    setComentarios('');
  };

  const handleEvaluar = async (nuevoEstatus: 'Aprobado para Firmas' | 'Rechazado Digital') => {
    if (nuevoEstatus === 'Rechazado Digital' && !comentarios.trim()) {
      alert('Debes ingresar observaciones detalladas si vas a rechazar el trámite.');
      return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas marcar el trámite como "${nuevoEstatus}"?`)) {
      return;
    }

    setEvaluando(true);
    try {
      await api.post(`/admin/maestro/evaluar/${tramiteActivo.matricula}`, {
        estatus: nuevoEstatus,
        comentarios: comentarios.trim()
      });
      alert(`Trámite ${nuevoEstatus} correctamente.`);
      cerrarRevision();
      fetchStats();
    } catch (error: any) {
      console.error('Error al evaluar:', error);
      alert(error.response?.data?.mensaje || 'Ocurrió un error al guardar la evaluación.');
    } finally {
      setEvaluando(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Panel del Asesor Académico</h2>
        <p className="mt-1 text-sm text-gray-500 font-medium">Revisa y aprueba el avance de los alumnos asignados a ti.</p>
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
                <p className="text-sm font-medium text-gray-500 truncate">Mis Alumnos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.mis_alumnos || 0}</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <FileCheck size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Documentos Aprobados</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.aprobados || 0}</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <Clock size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Revisiones Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendientes || 0}</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-utcv p-5 flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-utcv-primary-light text-utcv-primary">
                <BookOpen size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">Observaciones Hechas</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.observaciones || 0}</p>
              </div>
            </div>
          </div>

          {/* Lista de Alumnos Asignados */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-utcv overflow-hidden animate-fade-in-premium" style={{animationDelay: '100ms'}}>
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Documentos y Trámites de mis Alumnos</h3>
            </div>
            <div className="p-0">
              {stats?.lista && stats.lista.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actividad</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.lista.map((alumno, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(alumno.fecha_actualizacion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                              ${alumno.estatus === 'Aprobado para Firmas' ? 'bg-green-50 border-green-200 text-green-700' : 
                                alumno.estatus === 'Rechazado Digital' ? 'bg-red-50 border-red-200 text-red-700' :
                                alumno.estatus === 'En Revisión Digital' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                'bg-gray-50 border-gray-200 text-gray-700'
                              }
                            `}>
                              {alumno.estatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => abrirRevision(alumno.matricula)}
                              className="px-4 py-1.5 border border-utcv-primary text-utcv-primary rounded hover:bg-utcv-primary hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                              disabled={alumno.estatus === 'Borrador'}
                            >
                              {alumno.estatus === 'Borrador' ? 'Sin Enviar' : 'Revisar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <BookOpen size={32} className="text-gray-400" />
                  </div>
                  <h4 className="text-md font-semibold text-gray-800">No tienes alumnos asignados</h4>
                  <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Cuando tu Jefe de Carrera te asigne alumnos, aparecerán en esta lista para su revisión.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <TramiteModal 
        tramiteActivo={tramiteActivo}
        loadingTramite={loadingTramite}
        comentarios={comentarios}
        setComentarios={setComentarios}
        evaluando={evaluando}
        handleEvaluar={handleEvaluar}
        cerrarRevision={cerrarRevision}
        soloLectura={false}
      />

    </div>
  );
};
