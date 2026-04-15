import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getByProspect, uploadDocument, upload, remove } from '../controllers/documents.controller';

const router = Router();
router.use(authenticate);

router.get('/prospect/:prospectId', getByProspect);
router.post('/upload', upload.single('archivo'), uploadDocument);
router.delete('/:id', remove);

export default router;
