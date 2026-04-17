/**
 * API Central del Módulo de Seguridad
 * Punto de entrada único para todo lo relacionado a autorización y auditoría
 */

// ============================================================================
// AUTORIZACIÓN
// ============================================================================

export {
  // Roles
  ROLES,
  Role,
  LEGACY_ROLE_MAPPING,
  ROLE_HIERARCHY,
  // Permisos
  PERMISSIONS,
  Permission,
  PERMISSION_MATRIX,
  // Contexto
  AuthContext,
  AuthorizationResult,
  AuthorizeOptions,
  AuthorizationStatus,
  // Motor de autorización
  authorize,
  requirePermission,
  requireSuperAdmin,
  requireTenantAccess,
  AuthorizationError,
  SENSITIVE_ACTIONS,
} from './authorization';

export {
  // Middlewares de Express
  requirePermissionMiddleware,
  requireSuperAdminMiddleware,
  requireTenantAccessMiddleware,
  handleAuthorizationError,
} from './authorization/middleware';

// ============================================================================
// AUDITORÍA
// ============================================================================

export {
  // Contexto de auditoría
  AuditEvent,
  AuditEventType,
  AuditSeverity,
  AuditContextBuilder,
  IAuditService,
} from './audit/auditContext';

export {
  // Servicio de auditoría
  AuditLogService,
  auditLogService,
} from './audit/auditLog.model';

export {
  // Integración de auditoría
  AuditService,
} from './audit/auditService';

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export {
  // Feature flags
  FeatureFlags,
  getFeatureFlags,
  getFlagscached,
  isFeatureEnabled,
  requireDevFlag,
  validateSecurityFlags,
} from './features/featureFlags';
