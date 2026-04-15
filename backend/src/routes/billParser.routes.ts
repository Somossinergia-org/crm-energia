import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadBill, parseBill } from '../controllers/billParser.controller';

const router = Router();

// POST /api/bill/parse - Upload and parse electricity bill PDF
router.post('/parse', authenticate, (req, res, next) => {
  uploadBill(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error al subir el archivo' });
    }
    parseBill(req, res, next);
  });
});

export default router;
