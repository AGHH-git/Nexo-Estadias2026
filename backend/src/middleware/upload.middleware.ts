// ARCHIVO: backend/src/middleware/upload.middleware.ts
import { Request } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Directorios base de almacenamiento (relativos al directorio raíz del proyecto)
const STORAGE_ROOT = path.join(__dirname, '../../storage');
const NSS_DIR = path.join(STORAGE_ROOT, 'nss');
const EVIDENCIAS_DIR = path.join(STORAGE_ROOT, 'evidencias');
const INE_TUTOR_DIR = path.join(STORAGE_ROOT, 'ine_tutor');

// Asegurarse de que los directorios existan
if (!fs.existsSync(NSS_DIR)) {
  fs.mkdirSync(NSS_DIR, { recursive: true });
}
if (!fs.existsSync(EVIDENCIAS_DIR)) {
  fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
}
if (!fs.existsSync(INE_TUTOR_DIR)) {
  fs.mkdirSync(INE_TUTOR_DIR, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    // Determinar la carpeta según el nombre del campo o una propiedad de la request
    if (file.fieldname === 'evidencia' || req.path.includes('evidencia')) {
      cb(null, EVIDENCIAS_DIR);
    } else if (file.fieldname === 'ine_tutor' || req.path.includes('ine_tutor')) {
      cb(null, INE_TUTOR_DIR);
    } else {
      cb(null, NSS_DIR);
    }
  },
  filename: (req: any, file, cb) => {
    // El nombre esperado es MATRICULA_NSS.pdf, MATRICULA_EVIDENCIA.pdf o MATRICULA_INE_TUTOR.ext
    const matricula = req.usuario?.identificador || 'anonimo';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (file.fieldname === 'evidencia' || req.path.includes('evidencia')) {
      cb(null, `${matricula}_EVIDENCIA_${timestamp}${ext}`);
    } else if (file.fieldname === 'ine_tutor' || req.path.includes('ine_tutor')) {
      cb(null, `${matricula}_INE_TUTOR_${timestamp}${ext}`);
    } else {
      cb(null, `${matricula}_NSS_${timestamp}${ext}`);
    }
  }
});

// Filtro para validar formatos de archivo
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'ine_tutor') {
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedExts.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten archivos PDF o imágenes (JPG, PNG) para la copia del INE del tutor.'));
    }
  } else {
    if (ext !== '.pdf' || file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten archivos en formato PDF (.pdf)'));
    }
  }
  cb(null, true);
};

// Configurar multer con límites de tamaño de 5MB
export const uploadPDF = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes en bytes
  }
});

