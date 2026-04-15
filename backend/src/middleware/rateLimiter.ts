import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Rate limiter general
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo mas tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para login (mas estricto)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos
  message: {
    success: false,
    message: 'Demasiados intentos de login. Espera 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
