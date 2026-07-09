// ARCHIVO: frontend/src/pages/alumno/fases/Fase4Logistica.tsx
import React, { useState, useEffect } from 'react';

interface Fase4Props {
  formData: any;
  archivoIneTutor: File | null;
  setArchivoIneTutor: (file: File | null) => void;
  onActualizarDatos: (campos: Partial<any>) => void;
  onSiguiente: () => void;
  onAnterior: () => void;
}

interface DiaHorario {
  nombre: string;
  activo: boolean;
  entrada: string;
  salida: string;
}

const calcularFechaTermino = (inicioStr: string, horario: DiaHorario[]): string => {
  if (!inicioStr) return '';
  const date = new Date(inicioStr + 'T00:00:00');
  let horasAcumuladas = 0;
  const limiteHoras = 600;
  let iteraciones = 0;
  const maxIteraciones = 1000;

  const diasSemanaMap: Record<number, string> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  };

  const tieneDiasActivos = horario.some(d => d.activo);
  if (!tieneDiasActivos) return '';

  while (horasAcumuladas < limiteHoras && iteraciones < maxIteraciones) {
    iteraciones++;
    const diaSemanaNombre = diasSemanaMap[date.getDay()];
    const configuracionDia = horario.find(d => d.nombre === diaSemanaNombre);
    
    if (configuracionDia && configuracionDia.activo) {
      const [hEntrada, mEntrada] = configuracionDia.entrada.split(':').map(Number);
      const [hSalida, mSalida] = configuracionDia.salida.split(':').map(Number);
      const diffMinutos = (hSalida * 60 + mSalida) - (hEntrada * 60 + mEntrada);
      const horasDia = Math.max(0, diffMinutos / 60);
      horasAcumuladas += horasDia;
    }

    if (horasAcumuladas >= limiteHoras) {
      break;
    }
    date.setDate(date.getDate() + 1);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const Fase4Logistica: React.FC<Fase4Props> = ({
  formData,
  archivoIneTutor,
  setArchivoIneTutor,
  onActualizarDatos,
  onSiguiente,
  onAnterior,
}) => {
  const [horario, setHorario] = useState<DiaHorario[]>([
    { nombre: 'Lunes', activo: true, entrada: '08:00', salida: '16:00' },
    { nombre: 'Martes', activo: true, entrada: '08:00', salida: '16:00' },
    { nombre: 'Miércoles', activo: true, entrada: '08:00', salida: '16:00' },
    { nombre: 'Jueves', activo: true, entrada: '08:00', salida: '16:00' },
    { nombre: 'Viernes', activo: true, entrada: '08:00', salida: '16:00' },
  ]);

  const [modalidad, setModalidad] = useState<'Local' | 'Foránea'>('Local');
  const [errores, setErrores] = useState<Record<string, string>>({});
  
  // Drag & drop states for INE Tutor
  const [dragIneOver, setDragIneOver] = useState(false);
  const [ineError, setIneError] = useState('');
  const fileInputIneRef = React.useRef<HTMLInputElement>(null);

  const validarYEstablecerIne = (file: File) => {
    setIneError('');
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedExts.includes(ext) || !allowedMimeTypes.includes(file.type)) {
      setIneError('El archivo debe ser un PDF o una imagen (JPG, PNG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setIneError('El tamaño del archivo no debe superar los 5MB.');
      return;
    }
    setArchivoIneTutor(file);
    if (errores.ine_tutor) {
      setErrores(prev => {
        const { ine_tutor, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleDragOverIne = (e: React.DragEvent) => {
    e.preventDefault();
    setDragIneOver(true);
  };
  const handleDragLeaveIne = () => setDragIneOver(false);
  const handleDropIne = (e: React.DragEvent) => {
    e.preventDefault();
    setDragIneOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validarYEstablecerIne(e.dataTransfer.files[0]);
    }
  };
  
  // Totales y validaciones
  const [diasSeleccionados, setDiasSeleccionados] = useState(0);
  const [horasSemanales, setHorasSemanales] = useState(0);
  const [errorHorario, setErrorHorario] = useState('');
  const [fechaTerminoMin, setFechaTerminoMin] = useState('');

  // Intentar parsear horario_alumno si ya existe en formato JSON en formData
  useEffect(() => {
    if (formData.horario_alumno) {
      try {
        const parsed = JSON.parse(formData.horario_alumno);
        if (Array.isArray(parsed)) {
          // Filtrar Sábado y Domingo si vinieran de registros antiguos
          const filtrado = parsed.filter((d: any) => d.nombre !== 'Sábado' && d.nombre !== 'Domingo');
          setHorario(filtrado);
        }
      } catch (e) {
        // Si no es un JSON, ignoramos y usamos los defaults
      }
    }

    if (formData.modalidad_estadia) {
      setModalidad(formData.modalidad_estadia);
    }
  }, []);

  // Calcular horas semanales y validar horario cada vez que cambie
  useEffect(() => {
    let diasCount = 0;
    let horasSum = 0;
    let algunTurnoInvalido = false; // Turno menor a 8 horas

    horario.forEach((dia) => {
      if (dia.activo) {
        diasCount++;
        const [hEntrada, mEntrada] = dia.entrada.split(':').map(Number);
        const [hSalida, mSalida] = dia.salida.split(':').map(Number);
        
        // Calcular diferencia en minutos
        const totalMinutos = (hSalida * 60 + mSalida) - (hEntrada * 60 + mEntrada);
        const totalHoras = totalMinutos / 60;
        
        if (totalHoras > 0) {
          horasSum += totalHoras;
        }

        if (totalHoras < 8) {
          algunTurnoInvalido = true;
        }
      }
    });

    setDiasSeleccionados(diasCount);
    setHorasSemanales(horasSum);

    // Validación institucional: Mínimo 5 días a la semana y 8 horas diarias por día activo
    if (diasCount < 5 || algunTurnoInvalido) {
      setErrorHorario('El horario no cumple el mínimo institucional: 5 días por semana con turnos de 8 horas diarias.');
    } else {
      setErrorHorario('');
    }

    // Serializar el horario a string y guardarlo en formData
    onActualizarDatos({
      horario_alumno: JSON.stringify(horario),
      modalidad_estadia: modalidad,
    });
  }, [horario, modalidad]);

  // Auto-calcular fecha de término basada en la fecha de inicio y el horario para completar exactamente 600 horas
  useEffect(() => {
    if (formData.fecha_inicio && !errorHorario) {
      const calculada = calcularFechaTermino(formData.fecha_inicio, horario);
      setFechaTerminoMin(calculada);
      
      // Si la fecha de término actual no coincide con la calculada, actualizarla automáticamente
      if (formData.fecha_termino !== calculada) {
        onActualizarDatos({ fecha_termino: calculada });
      }
    } else {
      setFechaTerminoMin('');
    }
  }, [formData.fecha_inicio, horario, errorHorario]);

  const handleCheckboxChange = (index: number) => {
    const nuevo = [...horario];
    nuevo[index].activo = !nuevo[index].activo;
    setHorario(nuevo);
  };

  const handleTimeChange = (index: number, campo: 'entrada' | 'salida', valor: string) => {
    const nuevo = [...horario];
    nuevo[index][campo] = valor;
    setHorario(nuevo);
  };

  const calcularHorasDia = (dia: DiaHorario): number => {
    if (!dia.activo) return 0;
    const [hEntrada, mEntrada] = dia.entrada.split(':').map(Number);
    const [hSalida, mSalida] = dia.salida.split(':').map(Number);
    const diff = (hSalida * 60 + mSalida) - (hEntrada * 60 + mEntrada);
    return Math.max(0, diff / 60);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onActualizarDatos({ [name]: value });
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (!formData.fecha_inicio) {
      nuevosErrores.fecha_inicio = 'La fecha de inicio es obligatoria.';
    }
    
    if (!formData.fecha_termino) {
      nuevosErrores.fecha_termino = 'La fecha de término es obligatoria.';
    }

    if (formData.fecha_inicio && formData.fecha_termino) {
      const fInicio = new Date(formData.fecha_inicio + 'T00:00:00');

      if (formData.periodo_nombre && formData.periodo_anio) {
        const pNombre = formData.periodo_nombre.toLowerCase();
        let mInicio = 0; let mFin = 11;
        if (pNombre.includes('enero') && pNombre.includes('abril')) { mInicio = 0; mFin = 3; }
        else if (pNombre.includes('mayo') && pNombre.includes('agosto')) { mInicio = 4; mFin = 7; }
        else if (pNombre.includes('septiembre') && pNombre.includes('diciembre')) { mInicio = 8; mFin = 11; }
        
        const fYear = fInicio.getFullYear();
        const fMonth = fInicio.getMonth();
        
        if (fYear !== Number(formData.periodo_anio) || fMonth < mInicio || fMonth > mFin) {
          nuevosErrores.fecha_inicio = `La fecha debe estar dentro del periodo ${formData.periodo_nombre} de ${formData.periodo_anio}.`;
        }
      }

      if (!errorHorario) {
        const calculada = calcularFechaTermino(formData.fecha_inicio, horario);
        if (calculada && formData.fecha_termino !== calculada) {
          const fCalculadaFormat = new Date(calculada + 'T00:00:00').toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          nuevosErrores.fecha_termino = `Para cumplir exactamente con 600 horas según tu horario, la fecha de término debe ser el ${fCalculadaFormat}.`;
        }
      }
    }

    if (modalidad === 'Foránea' && !archivoIneTutor && !formData.ruta_ine_tutor) {
      nuevosErrores.ine_tutor = 'Es obligatorio subir la copia del INE del tutor para la modalidad foránea.';
    }

    if (!formData.eval_parcial) nuevosErrores.eval_parcial = 'Obligatorio.';
    if (!formData.eval_final) nuevosErrores.eval_final = 'Obligatorio.';
    if (!formData.seguimiento_alumno) nuevosErrores.seguimiento_alumno = 'Obligatorio.';
    if (!formData.seguimiento_dias) nuevosErrores.seguimiento_dias = 'Obligatorio.';
    if (!formData.contacto_asesor) nuevosErrores.contacto_asesor = 'Obligatorio.';
    if (!formData.contacto_dias) nuevosErrores.contacto_dias = 'Obligatorio.';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSiguiente = () => {
    if (validarFormulario() && !errorHorario) {
      onSiguiente();
    }
  };

  return (
    <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-950">Logística de la estadía</h3>
        <p className="text-sm text-gray-500 mt-1">
          Define tu horario laboral y las fechas estimadas para el desarrollo del proyecto de estadía.
        </p>
      </div>

      {/* Sección Horario */}
      <div className="space-y-4">
        <h4 className="font-bold text-sm text-gray-950 uppercase tracking-wider border-l-4 border-utcv-primary pl-2">
          Horario Laboral del Alumno
        </h4>
        
        {/* Filas del horario */}
        <div className="border border-utcv-border rounded-utcv divide-y divide-gray-150 overflow-hidden bg-gray-50/50">
          {horario.map((dia, index) => {
            const horasDia = calcularHorasDia(dia);
            
            return (
              <div key={dia.nombre} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white transition-colors hover:bg-gray-50">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <input
                    type="checkbox"
                    checked={dia.activo}
                    onChange={() => handleCheckboxChange(index)}
                    className="h-4.5 w-4.5 rounded text-utcv-primary focus:ring-utcv-primary"
                  />
                  <span className={`text-sm font-semibold select-none ${dia.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                    {dia.nombre}
                  </span>
                </div>

                {dia.activo ? (
                  <div className="flex items-center space-x-3 justify-end flex-wrap sm:flex-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Entrada:</span>
                      <input
                        type="time"
                        value={dia.entrada}
                        onChange={(e) => handleTimeChange(index, 'entrada', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary"
                      />
                    </div>
                    <div className="flex items-center space-x-1.5 mt-2 sm:mt-0">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Salida:</span>
                      <input
                        type="time"
                        value={dia.salida}
                        onChange={(e) => handleTimeChange(index, 'salida', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary"
                      />
                    </div>
                    <span 
                      className={`text-xs font-bold px-2 py-1 rounded mt-2 sm:mt-0 select-none ${
                        horasDia < 8 ? 'bg-red-50 text-utcv-danger' : 'bg-green-50 text-utcv-success'
                      }`}
                    >
                      {horasDia} hrs
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic select-none">No trabaja este día</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumen automático en tiempo real */}
        <div 
          className="p-4 rounded-utcv border flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0"
          style={{ backgroundColor: 'var(--color-accent-light)', borderColor: 'var(--color-accent)' }}
        >
          <div className="text-sm text-gray-800">
            <p className="font-semibold">Resumen de Horario:</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Días laborales seleccionados: <span className="font-bold text-gray-900">{diasSeleccionados}</span> | Total horas semanales: <span className="font-bold text-gray-900">{horasSemanales} hrs</span>
            </p>
          </div>
          
          {errorHorario && (
            <div className="text-xs font-bold text-utcv-danger flex items-center space-x-1.5 animate-pulse">
              <span>{errorHorario}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fechas de inicio y término */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-bold text-sm text-gray-950 uppercase tracking-wider border-l-4 border-utcv-primary pl-2">
          Fechas del Período
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Fecha de inicio de estadía
            </label>
            <input
              type="date"
              name="fecha_inicio"
              value={formData.fecha_inicio || ''}
              onChange={handleDateChange}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.fecha_inicio && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.fecha_inicio}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Fecha de término de estadía
            </label>
            <input
              type="date"
              name="fecha_termino"
              min={fechaTerminoMin}
              max={fechaTerminoMin}
              value={formData.fecha_termino || ''}
              onChange={handleDateChange}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.fecha_termino && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.fecha_termino}</p>}
            {fechaTerminoMin && (
              <p className="text-[10px] text-utcv-primary font-bold mt-1">
                Calculada para 600 hrs: {new Date(fechaTerminoMin + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modalidad de estadía */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-bold text-sm text-gray-950 uppercase tracking-wider border-l-4 border-utcv-primary pl-2">
          Modalidad de la Estadía
        </h4>

        <div className="flex space-x-6 mt-2 select-none">
          <label className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
            <input
              type="radio"
              name="modalidad_estadia"
              value="Local"
              checked={modalidad === 'Local'}
              onChange={() => {
                setModalidad('Local');
                setArchivoIneTutor(null);
              }}
              className="focus:ring-utcv-primary text-utcv-primary"
            />
            <span>Local (Estado de Veracruz)</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
            <input
              type="radio"
              name="modalidad_estadia"
              value="Foránea"
              checked={modalidad === 'Foránea'}
              onChange={() => setModalidad('Foránea')}
              className="focus:ring-utcv-primary text-utcv-primary"
            />
            <span>Foránea (Otros Estados de la República)</span>
          </label>
        </div>

        {modalidad === 'Foránea' && (
          <div className="space-y-4 animate-fade-in mt-3">
            {/* Advertencia para Estadía Foránea */}
            <div 
              className="p-4 rounded-utcv border text-sm flex items-start space-x-2.5"
              style={{ 
                backgroundColor: 'rgba(230, 126, 34, 0.05)', 
                borderColor: 'rgba(230, 126, 34, 0.2)',
                color: 'var(--color-warning)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-utcv-warning shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-bold text-orange-800">Advertencia para Estadía Foránea:</p>
                <p className="text-orange-700 text-xs mt-0.5 font-medium">
                  Recuerda que necesitarás el INE de tu tutor y su firma de autorización por escrito.
                </p>
              </div>
            </div>

            {/* Espacio para copia de INE de Tutor */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider select-none">
                Copia del INE del Tutor (Obligatorio, PDF o Imagen, Máx. 5MB)
              </label>
              
              <div
                onDragOver={handleDragOverIne}
                onDragLeave={handleDragLeaveIne}
                onDrop={handleDropIne}
                onClick={() => fileInputIneRef.current?.click()}
                className={`border-2 border-dashed rounded-utcv p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragIneOver ? 'bg-utcv-primary-light border-utcv-primary' : 'bg-gray-50 border-gray-300 hover:bg-gray-100/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputIneRef}
                  onChange={(e) => e.target.files?.[0] && validarYEstablecerIne(e.target.files[0])}
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                />
                
                {archivoIneTutor ? (
                  <div className="flex flex-col items-center space-y-2" onClick={(e) => e.stopPropagation()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-utcv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-800">{archivoIneTutor.name}</span>
                    <span className="text-xs text-gray-400 font-medium">({(archivoIneTutor.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => setArchivoIneTutor(null)}
                      className="px-2 py-1 text-xs bg-red-50 text-utcv-danger font-bold hover:bg-red-100 transition-colors rounded"
                    >
                      Eliminar archivo
                    </button>
                  </div>
                ) : formData.ruta_ine_tutor ? (
                  <div className="flex flex-col items-center space-y-2" onClick={(e) => e.stopPropagation()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-bold text-gray-800">INE de Tutor ya cargado anteriormente</span>
                    <a
                      href={`http://localhost:3000/storage/${formData.ruta_ine_tutor}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-utcv-primary font-bold hover:underline"
                    >
                      Ver archivo actual
                    </a>
                    <span className="text-xs text-gray-400 mt-1 select-none">
                      (Para cambiarlo, arrastra un nuevo archivo aquí o haz clic)
                    </span>
                  </div>
                ) : (
                  <div className="text-center space-y-1 text-gray-500 select-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 block mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16a3 3 0 01-2-3V3.5A1.5 1.5 0 012.5 2h15A1.5 1.5 0 0119 3.5V13a3 3 0 01-2 3M1 10h18M5 14h4" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-700">Arrastra la copia del INE aquí o haz clic para buscar</p>
                    <p className="text-xs">Formatos permitidos: PDF, JPG, PNG. Máx. 5MB</p>
                  </div>
                )}
              </div>

              {ineError && <p className="text-xs text-utcv-danger font-medium mt-1">{ineError}</p>}
              {errores.ine_tutor && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.ine_tutor}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Evaluación y Seguimiento */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-bold text-sm text-gray-950 uppercase tracking-wider border-l-4 border-utcv-primary pl-2">
          Evaluación y Seguimiento
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha de Evaluación Parcial</label>
            <input type="date" name="eval_parcial" value={formData.eval_parcial || ''} onChange={handleDateChange} className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none" />
            {errores.eval_parcial && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.eval_parcial}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha de Evaluación Final</label>
            <input type="date" name="eval_final" value={formData.eval_final || ''} onChange={handleDateChange} className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none" />
            {errores.eval_final && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.eval_final}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Forma de seguimiento (Alumno)</label>
            <select name="seguimiento_alumno" value={formData.seguimiento_alumno || ''} onChange={handleDateChange as any} className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none">
              <option value="">Selecciona...</option>
              <option value="presencial">Presencial</option>
              <option value="distancia">A distancia</option>
            </select>
            {errores.seguimiento_alumno && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.seguimiento_alumno}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Días y Horarios (Alumno)</label>
            <input type="text" name="seguimiento_dias" placeholder="Ej: Lunes y Miércoles de 16:00 a 18:00 hrs" value={formData.seguimiento_dias || ''} onChange={handleDateChange} className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none" />
            {errores.seguimiento_dias && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.seguimiento_dias}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Forma de comunicación (Asesor Industrial)</label>
            <select name="contacto_asesor" value={formData.contacto_asesor || ''} onChange={handleDateChange as any} className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none">
              <option value="">Selecciona...</option>
              <option value="presencial">Presencial</option>
              <option value="distancia">A distancia</option>
            </select>
            {errores.contacto_asesor && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.contacto_asesor}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Días y Horarios (Asesor Industrial)</label>
            <input type="text" name="contacto_dias" placeholder="Ej: Viernes 10:00 a 11:00 hrs" value={formData.contacto_dias || ''} onChange={handleDateChange} className="block w-full px-3 py-2.5 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none" />
            {errores.contacto_dias && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.contacto_dias}</p>}
          </div>
        </div>
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
          disabled={!!errorHorario}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-utcv text-sm font-bold text-white transition-all shadow-sm focus:outline-none"
          style={{ 
            backgroundColor: errorHorario ? '#d6cbd0' : 'var(--color-primary)',
            cursor: errorHorario ? 'not-allowed' : 'pointer'
          }}
          onMouseOver={(e) => {
            if (!errorHorario) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }
          }}
          onMouseOut={(e) => {
            if (!errorHorario) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }
          }}
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
