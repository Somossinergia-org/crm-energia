/**
 * Middlewares de Express para autorización
 * Se aplican a endpoints protegidos
 */

import { Request, Response, NextFunction } from 'express';
import { Permission } from './permissions';
import { AuthContext, AuthorizeOptions } from './context';
import {
  authorize,
  requireSuperAdmin as requireSuperAdminCheck,
  AuthorizationError,
} from './authorize';

/**
 * Extiende Request para incluir contexto de autorización
 */
declare global {
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

/**
 * Middleware: requiere permiso específico
 *
 * Uso:
 *   router.post('/users', requirePermission('users.create'), handler)
 */
export function requirePermission(
  permission: Permission,
  options: AuthorizeOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.authContext) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Se requiere autenticación',
          },
        });
        return;
      }

      const result = authorize(req.authContext, permission, options);

      if (!result.allowed) {
        // Manejo específico de estados
        switch (result.reason) {
          case 'REQUIRES_REAUTH':
            res.status(403).json({
              success: false,
              error: {
                code: 'AUTH_REAUTH_REQUIRED',
                message: 'Reautenticación requerida para esta acción',
              },
            });
            break;

          case 'REQUIRES_REASON':
            res.status(403).json({
              success: false,
              error: {
                code: 'ACTION_REQUIRES_REASON',
                message: 'Debes proporcionar un motivo para esta acción',
              },
            });
            break;

          case 'REQUIRES_CONFIRMATION':
            res.status(403).json({
              success: false,
              error: {
                code: 'ACTION_REQUIRES_CONFIRMATION',
                message: 'Confirmación requerida para continuar',
              },
            });
            break;

          default:
            res.status(403).json({
              success: false,
              error: {
                code: 'ACCESS_DENIED',
                message: 'No tienes permisos para realizar esta acción',
              },
            });
        }
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: requiere ser SUPER_ADMIN
 *
 * Uso:
 *   router.post('/admin/tenant', requireSuperAdmin(), handler)
 */
export function requireSuperAdmin() {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.authContext) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Se requiere autenticación',
          },
        });
        return;
      }

      if (!req.authContext.isSuperAdmin) {
        res.status(403).json({
          success: false,
          error: {
            code: 'SUPER_ADMIN_ONLY',
            message: 'Solo SuperAdmin puede acceder',
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: validar que el recurso pertenece al tenant del usuario
 *
 * Uso:
 *   router.get('/prospects/:id', requireTenantAccess, handler)
 *
 * El handler debe extraer resourceTenantId de params/query y asignarlo a:
 *   req.resourceTenantId
 */
export function requireTenantAccess() {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.authContext) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Se requiere autenticación',
          },
        });
        return;
      }

      const resourceTenantId = (req as any).resourceTenantId;
      if (!resourceTenantId) {
        // Asumir que si no se especifica, es del tenant del usuario
        next();
        return;
      }

      // SUPER_ADMIN puede acceder a cualquier tenant (pero se audita)
      if (req.authContext.isSuperAdmin) {
        next();
        return;
      }

      if (req.authContext.tenantId !== resourceTenantId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_MISMATCH',
            message: 'No tienes acceso a este recurso',
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: procesar AuthorizationError
 * Se coloca al final de los middlewares de error
 */
export function handleAuthorizationError(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AuthorizationError) {
    res.status(403).json({
      success: false,
      error: {
        code: error.message,
        message: 'Acceso denegado',
      },
    });
    return;
  }

  next(error);
}
