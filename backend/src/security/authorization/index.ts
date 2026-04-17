/**
 * API Central de Autorización
 * Exporta todas las funciones y tipos necesarios
 */

// Roles
export { ROLES, Role, LEGACY_ROLE_MAPPING, ROLE_HIERARCHY } from './roles';

// Permisos
export {
  PERMISSIONS,
  Permission,
  PERMISSION_MATRIX,
} from './permissions';

// Contexto
export {
  AuthContext,
  AuthorizationResult,
  AuthorizeOptions,
  AuthorizationStatus,
} from './context';

// Motor de autorización
export {
  authorize,
  requirePermission,
  requireSuperAdmin,
  requireTenantAccess,
  AuthorizationError,
  SENSITIVE_ACTIONS,
} from './authorize';

// Middlewares
export {
  requirePermission as requirePermissionMiddleware,
  requireSuperAdmin as requireSuperAdminMiddleware,
  requireTenantAccess as requireTenantAccessMiddleware,
  handleAuthorizationError,
} from './middleware';
