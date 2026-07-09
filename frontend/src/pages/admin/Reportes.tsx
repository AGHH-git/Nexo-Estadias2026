import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Filter, 
  RefreshCw, 
  FileSearch
} from 'lucide-react';
import api from '../../services/api';
import { TramiteModal } from '../../components/TramiteModal';

interface AlumnoReporte {
  matricula: string;
  alumno_nombre: string;
  carrera_nombre: string;
  campus_nombre: string;
  sistema_nombre: string;
  alumno_telefono: string | null;
  alumno_nss: string | null;
  estatus: string;
  maestro_nombre: string | null;
  empresa_nombre: string | null;
  modalidad_estadia: string | null;
  titulo_proyecto: string | null;
  asesor_ind_nombre: string | null;
  periodo_nombre: string | null;
}

interface ReporteStats {
  total: number;
  borrador: number;
  revision: number;
  rechazado: number;
  aprobado_firmas: number;
  completado: number;
  sin_registro: number;
}

interface Carrera {
  id: number;
  nombre: string;
  nivel_academico: string;
}

interface Periodo {
  id: number;
  nombre: string;
  anio: number;
  activo: boolean;
}

export const Reportes: React.FC = () => {
  const rol = localStorage.getItem('utcv_rol') || '';
  
  // Filtros
  const [carreraId, setCarreraId] = useState<string>('');
  const [estatus, setEstatus] = useState<string>('');
  const [periodoId, setPeriodoId] = useState<string>('');
  
  // Listados para filtros
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  
  // Datos y Stats
  const [alumnos, setAlumnos] = useState<AlumnoReporte[]>([]);
  const [stats, setStats] = useState<ReporteStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  // Detalle del expediente (TramiteModal)
  const [tramiteActivo, setTramiteActivo] = useState<any>(null);
  const [loadingTramite, setLoadingTramite] = useState(false);

  const [categorias, setCategorias] = useState<string[]>([]);
  
  // Cargar categorías de estatus
  const cargarCategorias = async () => {
    try {
      const res = await api.get('/admin/reportes/categorias');
      setCategorias(res.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  // Cargar catálogos iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [resPeriodos, resCarreras] = await Promise.all([
          api.get('/admin/reportes/periodos'),
          rol === 'VINCULACION' ? api.get('/admin/reportes/carreras') : Promise.resolve({ data: [] })
        ]);
        
        cargarCategorias();
        
        setPeriodos(resPeriodos.data);
        
        // Seleccionar periodo activo por defecto si existe
        const activo = resPeriodos.data.find((p: Periodo) => p.activo);
        if (activo) {
          setPeriodoId(activo.id.toString());
        } else if (resPeriodos.data.length > 0) {
          setPeriodoId(resPeriodos.data[0].id.toString());
        }

        if (rol === 'VINCULACION') {
          setCarreras(resCarreras.data);
        }
      } catch (error) {
        console.error('Error al cargar catálogos:', error);
      }
    };
    cargarCatalogos();
  }, [rol]);

  // Cargar datos del reporte cuando cambian los filtros
  const fetchReporteData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (carreraId) params.carrera_id = carreraId;
      if (estatus) params.estatus = estatus;
      if (periodoId) params.periodo_id = periodoId;

      const res = await api.get('/admin/reportes/stats', { params });
      setAlumnos(res.data.alumnos);
      setStats(res.data.stats);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo recargar si ya tenemos cargados los periodos (o si no hay)
    if (periodos.length > 0 || loading) {
      fetchReporteData();
    }
  }, [carreraId, estatus, periodoId]);

  const handleDescargarExcel = async () => {
    setDownloading(true);
    try {
      const params: any = {};
      if (carreraId) params.carrera_id = carreraId;
      if (estatus) params.estatus = estatus;
      if (periodoId) params.periodo_id = periodoId;

      const response = await api.get('/admin/reportes/excel', {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener nombre del periodo seleccionado
      const periodoSel = periodos.find(p => p.id.toString() === periodoId);
      const sufijoPeriodo = periodoSel ? `${periodoSel.nombre.replace(/ /g, '_')}_${periodoSel.anio}` : 'global';
      
      link.setAttribute('download', `reporte_estadias_${sufijoPeriodo}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al descargar excel:', error);
      alert('Error al descargar el reporte de Excel.');
    } finally {
      setDownloading(false);
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
      alert(error.response?.data?.mensaje || 'Error al cargar el expediente.');
      setTramiteActivo(null);
    } finally {
      setLoadingTramite(false);
    }
  };

  const cerrarExpediente = () => {
    setTramiteActivo(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reportería e Indicadores</h2>
          <p className="mt-1 text-sm text-gray-500 font-medium">Exporta informes en formato Excel y analiza las estadísticas del periodo.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={fetchReporteData}
            className="p-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm inline-flex items-center"
            title="Refrescar datos"
          >
            <RefreshCw size={18} className={`${loading && 'animate-spin'}`} />
          </button>
          <button
            onClick={handleDescargarExcel}
            disabled={downloading || alumnos.length === 0}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <FileSpreadsheet size={18} />
            {downloading ? 'Generando Excel...' : 'Exportar a Excel'}
          </button>
        </div>
      </div>

      {/* Controles de Filtros */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-utcv p-6 animate-fade-in-premium">
        <div className="flex items-center gap-2 text-utcv-primary font-bold mb-4 border-b border-gray-100 pb-2">
          <Filter size={18} />
          <span>Filtros del Reporte</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Periodo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Periodo Escolar</label>
            <select
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-utcv-primary focus:border-utcv-primary text-sm p-2.5 bg-gray-50 border"
            >
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.anio} {p.activo && '(Activo)'}
                </option>
              ))}
            </select>
          </div>

          {/* Carrera (Solo para Vinculación) */}
          {rol === 'VINCULACION' ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Carrera</label>
              <select
                value={carreraId}
                onChange={(e) => setCarreraId(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-utcv-primary focus:border-utcv-primary text-sm p-2.5 bg-gray-50 border"
              >
                <option value="">-- Todas las Carreras --</option>
                {carreras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Carrera</label>
              <div className="w-full border border-gray-200 bg-gray-100 rounded-lg text-sm p-2.5 font-semibold text-gray-600">
                Filtro bloqueado a tu carrera asignada
              </div>
            </div>
          )}

          {/* Estatus del Trámite */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Estatus del Trámite</label>
            <select
              value={estatus}
              onChange={(e) => setEstatus(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-utcv-primary focus:border-utcv-primary text-sm p-2.5 bg-gray-50 border"
            >
              <option value="">-- Todos los Estatus --</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Resumen Rápido (Stats) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 animate-fade-in-premium">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
            <p className="text-[10px] uppercase font-bold text-gray-500 mt-1">Total Alumnos</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <p className="text-2xl font-black text-gray-400">{stats.sin_registro}</p>
            <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 text-gray-400">Sin Trámite</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <p className="text-2xl font-black text-blue-600">{stats.borrador}</p>
            <p className="text-[10px] uppercase font-bold text-blue-500 mt-1">Borrador</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <p className="text-2xl font-black text-orange-600">{stats.revision}</p>
            <p className="text-[10px] uppercase font-bold text-orange-500 mt-1">En Revisión</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <p className="text-2xl font-black text-red-600">{stats.rechazado}</p>
            <p className="text-[10px] uppercase font-bold text-red-500 mt-1">Rechazado</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <p className="text-2xl font-black text-indigo-600">{stats.aprobado_firmas}</p>
            <p className="text-[10px] uppercase font-bold text-indigo-500 mt-1">Para Firmas</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <p className="text-2xl font-black text-green-600">{stats.completado}</p>
            <p className="text-[10px] uppercase font-bold text-green-500 mt-1">Completados</p>
          </div>
        </div>
      )}

      {/* Listado / Tabla */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-utcv overflow-hidden animate-fade-in-premium">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Listado Filtrado ({alumnos.length} registros)</h3>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
            </div>
          ) : alumnos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Alumno / Matrícula</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Carrera</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asesor Académico</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Empresa</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estatus</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Expediente</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alumnos.map((a) => (
                    <tr key={a.matricula} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{a.alumno_nombre}</div>
                        <div className="text-xs text-gray-500">{a.matricula}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-800 max-w-xs truncate" title={a.carrera_nombre}>
                          {a.carrera_nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {a.maestro_nombre || <span className="text-gray-400 italic">No asignado</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-900 max-w-[200px] truncate" title={a.empresa_nombre || ''}>
                          {a.empresa_nombre || <span className="text-gray-400 italic">No registrada</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full border
                          ${a.estatus === 'Aprobado para Firmas' || a.estatus === 'Completado' ? 'bg-green-50 border-green-200 text-green-700' : 
                            a.estatus === 'Rechazado Digital' ? 'bg-red-50 border-red-200 text-red-700' :
                            a.estatus === 'En Revisión Digital' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                            a.estatus === 'Borrador' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            'bg-gray-50 border-gray-200 text-gray-500'
                          }
                        `}>
                          {a.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => abrirExpediente(a.matricula)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-semibold text-xs inline-flex items-center"
                          disabled={a.estatus === 'Sin Registro'}
                        >
                          <FileSearch size={14} className="mr-1.5" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No se encontraron alumnos con los filtros seleccionados.</div>
          )}
        </div>
      </div>

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
    </div>
  );
};
