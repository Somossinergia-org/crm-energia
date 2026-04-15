import { Router } from 'express';
import * as zonesController from '../controllers/zones.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', zonesController.getAll);
router.post('/', authorize('admin'), zonesController.create);
router.put('/:id', authorize('admin'), zonesController.update);
router.delete('/:id', authorize('admin'), zonesController.remove);

export default router;
