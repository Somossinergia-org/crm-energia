import { Router } from 'express';
import multer from 'multer';
import * as prospectsController from '../controllers/prospects.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

// Estadísticas (antes de /:id para evitar conflicto)
router.get('/stats', prospectsController.getStats);
router.get('/clients', prospectsController.getClients);
router.get('/clients/stats', prospectsController.getClientStats);

// CRUD
router.get('/', prospectsController.getAll);
router.get('/:id', prospectsController.getById);
router.post('/', prospectsController.create);
router.put('/:id', prospectsController.update);
router.delete('/:id', authorize('admin'), prospectsController.remove);

// Acciones
router.patch('/:id/status', prospectsController.updateStatus);
router.post('/:id/duplicate', prospectsController.duplicate);

// Importación CSV
router.post('/import', upload.single('file'), prospectsController.importCSV);

export default router;
