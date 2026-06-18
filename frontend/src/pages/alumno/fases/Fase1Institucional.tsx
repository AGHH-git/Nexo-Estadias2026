// ARCHIVO: frontend/src/pages/alumno/fases/Fase1Institucional.tsx
import React from 'react';
import { Alumno } from '../../../types';

interface Fase1Props {
  alumno: Alumno | null;
  onSiguiente: () => void;
}

export const Fase1Institucional: React.FC<Fase1Props> = ({ alumno, onSiguiente }) => {
  if (!alumno) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-utcv-primary border-t-transparent rounded-full animate-spin-custom"></div>
      </div>
    );
  }

  const camposBloqueados = [
    { label: 'Nombre Completo', valor: alumno.nombre_completo },
    { label: 'Matrícula', valor: alumno.matricula },
    { label: 'Carrera / Programa Educativo', valor: alumno.carrera },
    { label: 'Campus', valor: alumno.campus },
    { label: 'Modalidad / Sistema', valor: alumno.sistema },
    { label: 'Asesor Académico Asignado', valor: alumno.asesor_academico || 'Asesor Asignado por Carrera' },
  ];

  return (
    <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-950">Tus datos institucionales</h3>
        <p className="text-sm text-gray-500 mt-1">
          Esta información fue cargada desde el padrón oficial y no puede modificarse.
        </p>
      </div>

      {/* Grid de dos columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {camposBloqueados.map((campo, idx) => (
          <div key={idx} className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider select-none">
              {campo.label}
            </label>
            <div 
              className="relative flex items-center border rounded-utcv px-3 py-3"
              style={{ 
                backgroundColor: 'var(--color-primary-light)', 
                borderColor: 'var(--color-border)' 
              }}
            >
              {/* Contenido */}
              <span className="text-sm font-medium text-gray-800 pr-8 truncate">
                {campo.valor}
              </span>
              
              {/* Candado e indicador de solo lectura */}
              <div className="absolute right-3 flex items-center space-x-1 text-gray-400 select-none">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Solo lectura</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onSiguiente}
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
