// ARCHIVO: frontend/src/components/Stepper.tsx
import React from 'react';

interface StepperProps {
  pasoActivo: number; // 1 a 5
}

export const Stepper: React.FC<StepperProps> = ({ pasoActivo }) => {
  const pasos = [
    { id: 1, etiqueta: 'Datos Institucionales' },
    { id: 2, etiqueta: 'Empresa Receptora' },
    { id: 3, etiqueta: 'Proyecto de Estadía' },
    { id: 4, etiqueta: 'Logística y Horario' },
    { id: 5, etiqueta: 'Documentos y Envío' },
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {pasos.map((paso, index) => {
          const esCompletado = paso.id < pasoActivo;
          const esActivo = paso.id === pasoActivo;

          return (
            <React.Fragment key={paso.id}>
              {/* Círculo del Paso */}
              <div className="flex flex-col items-center flex-1 relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 z-10 ${
                    esCompletado
                      ? 'text-white'
                      : esActivo
                      ? 'text-utcv-primary-dark font-bold animate-pulse-custom'
                      : 'text-gray-400 border border-utcv-border bg-white'
                  }`}
                  style={{
                    backgroundColor: esCompletado
                      ? 'var(--color-primary)'
                      : esActivo
                      ? 'var(--color-accent)'
                      : 'var(--color-white)',
                    borderColor: esCompletado
                      ? 'var(--color-primary)'
                      : esActivo
                      ? 'var(--color-accent-dark)'
                      : 'var(--color-border)',
                  }}
                >
                  {esCompletado ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{paso.id}</span>
                  )}
                </div>

                {/* Etiqueta del Paso */}
                <div className="mt-3 text-center px-1">
                  <span
                    className={`block text-[10px] sm:text-xs font-medium uppercase tracking-wider select-none ${
                      esActivo
                        ? 'text-utcv-primary font-bold'
                        : esCompletado
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {paso.etiqueta}
                  </span>
                </div>
              </div>

              {/* Línea conectora entre círculos */}
              {index < pasos.length - 1 && (
                <div className="flex-1 h-[2px] -mt-10 mx-[-15px] sm:mx-[-30px] z-0">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      backgroundColor: esCompletado
                        ? 'var(--color-primary)'
                        : 'var(--color-border)',
                    }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
