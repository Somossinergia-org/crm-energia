import { Router } from 'express';
import * as contactController from '../controllers/contactHistory.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/recent', contactController.getRecent);
router.get('/today', contactController.getToday);
router.get('/prospect/:prospectId', contactController.getByProspect);
router.post('/', contactController.create);
router.delete('/:id', authorize('admin'), contactController.remove);

export default router;
