import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const VacantesAdmin: React.FC = () => {
  const [vacantes, setVacantes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Formulario
  const [titulo, setTitulo] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [creando, setCreando] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchVacantes = async () => {
    setCargando(true);
    try {
      const res = await api.get('/vacantes');
      setVacantes(res.data);
    } catch (error) {
      console.error('Error al cargar vacantes', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchVacantes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('empresa_nombre', empresaNombre);
    formData.append('descripcion', descripcion);
    if (foto) {
      formData.append('foto', foto);
    }

    try {
      await api.post('/vacantes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Vacante creada exitosamente');
      setShowModal(false);
      setTitulo('');
      setEmpresaNombre('');
      setDescripcion('');
      setFoto(null);
      fetchVacantes();
    } catch (error) {
      console.error('Error creando vacante', error);
      alert('Ocurrió un error al crear la vacante.');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Gestión de Vacantes</h2>
          <p className="mt-1 text-sm text-gray-500 font-medium">Publica vacantes de estadías para los alumnos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-utcv-primary text-white rounded-utcv font-bold shadow-md hover:bg-utcv-primary-dark transition-colors"
        >
          + Agregar Vacante
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
        </div>
      ) : vacantes.length === 0 ? (
        <div className="bg-white rounded-utcv shadow-sm p-10 text-center border border-gray-200">
          <p className="text-gray-500 font-medium">No hay vacantes publicadas aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-premium">
          {vacantes.map((v) => (
            <div key={v.id} className="bg-white rounded-utcv shadow-sm border border-gray-200 overflow-hidden">
              {v.foto_url ? (
                <img src={`http://localhost:3000${v.foto_url}`} alt={v.titulo} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">Sin Imagen</span>
                </div>
              )}
              <div className="p-5 space-y-2">
                <h3 className="font-bold text-lg text-gray-900">{v.titulo}</h3>
                <p className="text-sm text-utcv-primary font-semibold">{v.empresa_nombre}</p>
                <p className="text-sm text-gray-600 line-clamp-3">{v.descripcion}</p>
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 mt-2">
                  Publicado el: {new Date(v.creado_en).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar Vacante */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Nueva Vacante</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título de la Vacante</label>
                <input 
                  type="text" 
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary"
                  placeholder="Ej. Desarrollador Web Junior"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Empresa</label>
                <input 
                  type="text" 
                  required
                  value={empresaNombre}
                  onChange={(e) => setEmpresaNombre(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary"
                  placeholder="Ej. Tech Solutions SA de CV"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea 
                  required
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary"
                  placeholder="Requisitos, actividades, etc."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fotografía / Imagen (Opcional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFoto(e.target.files[0]);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-utcv-primary"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={creando}
                  className="px-4 py-2 bg-utcv-primary text-white rounded-lg font-bold shadow-md hover:bg-utcv-primary-dark transition-colors disabled:opacity-50"
                >
                  {creando ? 'Guardando...' : 'Publicar Vacante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
