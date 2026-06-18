"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPDF = void 0;
const multer_1 = __importDefault(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Determinar la carpeta según el nombre del campo o una propiedad de la request
        if (file.fieldname === 'evidencia' || req.path.includes('evidencia')) {
            cb(null, EVIDENCIAS_DIR);
        }
        else if (file.fieldname === 'ine_tutor' || req.path.includes('ine_tutor')) {
            cb(null, INE_TUTOR_DIR);
        }
        else {
            cb(null, NSS_DIR);
        }
    },
    filename: (req, file, cb) => {
        // El nombre esperado es MATRICULA_NSS.pdf, MATRICULA_EVIDENCIA.pdf o MATRICULA_INE_TUTOR.ext
        const matricula = req.usuario?.identificador || 'anonimo';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase();
        if (file.fieldname === 'evidencia' || req.path.includes('evidencia')) {
            cb(null, `${matricula}_EVIDENCIA_${timestamp}${ext}`);
        }
        else if (file.fieldname === 'ine_tutor' || req.path.includes('ine_tutor')) {
            cb(null, `${matricula}_INE_TUTOR_${timestamp}${ext}`);
        }
        else {
            cb(null, `${matricula}_NSS_${timestamp}${ext}`);
        }
    }
});
// Filtro para validar formatos de archivo
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'ine_tutor') {
        const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedExts.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Solo se permiten archivos PDF o imágenes (JPG, PNG) para la copia del INE del tutor.'));
        }
    }
    else {
        if (ext !== '.pdf' || file.mimetype !== 'application/pdf') {
            return cb(new Error('Solo se permiten archivos en formato PDF (.pdf)'));
        }
    }
    cb(null, true);
};
// Configurar multer con límites de tamaño de 5MB
exports.uploadPDF = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 Megabytes en bytes
    }
});
