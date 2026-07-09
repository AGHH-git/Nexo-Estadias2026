// ARCHIVO: frontend/src/pages/alumno/fases/Fase2Empresa.tsx
import React, { useState } from 'react';

interface Fase2Props {
  formData: any;
  onActualizarDatos: (campos: Partial<any>) => void;
  onSiguiente: () => void;
  onAnterior: () => void;
}

export const Fase2Empresa: React.FC<Fase2Props> = ({
  formData,
  onActualizarDatos,
  onSiguiente,
  onAnterior,
}) => {
  // Errores locales de validación
  const [errores, setErrores] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onActualizarDatos({ [name]: value });
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarCampos = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.razon_social) nuevosErrores.razon_social = 'La razón social es obligatoria.';
    if (!formData.nombre_comercial) nuevosErrores.nombre_comercial = 'El nombre comercial es obligatorio.';
    
    if (!formData.rfc) {
      nuevosErrores.rfc = 'El RFC es obligatorio.';
    } else if (formData.rfc.length > 15) {
      nuevosErrores.rfc = 'El RFC no debe exceder los 15 caracteres.';
    }
    
    if (!formData.giro) nuevosErrores.giro = 'El giro es obligatorio.';
    if (!formData.tamano) nuevosErrores.tamano = 'El tamaño es obligatorio.';
    if (!formData.tipo_empresa) nuevosErrores.tipo_empresa = 'El tipo de empresa es obligatorio.';
    if (!formData.estado) nuevosErrores.estado = 'El estado es obligatorio.';
    if (!formData.municipio) nuevosErrores.municipio = 'El municipio es obligatorio.';
    
    if (!formData.cp) {
      nuevosErrores.cp = 'El código postal es obligatorio.';
    } else if (!/^\d{5}$/.test(formData.cp)) {
      nuevosErrores.cp = 'El código postal debe tener 5 dígitos numéricos.';
    }
    
    if (!formData.domicilio) nuevosErrores.domicilio = 'El domicilio completo es obligatorio.';
    
    if (!formData.telefono_empresa) {
      nuevosErrores.telefono_empresa = 'El teléfono de la empresa es obligatorio.';
    } else if (!/^\d{10}$/.test(formData.telefono_empresa.trim())) {
      nuevosErrores.telefono_empresa = 'El teléfono de la empresa debe constar de exactamente 10 dígitos numéricos.';
    }

    // Asesor Industrial
    if (!formData.asesor_ind_nombre) nuevosErrores.asesor_ind_nombre = 'El nombre del asesor es obligatorio.';
    if (!formData.asesor_ind_cargo) nuevosErrores.asesor_ind_cargo = 'El cargo del asesor es obligatorio.';
    
    if (!formData.asesor_ind_email) {
      nuevosErrores.asesor_ind_email = 'El correo electrónico es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.asesor_ind_email)) {
      nuevosErrores.asesor_ind_email = 'El formato de correo no es válido.';
    }

    if (!formData.asesor_ind_telefono) {
      nuevosErrores.asesor_ind_telefono = 'El teléfono del asesor es obligatorio.';
    } else if (!/^\d{10}(\s*(ext\.?|extension)?\s*\d+)?$/i.test(formData.asesor_ind_telefono.trim())) {
      nuevosErrores.asesor_ind_telefono = 'El teléfono debe ser de 10 dígitos, con extensión opcional (ej: 2711234567 Ext 104).';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSiguiente = () => {
    if (validarCampos()) {
      onSiguiente();
    } else {
      // Enfocar o hacer scroll al primer error
      const primerError = Object.keys(errores)[0];
      if (primerError) {
        document.getElementsByName(primerError)[0]?.focus();
      }
    }
  };

  return (
    <div className="bg-white rounded-utcv shadow-utcv p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-950">Datos de la empresa receptora</h3>
        <p className="text-sm text-gray-500 mt-1">
          Registra la información oficial de la empresa o institución donde realizarás tus estadías profesionales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Nombre Comercial */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Nombre comercial</label>
              <div className="relative group inline-block">
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="w-4.5 h-4.5 rounded-full bg-gray-150 hover:bg-utcv-accent hover:text-white flex items-center justify-center text-[10px] font-bold text-gray-500 transition-all cursor-help focus:outline-none"
                  aria-label="Ayuda para Nombre comercial"
                >
                  ?
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 leading-relaxed font-normal">
                  Es el nombre público o comercial con el que se conoce al negocio en la vida cotidiana.
                  <div className="mt-1.5 font-bold text-utcv-accent">Ejemplo: OXXO, Bimbo, Coca-Cola.</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <input
              type="text"
              name="nombre_comercial"
              value={formData.nombre_comercial || ''}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.nombre_comercial && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.nombre_comercial}</p>}
          </div>

          {/* Razón Social */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Razón social</label>
              <div className="relative group inline-block">
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="w-4.5 h-4.5 rounded-full bg-gray-150 hover:bg-utcv-accent hover:text-white flex items-center justify-center text-[10px] font-bold text-gray-500 transition-all cursor-help focus:outline-none"
                  aria-label="Ayuda para Razón social"
                >
                  ?
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 leading-relaxed font-normal">
                  Es el nombre legal y oficial de la empresa o institución registrado ante el gobierno o el SAT.
                  <div className="mt-1.5 font-bold text-utcv-accent">Ejemplo: Cadena Comercial OXXO S.A. de C.V., Universidad Tecnológica del Centro de Veracruz.</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <input
              type="text"
              name="razon_social"
              value={formData.razon_social || ''}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.razon_social && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.razon_social}</p>}
          </div>

          {/* RFC */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">RFC</label>
              <div className="relative group inline-block">
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="w-4.5 h-4.5 rounded-full bg-gray-150 hover:bg-utcv-accent hover:text-white flex items-center justify-center text-[10px] font-bold text-gray-500 transition-all cursor-help focus:outline-none"
                  aria-label="Ayuda para RFC"
                >
                  ?
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 leading-relaxed font-normal">
                  Registro Federal de Contribuyentes. Consta de 12 caracteres para personas morales (empresas) o 13 para personas físicas.
                  <div className="mt-1.5 font-bold text-utcv-accent">Ejemplo: CCO8605231N4, UTC040825755.</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <input
              type="text"
              name="rfc"
              maxLength={15}
              value={formData.rfc || ''}
              onChange={handleInputChange}
              placeholder="12 o 13 caracteres"
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.rfc && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.rfc}</p>}
          </div>

          {/* Teléfono Empresa */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Teléfono de la empresa</label>
              <div className="relative group inline-block">
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="w-4.5 h-4.5 rounded-full bg-gray-150 hover:bg-utcv-accent hover:text-white flex items-center justify-center text-[10px] font-bold text-gray-500 transition-all cursor-help focus:outline-none"
                  aria-label="Ayuda para Teléfono de la empresa"
                >
                  ?
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 leading-relaxed font-normal">
                  Introduce el número telefónico oficial de la empresa a 10 dígitos.
                  <div className="mt-1.5 font-bold text-utcv-accent">Ejemplo: 2711234567.</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <input
              type="text"
              name="telefono_empresa"
              value={formData.telefono_empresa || ''}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.telefono_empresa && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.telefono_empresa}</p>}
          </div>

          {/* Giro */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Giro de la empresa</label>
            <select
              name="giro"
              value={formData.giro || 'Servicios'}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            >
              <option value="Comercial">Comercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Servicios">Servicios</option>
              <option value="Educativo">Educativo</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Tamaño */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Tamaño de la empresa</label>
            <select
              name="tamano"
              value={formData.tamano || 'Micro 1-10'}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            >
              <option value="Micro 1-10">Micro (1-10 personas)</option>
              <option value="Pequeña 11-50">Pequeña (11-50 personas)</option>
              <option value="Mediana 51-150">Mediana (51-150 personas)</option>
              <option value="Grande más de 151">Grande (más de 151 personas)</option>
            </select>
          </div>

          {/* Tipo Empresa */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipo de empresa</label>
            <div className="flex space-x-6 mt-2">
              <label className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="tipo_empresa"
                  value="Pública"
                  checked={formData.tipo_empresa === 'Pública'}
                  onChange={handleInputChange}
                  className="focus:ring-utcv-primary text-utcv-primary"
                />
                <span>Pública</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="tipo_empresa"
                  value="Privada"
                  checked={formData.tipo_empresa === 'Privada'}
                  onChange={handleInputChange}
                  className="focus:ring-utcv-primary text-utcv-primary"
                />
                <span>Privada</span>
              </label>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</label>
            <input
              type="text"
              name="estado"
              value={formData.estado || 'Veracruz'}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.estado && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.estado}</p>}
          </div>

          {/* Municipio */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Municipio</label>
            <input
              type="text"
              name="municipio"
              value={formData.municipio || ''}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.municipio && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.municipio}</p>}
          </div>

          {/* Código Postal */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Código postal</label>
            <input
              type="text"
              name="cp"
              maxLength={5}
              value={formData.cp || ''}
              onChange={handleInputChange}
              placeholder="5 dígitos"
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.cp && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.cp}</p>}
          </div>

          {/* Domicilio Completo */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Domicilio completo</label>
            <textarea
              name="domicilio"
              rows={3}
              value={formData.domicilio || ''}
              onChange={handleInputChange}
              placeholder="Calle, Número, Colonia, C.P."
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
            {errores.domicilio && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.domicilio}</p>}
          </div>

          {/* Área de la Empresa */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Área de la Empresa (si aplica)</label>
            <input
              type="text"
              name="area_empresa"
              value={formData.area_empresa || ''}
              onChange={handleInputChange}
              placeholder="Ej: Recursos Humanos, Sistemas, etc."
              className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Sección Asesor Industrial */}
        <div className="pt-6 border-t border-gray-150 space-y-4">
          <h4 className="font-bold text-base text-gray-900 border-l-4 border-utcv-primary pl-2">
            Datos del Asesor Industrial
          </h4>
          <p className="text-xs text-gray-500">
            Ingresa los datos del tutor de la empresa. Su correo electrónico se usará para notificaciones del trámite.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nombre Asesor */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Nombre completo</label>
              <input
                type="text"
                name="asesor_ind_nombre"
                value={formData.asesor_ind_nombre || ''}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
              />
              {errores.asesor_ind_nombre && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.asesor_ind_nombre}</p>}
            </div>

            {/* Cargo Asesor */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Cargo</label>
              <input
                type="text"
                name="asesor_ind_cargo"
                value={formData.asesor_ind_cargo || ''}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
              />
              {errores.asesor_ind_cargo && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.asesor_ind_cargo}</p>}
            </div>

            {/* Correo Electrónico Asesor */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Correo electrónico</label>
              <input
                type="email"
                name="asesor_ind_email"
                value={formData.asesor_ind_email || ''}
                onChange={handleInputChange}
                placeholder="ejemplo@empresa.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
              />
              {errores.asesor_ind_email && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.asesor_ind_email}</p>}
            </div>

            {/* Teléfono / Extensión Asesor */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Teléfono / Extensión</label>
                <div className="relative group inline-block">
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="w-4.5 h-4.5 rounded-full bg-gray-150 hover:bg-utcv-accent hover:text-white flex items-center justify-center text-[10px] font-bold text-gray-500 transition-all cursor-help focus:outline-none"
                    aria-label="Ayuda para Teléfono o Extensión del Asesor"
                  >
                    ?
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 leading-relaxed font-normal">
                    Introduce el número de teléfono del asesor a 10 dígitos. Opcionalmente puedes agregar su extensión telefónica.
                    <div className="mt-1.5 font-bold text-utcv-accent">Ejemplo: 2711234567 Ext 104.</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <input
                type="text"
                name="asesor_ind_telefono"
                value={formData.asesor_ind_telefono || ''}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-utcv text-sm focus:ring-1 focus:ring-utcv-primary focus:border-utcv-primary focus:outline-none"
              />
              {errores.asesor_ind_telefono && <p className="text-xs text-utcv-danger font-medium mt-1">{errores.asesor_ind_telefono}</p>}
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
