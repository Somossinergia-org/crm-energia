/**
 * Motor central de autorización
 * Punto único de evaluación de permisos DENY BY DEFAULT
 */

import { Permission, PERMISSION_MATRIX } from './permissions';
import { Role } from './roles';
import {
  AuthContext,
  AuthorizeOptions,
  AuthorizationResult,
  AuthorizationStatus,
} from './context';

/**
 * Constantes de sensibilidad de acciones
 */
export const SENSITIVE_ACTIONS = {
  USERS_UPDATE_ROLE: true,
  USERS_DISABLE: true,
  TENANT_UPDATE: true,
  TENANT_DELETE: true,
  BILLING_CREATE: true,
  BILLING_UPDATE: true,
  INVOICE_CREATE: true,
  INVOICE_CANCEL: true,
  SECURITY_MANAGE: true,
  ADMIN_BREAK_GLASS: true,
  ADMIN_FEATURE_FLAGS: true,
} as const;

/**
 * Evalúa si una solicitud está autorizada
 * Retorna permiso o explica por qué está denegado
 *
 * DENY BY DEFAULT: todo comienza como denegado
 */
export function authorize(
  context: AuthContext,
  permission: Permission,
  options: AuthorizeOptions = {}
): AuthorizationResult {
  // Paso 1: ¿Usuario autenticado?
  if (!context.isAuthenticated) {
    return {
      allowed: false,
      reason: 'AUTH_REQUIRED',
      requiresReauth: false,
      requiresReason: false,
      requiresConfirmation: false,
    };
  }

  // Paso 2: ¿Tensor válido?
  if (!context.tenantId) {
    return {
      allowed: false,
      reason: 'TENANT_MISMATCH',
      requiresReauth: false,
      requiresReason: false,
      requiresConfirmation: false,
    };
  }

  // Paso 3: ¿Rol tiene permiso?
  const rolePermissions = PERMISSION_MATRIX[context.role] || [];
  const hasPermission = rolePermissions.includes(permission);

  if (!hasPermission) {
    return {
      allowed: false,
      reason: 'ACCESS_DENIED',
      requiresReauth: false,
      requiresReason: false,
      requiresConfirmation: false,
    };
  }

  // Paso 4: ¿Es acción sensible?
  const isSensitive = (SENSITIVE_ACTIONS as Record<string, boolean>)[
    permission.replace('.', '_').toUpperCase()
  ];

  if (isSensitive) {
    // Requiere reauthenticación reciente
    const reauthAge = options.requireReauthAge || 300000; // 5 minutos por defecto
    if (!context.reauthAt || Date.now() - context.reauthAt.getTime() > reauthAge) {
      return {
        allowed: false,
        reason: 'REQUIRES_REAUTH',
        requiresReauth: true,
        requiresReason: false,
        requiresConfirmation: false,
      };
    }

    // Requiere motivo
    if (options.requireReason && !context.reauthReason) {
      return {
        allowed: false,
        reason: 'REQUIRES_REASON',
        requiresReauth: false,
        requiresReason: true,
        requiresConfirmation: false,
      };
    }

    // Requiere confirmación
    if (options.requireConfirmation) {
      return {
        allowed: false,
        reason: 'REQUIRES_CONFIRMATION',
        requiresReauth: false,
        requiresReason: false,
        requiresConfirmation: true,
      };
    }
  }

  // Paso 5: Break-glass (si aplica)
  if (context.breakGlass?.enabled) {
    // Validar que el permiso esté en el scope del break-glass
    const inScope = context.breakGlass.scope.includes(permission);
    if (!inScope) {
      return {
        allowed: false,
        reason: 'BREAK_GLASS_OUT_OF_SCOPE',
        requiresReauth: false,
        requiresReason: false,
        requiresConfirmation: false,
      };
    }

    // Validar expiración
    if (context.breakGlass.expiresAt < new Date()) {
      return {
        allowed: false,
        reason: 'BREAK_GLASS_EXPIRED',
        requiresReauth: false,
        requiresReason: false,
        requiresConfirmation: false,
      };
    }
  }

  // ✅ PERMITIDO
  return {
    allowed: true,
    reason: 'ALLOWED',
    requiresReauth: false,
    requiresReason: false,
    requiresConfirmation: false,
  };
}

/**
 * Valida que el usuario tiene permiso; lanza excepción si no
 */
export function requirePermission(
  context: AuthContext,
  permission: Permission,
  options: AuthorizeOptions = {}
): void {
  const result = authorize(context, permission, options);
  if (!result.allowed) {
    throw new AuthorizationError(result.reason, result);
  }
}

/**
 * Valida que el usuario es SUPER_ADMIN
 */
export function requireSuperAdmin(context: AuthContext): void {
  if (!context.isSuperAdmin) {
    throw new AuthorizationError('ACCESS_DENIED', {
      allowed: false,
      reason: 'SUPER_ADMIN_ONLY',
      requiresReauth: false,
      requiresReason: false,
      requiresConfirmation: false,
    });
  }
}

/**
 * Valida que el usuario pertenece al tenant
 */
export function requireTenantAccess(
  context: AuthContext,
  resourceTenantId: string
): void {
  // SUPER_ADMIN puede acceder a cualquier tenant (pero se audita)
  if (context.isSuperAdmin) {
    return;
  }

  if (context.tenantId !== resourceTenantId) {
    throw new AuthorizationError('TENANT_MISMATCH', {
      allowed: false,
      reason: 'TENANT_MISMATCH',
      requiresReauth: false,
      requiresReason: false,
      requiresConfirmation: false,
    });
  }
}

/**
 * Error de autorización
 */
export class AuthorizationError extends Error {
  constructor(
    code: string,
    public result: AuthorizationResult
  ) {
    super(code);
    this.name = 'AuthorizationError';
  }
}
