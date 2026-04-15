import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadBill, uploadBillOrPhoto, parseBill, parseBillPhoto } from '../controllers/billParser.controller';

const router = Router();

// POST /api/bill/parse - PDF con regex + fallback Gemini
router.post('/parse', authenticate, (req, res, next) => {
  uploadBill(req, res, (err: any) => {
    if (err) return res.status(400).json({ error: err.message || 'Error al subir el archivo' });
    parseBill(req, res, next);
  });
});

// POST /api/bill/extract-photo - Imagen de factura con Gemini Vision
router.post('/extract-photo', authenticate, (req, res, next) => {
  uploadBillOrPhoto(req, res, (err: any) => {
    if (err) return res.status(400).json({ error: err.message || 'Error al subir el archivo' });
    parseBillPhoto(req, res, next);
  });
});

export default router;
