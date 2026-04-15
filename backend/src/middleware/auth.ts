import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { Role } from '../utils/constants';

// Extender Request para incluir usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    nombre: string;
  };
}

// Verificar JWT y adjuntar usuario al request
export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Token de autenticacion requerido', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: Role;
      nombre: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expirado', 401);
    }
    throw new AppError('Token invalido', 401);
  }
}

// Verificar que el usuario tiene uno de los roles permitidos
export function authorize(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('No tienes permisos para esta accion', 403);
    }

    next();
  };
}
