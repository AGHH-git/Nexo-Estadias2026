// ARCHIVO: frontend/src/types/index.ts

export type RolUsuario = 'ALUMNO' | 'MAESTRO' | 'JEFE_CARRERA' | 'VINCULACION';

export type EstatusTramite = 
  | 'Borrador' 
  | 'En Revisión Digital' 
  | 'Rechazado Digital' 
  | 'Aprobado para Firmas' 
  | 'Completado';

export interface Usuario {
  id: number;
  identificador: string;
  rol: RolUsuario;
}

export interface Alumno {
  matricula: string;
  nombre_completo: string;
  carrera: string;
  campus: string;
  sistema: string;
  nss?: string;
  telefono?: string;
  email: string;
  asesor_academico?: string;
}

export interface Maestro {
  id: number;
  nombre_completo: string;
  area_adscripcion: string;
  cargo: string;
  telefono?: string;
  extension?: string;
}

export interface Empresa {
  id?: number;
  razon_social: string;
  nombre_comercial?: string;
  rfc: string;
  fecha_constitucion: string;
  giro: 'Comercial' | 'Industrial' | 'Servicios' | 'Educativo' | 'Otro' | string;
  tamano: 'Micro 1-10' | 'Pequeña 11-50' | 'Mediana 51-150' | 'Grande más de 151' | string;
  tipo_empresa: 'Pública' | 'Privada';
  estado: string;
  municipio: string;
  cp: string;
  domicilio: string;
  telefono?: string;
}

export interface HistorialObservacion {
  id: number;
  tramite_id: number;
  maestro_id?: number;
  maestro_nombre?: string;
  comentarios: string;
  fecha: string;
}

export interface TramiteEstadia {
  id: number;
  matricula: string;
  empresa_id: number;
  maestro_id: number;
  periodo_id: number;
  asesor_ind_nombre: string;
  asesor_ind_cargo: string;
  asesor_ind_telefono?: string;
  asesor_ind_email: string;
  nivel_academico: 'TSU' | 'Ingeniería';
  titulo_proyecto: string;
  problematica: string;
  alcance: string;
  producto_generar: string;
  horario_alumno: string;
  fecha_inicio: string;
  fecha_termino: string;
  estatus: EstatusTramite;
  ruta_nss?: string;
  ruta_evidencia?: string;
  fecha_registro: string;
  fecha_actualizacion: string;
  
  // Datos extendidos opcionales
  razon_social?: string;
  nombre_comercial?: string;
  rfc?: string;
  giro?: string;
  tamano?: string;
  tipo_empresa?: 'Pública' | 'Privada';
  estado?: string;
  municipio?: string;
  cp?: string;
  domicilio?: string;
  empresa_telefono?: string;
  maestro_nombre?: string;
  observaciones?: HistorialObservacion[];
}

export interface LoginResponse {
  token: string;
  rol: RolUsuario;
  nombre: string;
}
