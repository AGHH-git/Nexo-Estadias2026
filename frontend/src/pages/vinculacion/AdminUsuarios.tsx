import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Upload, Plus, Users, UserX, UserCheck, Shield } from 'lucide-react';

interface Usuario {
  id: number;
  identificador: string;
  nombre_completo: string;
  rol: string;
  activo: boolean;
  creado_en: string;
}

export const AdminUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // --- Estados Carga Masiva ---
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [cargandoExcel, setCargandoExcel] = useState(false);

  // --- Estados Nuevo Usuario ---
  const [nuevoRol, setNuevoRol] = useState('MAESTRO');
  const [nuevoId, setNuevoId] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  
  // Campos extra
  const [areaAdscripcion, setAreaAdscripcion] = useState('');
  const [cargo, setCargo] = useState('Docente');
  const [telefono, setTelefono] = useState('');
  const [carreraJefe, setCarreraJefe] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/usuarios');
      setUsuarios(data);
    } catch (error) {
      setErrorGlobal('Error al cargar la lista de usuarios.');
    } finally {
      setCargando(false);
    }
  };

  const handleCargaMasiva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoExcel) return;

    setCargandoExcel(true);
    setErrorGlobal('');
    setMensajeExito('');

    const formData = new FormData();
    formData.append('file', archivoExcel);

    try {
      const response = await api.post('/admin/usuarios/cargar-alumnos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMensajeExito(`Carga finalizada: ${response.data.resultados.exitosos} alumnos creados o actualizados de ${response.data.resultados.procesados} filas procesadas.`);
      if (response.data.resultados.errores.length > 0) {
        setErrorGlobal(`Hubo ${response.data.resultados.errores.length} errores al procesar. Revisa el archivo.`);
        console.error(response.data.resultados.errores);
      }
      setArchivoExcel(null);
      cargarUsuarios();
    } catch (error: any) {
      setErrorGlobal(error.response?.data?.mensaje || 'Error al procesar el archivo Excel.');
    } finally {
      setCargandoExcel(false);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorGlobal('');
    setMensajeExito('');

    const payload: any = {
      identificador: nuevoId,
      password: nuevoPassword,
      rol: nuevoRol,
      nombre_completo: nuevoNombre
    };

    if (nuevoRol === 'MAESTRO') {
      payload.area_adscripcion = areaAdscripcion;
      payload.cargo = cargo;
      payload.telefono = telefono;
    } else if (nuevoRol === 'JEFE_CARRERA') {
      payload.carrera = carreraJefe;
    }

    try {
      await api.post('/admin/usuarios', payload);
      setMensajeExito(`Usuario ${nuevoRol} creado con éxito.`);
      setNuevoId(''); setNuevoNombre(''); setNuevoPassword(''); setAreaAdscripcion(''); setTelefono(''); setCarreraJefe('');
      cargarUsuarios();
    } catch (error: any) {
      setErrorGlobal(error.response?.data?.mensaje || 'Error al crear el usuario.');
    } finally {
      setCargando(false);
    }
  };

  const toggleEstado = async (id: number) => {
    try {
      await api.put(`/admin/usuarios/${id}/estado`);
      cargarUsuarios();
    } catch (error: any) {
      setErrorGlobal(error.response?.data?.mensaje || 'Error al cambiar estado.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Administración de Usuarios</h2>
        <p className="text-gray-500 text-sm">Gestiona accesos, roles y realiza altas masivas.</p>
      </div>

      {errorGlobal && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 animate-fade-in">
          {errorGlobal}
        </div>
      )}

      {mensajeExito && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 animate-fade-in">
          {mensajeExito}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel Carga Masiva */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Upload className="text-utcv-primary" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Carga Masiva de Alumnos</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Sube un archivo Excel (.xlsx). Columnas necesarias: <b>1. matrícula</b>, <b>2. nombre_completo</b>, <b>3. carrera</b>.
          </p>
          <form onSubmit={handleCargaMasiva} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivo Excel</label>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={(e) => setArchivoExcel(e.target.files ? e.target.files[0] : null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-utcv-primary hover:file:bg-blue-100"
              />
            </div>
            <button 
              type="submit" 
              disabled={!archivoExcel || cargandoExcel}
              className="w-full bg-utcv-primary hover:bg-utcv-primary-dark text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {cargandoExcel ? 'Procesando...' : 'Subir y Procesar'}
            </button>
          </form>
        </div>

        {/* Panel Crear Usuario (Admin) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="text-utcv-primary" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Crear Administrador / Maestro</h3>
          </div>
          <form onSubmit={handleCrearUsuario} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">Rol</label>
                <select 
                  value={nuevoRol} 
                  onChange={(e) => setNuevoRol(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-utcv-primary focus:border-utcv-primary"
                >
                  <option value="MAESTRO">Maestro / Asesor</option>
                  <option value="JEFE_CARRERA">Jefe de Carrera</option>
                  <option value="VINCULACION">Vinculación (Admin)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">Identificador / Correo</label>
                <input 
                  type="text" 
                  required
                  value={nuevoId}
                  onChange={(e) => setNuevoId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-utcv-primary focus:border-utcv-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">Contraseña Temporal</label>
                <input 
                  type="text" 
                  required
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="Obligatoria"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Campos Dinámicos */}
            {nuevoRol === 'MAESTRO' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Área de Adscripción</label>
                  <input type="text" value={areaAdscripcion} onChange={(e) => setAreaAdscripcion(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Teléfono</label>
                  <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            )}

            {nuevoRol === 'JEFE_CARRERA' && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="block text-xs font-semibold text-gray-700 uppercase">Carrera que administra</label>
                <input type="text" value={carreraJefe} onChange={(e) => setCarreraJefe(e.target.value)} placeholder="Ej: Ingeniería en Software" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            )}

            <button 
              type="submit" 
              disabled={cargando}
              className="w-full bg-gray-900 hover:bg-black text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span>Crear Usuario</span>
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
          <Users className="text-gray-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Listado de Usuarios</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Identificador</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.identificador}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.nombre_completo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-md">{u.rol}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.activo ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactivo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => toggleEstado(u.id)}
                      className={`${u.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} transition-colors flex items-center justify-end w-full space-x-1`}
                      title={u.activo ? 'Dar de baja' : 'Reactivar'}
                    >
                      {u.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                      <span>{u.activo ? 'Baja' : 'Activar'}</span>
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && !cargando && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay usuarios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
