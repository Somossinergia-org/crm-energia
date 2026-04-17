/**
 * Contexto de autorización para una solicitud
 * Contiene toda la información necesaria para evaluar permisos
 */

import { Role } from './roles';
import { Permission } from './permissions';

export interface AuthContext {
  // Usuario
  userId: string;
  email: string;
  role: Role;
  tenantId: string;

  // Sesión
  sessionId: string;
  sessionCreatedAt: Date;
  reauthAt?: Date; // Última reauthenticación
  reauthReason?: string; // Motivo de la última reauthenticación

  // Solicitud
  requestId: string;
  ipAddress: string;
  userAgent: string;

  // Break-glass (si aplica)
  breakGlass?: {
    enabled: boolean;
    scope: Permission[]; // Permisos limitados al scope
    expiresAt: Date;
    reason: string;
    approvedBy?: string;
  };

  // Computed
  permissions: Permission[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Resultado de evaluación de permiso
 */
export interface AuthorizationResult {
  allowed: boolean;
  reason: string; // Motivo de denegación o aprobación
  requiresReauth: boolean;
  requiresReason: boolean;
  requiresConfirmation: boolean;
  isBreakGlass?: boolean; // Si se usó break-glass
  breakGlassReason?: string; // Motivo del break-glass
}

/**
 * Opciones para evaluar autorización
 */
export interface AuthorizeOptions {
  /**
   * Requiere reautenticación reciente (< N milisegundos)
   */
  requireReauthAge?: number;

  /**
   * Requiere motivo explícito
   */
  requireReason?: boolean;

  /**
   * Requiere confirmación explícita del usuario
   */
  requireConfirmation?: boolean;

  /**
   * Mensaje de error personalizado
   */
  errorMessage?: string;
}

/**
 * Estado de validación de permiso
 */
export enum AuthorizationStatus {
  ALLOWED = 'ALLOWED',
  DENIED = 'DENIED',
  REQUIRES_REAUTH = 'REQUIRES_REAUTH',
  REQUIRES_REASON = 'REQUIRES_REASON',
  REQUIRES_CONFIRMATION = 'REQUIRES_CONFIRMATION',
}
