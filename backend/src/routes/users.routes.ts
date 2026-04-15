import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Perfil propio
router.put('/profile', usersController.updateProfile);

// Solo admin puede ver y gestionar usuarios
router.get('/', authorize('admin', 'supervisor'), usersController.getAll);
router.get('/:id', authorize('admin', 'supervisor'), usersController.getById);
router.put('/:id', authorize('admin'), usersController.update);

export default router;
