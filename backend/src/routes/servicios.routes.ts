import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as sc from '../controllers/servicios.controller';

const router = Router();
router.use(authenticate);

router.get('/stats', sc.getStats);
router.get('/global-stats', sc.getGlobalStats);
router.get('/all', sc.getAllWithProspect);
router.get('/prospect/:prospectId', sc.getByProspect);
router.post('/', sc.upsert);
router.put('/:id', sc.update);
router.delete('/:id', authorize('admin'), sc.remove);

export default router;
