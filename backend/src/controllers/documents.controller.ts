import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { documentsModel } from '../models/documents.model';
import { query } from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Directorio de uploads
const UPLOADS_DIR = path.join(__dirname, '../../../uploads/documents');

// Crear directorio si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Tipos de archivo permitidos
const ALLOWED_MIMES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

// Configurar multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIMES[file.mimetype] || path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan: pdf, jpg, png, doc, docx, xls, xlsx'));
    }
  },
});

// Verificar que el comercial tiene acceso al prospecto
async function checkProspectAccess(prospectId: string, userId: string, role: string): Promise<boolean> {
  if (role !== 'comercial') return true;
  const result = await query(
    `SELECT 1 FROM prospects WHERE id = $1 AND asignado_a = $2`,
    [prospectId, userId]
  );
  return result.rows.length > 0;
}

export const getByProspect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hasAccess = await checkProspectAccess(req.params.prospectId, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'No tienes acceso a este prospecto' });

    const documents = await documentsModel.getByProspect(req.params.prospectId);
    res.json({ data: documents });
  } catch (e) { next(e); }
};

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se ha enviado ningún archivo' });

    const { prospect_id, nombre, tipo, notas } = req.body;
    if (!prospect_id || !nombre || !tipo) {
      // Eliminar archivo subido si faltan datos
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Faltan campos requeridos: prospect_id, nombre, tipo' });
    }

    const tiposValidos = ['contrato', 'factura', 'oferta', 'dni', 'otro'];
    if (!tiposValidos.includes(tipo)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: `Tipo no válido. Opciones: ${tiposValidos.join(', ')}` });
    }

    const hasAccess = await checkProspectAccess(prospect_id, req.user!.id, req.user!.role);
    if (!hasAccess) {
      fs.unlinkSync(file.path);
      return res.status(403).json({ error: 'No tienes acceso a este prospecto' });
    }

    const document = await documentsModel.create({
      prospect_id,
      uploaded_by: req.user!.id,
      nombre,
      tipo,
      archivo_url: `/uploads/documents/${file.filename}`,
      archivo_nombre: file.originalname,
      archivo_size: file.size,
      archivo_mime: file.mimetype,
      notas: notas || undefined,
    });

    res.status(201).json({ data: document });
  } catch (e) { next(e); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const document = await documentsModel.getById(req.params.id);
    if (!document) return res.status(404).json({ error: 'Documento no encontrado' });

    const hasAccess = await checkProspectAccess(document.prospect_id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'No tienes acceso a este documento' });

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../../', document.archivo_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await documentsModel.delete(req.params.id);
    res.json({ message: 'Documento eliminado' });
  } catch (e) { next(e); }
};
