// ARCHIVO: backend/src/routes/tramites.routes.ts
import { Router } from 'express';
import { 
  crearTramite, 
  actualizarTramite, 
  subirEvidencia, 
  descargarPDFPrefilled, 
  buscarEmpresas 
} from '../controllers/tramites.controller';
import { verificarToken, autorizarRoles } from '../middleware/auth.middleware';
import { uploadPDF } from '../middleware/upload.middleware';

const tramitesRouter = Router();
const empresasRouter = Router();

// ==========================================
// Rutas de Trámites (/api/tramites)
// ==========================================

// Registrar nuevo trámite (Protegido para Alumnos)
tramitesRouter.post(
  '/', 
  verificarToken, 
  autorizarRoles(['ALUMNO']), 
  uploadPDF.fields([{ name: 'nss', maxCount: 1 }, { name: 'ine_tutor', maxCount: 1 }]), 
  crearTramite
);

// Actualizar trámite existente (Protegido para Alumnos)
tramitesRouter.put(
  '/:id', 
  verificarToken, 
  autorizarRoles(['ALUMNO']), 
  uploadPDF.fields([{ name: 'nss', maxCount: 1 }, { name: 'ine_tutor', maxCount: 1 }]), 
  actualizarTramite
);

// Subir PDF firmado de evidencia final (Protegido para Alumnos)
tramitesRouter.post(
  '/:id/evidencia', 
  verificarToken, 
  autorizarRoles(['ALUMNO']), 
  uploadPDF.single('evidencia'), 
  subirEvidencia
);

// Descargar FODVI08-H prellenado en PDF (Protegido por Token)
tramitesRouter.get(
  '/:id/pdf', 
  verificarToken, 
  descargarPDFPrefilled
);

// ==========================================
// Rutas de Empresas (/api/empresas)
// ==========================================

// Buscar empresas en el padrón por término de búsqueda (Protegido por Token)
empresasRouter.get(
  '/buscar', 
  verificarToken, 
  buscarEmpresas
);

export { tramitesRouter, empresasRouter };
