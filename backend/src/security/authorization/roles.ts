/**
 * Define todos los roles disponibles en el sistema
 * DENY BY DEFAULT: un rol solo tiene lo que explícitamente se le asigna
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_TENANT: 'ADMIN_TENANT',
  JEFE: 'JEFE',
  VENTAS: 'VENTAS',
  ALMACEN: 'ALMACEN',
  REPARTO: 'REPARTO',
  TESORERIA: 'TESORERIA',
  FACTURACION: 'FACTURACION',
  SOPORTE_INTERNO: 'SOPORTE_INTERNO',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Mapping legacy roles (en DB) a nuevos roles
 * Usado durante migración
 */
export const LEGACY_ROLE_MAPPING: Record<string, Role> = {
  admin: ROLES.SUPER_ADMIN,
  comercial: ROLES.VENTAS,
  supervisor: ROLES.JEFE,
};

/**
 * Roles ordenados por nivel de privilegio (mayor al menor)
 * Usado para validaciones y heredancia
 */
export const ROLE_HIERARCHY: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN_TENANT,
  ROLES.SOPORTE_INTERNO,
  ROLES.JEFE,
  ROLES.TESORERIA,
  ROLES.FACTURACION,
  ROLES.ALMACEN,
  ROLES.REPARTO,
  ROLES.VENTAS,
];
