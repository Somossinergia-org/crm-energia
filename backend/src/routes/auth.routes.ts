import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rutas públicas
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Rutas protegidas
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);

// Solo admin puede registrar usuarios
router.post('/register', authenticate, authorize('admin'), authController.register);

export default router;
