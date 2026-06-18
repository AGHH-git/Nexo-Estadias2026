// ARCHIVO: frontend/src/pages/alumno/fases/Fase3Proyecto.tsx
import React, { useState, useEffect } from 'react';

interface Fase3Props {
  formData: any;
  onActualizarDatos: (campos: Partial<any>) => void;
  onSiguiente: () => void;
  onAnterior: () => void;
}

export const Fase3Proyecto: React.FC<Fase3Props> = ({
  formData,
  onActualizarDatos,
  onSiguiente,
  onAnterior,
}) => {
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [conteoPalabras, setConteoPalabras] = useState(0);

  // Calcular conteo de palabras de la problemática en tiempo real
  useEffect(() => {
    const texto = formData.problematica || '';
    const palabras = texto.trim().split(/\s+/).filter((word: string) => word.length > 0);
    setConteoPalabras(palabras.length);
  }, [formData.problematica]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onActualizarDatos({ [name]: value });
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAlcanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value !== 'Otro') {
      onActualizarDatos({ alcance: value, linea_investigacion: '' });
    } else {
      onActualizarDatos({ alcance: value });
    }
    if (errores.alcance) {
      setErrores(prev => ({ ...prev, alcance: '' }));
    }
  };

  const validarCampos = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.nivel_academico) nuevosErrores.nivel_academico = 'El nivel académico es obligatorio.';
    if (!formData.nombre_programa) nuevosErrores.nombre_programa = 'El nombre del programa educativo es obligatorio.';
    
    if (!formData.titulo_proyecto) {
      nuevosErrores.titulo_proyecto = 'El título del proyecto es obligatorio.';
    } else if (formData.titulo_proyecto.length > 200) {
      nuevosErrores.titulo_proyecto = 'El título no puede exceder los 200 caracteres.';
    }

    if (!formData.problematica) {
      nuevosErrores.problematica = 'La problemática a resolver es obligatoria.';
    } else if (conteoPalabras < 25) {
      nuevosErrores.problematica = `La problemática debe tener al menos 25 palabras (actual: ${conteoPalabras}).`;
    }

    if (!formData.alcance) nuevosErrores.alcance = 'El alcance es obligatorio.';



    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSiguiente = () => {
    if (validarCampos()) {
      onSiguiente();
    }
  };

  const limiteCaracteresTitulo = 200;
  const caracteresRestantesTitulo = limiteCaracteresTitulo - (formData.titulo_proyecto?.length || 0);

  return (
    <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-950">Descripción del proyecto de estadía</h3>
        <p className="text-sm text-gray-500 mt-1">
          Proporciona los detalles académicos del proyecto que desarrollarás durante tu estadía profesional.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Nivel Académico (Radio) */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Nivel Académico
          </label>
          <div className="flex space-x-6 mt-2">
            <label className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
              <input
                type="radio"
                name="nivel_academico"
                value="TSU"
                checked={formData.nivel_academico === 'TSU'}
                onChange={handleInputChange}
                className="focus:ring-utcv-primary text-utcv-primary"
              />
              <span>Técnico Superior Universitario (TSU)</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
              <input
                type="radio"
                name="nivel_academico"
                value="Ingeniería"
                checked={formData.nivel_academico === 'Ingeniería'}
                onChange={handleInputChange}
                className="focus:ring-utcv-primary text-utcv-primary"
              />
              <span>Ingeniería / Licenciatura</span>
            </label>
          </div>
          {errores.nivel_academico && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.nivel_academico}</p>}
        </div>

        {/* Nombre del Programa Educativo */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Nombre del Programa Educativo (Carrera)
          </label>
          <input
            type="text"
            name="nombre_programa"
            value={formData.nombre_programa || ''}
            onChange={handleInputChange}
            placeholder="Ej: TSU en Tecnologías de la Información Área Desarrollo de Software Multiplataforma"
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
          />
          {errores.nombre_programa && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.nombre_programa}</p>}
        </div>

        {/* Título del Proyecto */}
        <div className="space-y-1">
          <div className="flex justify-between items-center select-none">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Título del proyecto
            </label>
            <span 
              className={`text-xs font-semibold ${
                caracteresRestantesTitulo < 20 ? 'text-utcv-danger' : 'text-gray-400'
              }`}
            >
              {caracteresRestantesTitulo} caracteres restantes
            </span>
          </div>
          <input
            type="text"
            name="titulo_proyecto"
            maxLength={limiteCaracteresTitulo}
            value={formData.titulo_proyecto || ''}
            onChange={handleInputChange}
            placeholder="Ingresa el nombre oficial de tu proyecto de estadía"
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
          />
          {errores.titulo_proyecto && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.titulo_proyecto}</p>}
        </div>

        {/* Problemática a resolver (min 25 palabras) */}
        <div className="space-y-1">
          <div className="flex justify-between items-center select-none">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Problemática a resolver
            </label>
            <span 
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: conteoPalabras >= 25 ? 'rgba(39, 174, 96, 0.1)' : 'rgba(192, 57, 43, 0.1)',
                color: conteoPalabras >= 25 ? 'var(--color-success)' : 'var(--color-danger)'
              }}
            >
              {conteoPalabras} palabras (mínimo 25)
            </span>
          </div>
          <textarea
            name="problematica"
            rows={5}
            value={formData.problematica || ''}
            onChange={handleInputChange}
            placeholder="Describe detalladamente el problema o área de oportunidad que tu proyecto resolverá en la empresa (mínimo 25 palabras)..."
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
          />
          {errores.problematica && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.problematica}</p>}
        </div>

        {/* Alcance del proyecto */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Alcance del proyecto
          </label>
          <select
            name="alcance"
            value={formData.alcance || ''}
            onChange={handleAlcanceChange}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
          >
            <option value="" disabled>Selecciona una opción...</option>
            <option value="Transferencia Tecnológica">Transferencia Tecnológica</option>
            <option value="Innovación de métodos y procesos">Innovación de métodos y procesos</option>
            <option value="Otro">Otro (Especificar)</option>
          </select>
          {errores.alcance && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.alcance}</p>}
        </div>

        {/* Línea de Investigación (Condicional) */}
        {formData.alcance === 'Otro' && (
          <div className="space-y-1 animate-fade-in">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Especificar Alcance / Línea de Investigación (Opcional)
            </label>
            <input
              type="text"
              name="linea_investigacion"
              value={formData.linea_investigacion || ''}
              onChange={handleInputChange}
              placeholder="Describe el alcance o línea de investigación (opcional)"
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.linea_investigacion && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.linea_investigacion}</p>}
          </div>
        )}



      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-6 border-t border-gray-100 select-none">
        <button
          type="button"
          onClick={onAnterior}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-utcv text-sm font-semibold text-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Anterior</span>
        </button>

        <button
          type="button"
          onClick={handleSiguiente}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-utcv text-sm font-bold text-white transition-colors hover:bg-utcv-primary-dark shadow-sm"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <span>Siguiente</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
