import { Router } from 'express';
import * as visitsController from '../controllers/visits.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', visitsController.getAll);
router.get('/today', visitsController.getToday);
router.get('/:id', visitsController.getById);
router.post('/', visitsController.create);
router.put('/:id', visitsController.update);
router.delete('/:id', visitsController.remove);

export default router;
