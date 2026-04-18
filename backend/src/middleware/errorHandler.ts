import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

// Error personalizado con código HTTP
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de manejo de errores centralizado
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Error de validación Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Error de validacion',
      errors: err.errors.map(e => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      })),
    });
    return;
  }

  // Error operacional conocido
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Errores de middleware como body-parser que traen status/statusCode
  const anyErr = err as any;
  const statusCode = anyErr.statusCode || anyErr.status;
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    res.status(statusCode).json({
      success: false,
      message: anyErr.message || 'Error en la solicitud',
    });
    return;
  }

  // Error inesperado
  logger.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
}

// Wrapper para async handlers (evita try-catch repetitivo)
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
