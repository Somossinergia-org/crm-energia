/**
 * Define todos los permisos granulares disponibles
 * Permiso = recurso + acción (ej: "users.create", "billing.read")
 */

export const PERMISSIONS = {
  // Tenant management
  TENANT_READ: 'tenant.read',
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',

  // Users management
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_UPDATE_ROLE: 'users.update_role',
  USERS_DISABLE: 'users.disable',
  USERS_AUDIT: 'users.audit',

  // Pipeline (prospects/opportunities)
  PIPELINE_READ: 'pipeline.read',
  PIPELINE_CREATE: 'pipeline.create',
  PIPELINE_UPDATE: 'pipeline.update',
  PIPELINE_DELETE: 'pipeline.delete',
  PIPELINE_EXPORT: 'pipeline.export',

  // Warehouse
  WAREHOUSE_READ: 'warehouse.read',
  WAREHOUSE_UPDATE: 'warehouse.update',

  // Delivery
  DELIVERY_READ: 'delivery.read',
  DELIVERY_UPDATE: 'delivery.update',

  // Billing
  BILLING_READ: 'billing.read',
  BILLING_CREATE: 'billing.create',
  BILLING_UPDATE: 'billing.update',
  BILLING_EXPORT: 'billing.export',

  // Invoices
  INVOICE_CREATE: 'invoice.create',
  INVOICE_CANCEL: 'invoice.cancel',

  // Security & Audit
  SECURITY_READ: 'security.read',
  SECURITY_MANAGE: 'security.manage',
  AUDIT_VIEW: 'audit.view',
  AUDIT_EXPORT: 'audit.export',

  // Admin operations
  ADMIN_FEATURE_FLAGS: 'admin.featureFlags',
  ADMIN_BREAK_GLASS: 'admin.breakGlass',
  ADMIN_LOGS: 'admin.logs',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Matriz de permisos: rol => lista de permisos
 * DENY BY DEFAULT: si un permiso no está aquí, está denegado
 */
export const PERMISSION_MATRIX: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    // Tenant (acceso total)
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_CREATE,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.TENANT_DELETE,

    // Users (acceso total)
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_UPDATE_ROLE,
    PERMISSIONS.USERS_DISABLE,
    PERMISSIONS.USERS_AUDIT,

    // Pipeline
    PERMISSIONS.PIPELINE_READ,
    PERMISSIONS.PIPELINE_CREATE,
    PERMISSIONS.PIPELINE_UPDATE,
    PERMISSIONS.PIPELINE_DELETE,
    PERMISSIONS.PIPELINE_EXPORT,

    // Warehouse & Delivery
    PERMISSIONS.WAREHOUSE_READ,
    PERMISSIONS.WAREHOUSE_UPDATE,
    PERMISSIONS.DELIVERY_READ,
    PERMISSIONS.DELIVERY_UPDATE,

    // Billing
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.BILLING_EXPORT,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_CANCEL,

    // Security
    PERMISSIONS.SECURITY_READ,
    PERMISSIONS.SECURITY_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_EXPORT,

    // Admin
    PERMISSIONS.ADMIN_FEATURE_FLAGS,
    PERMISSIONS.ADMIN_BREAK_GLASS,
    PERMISSIONS.ADMIN_LOGS,
  ],

  ADMIN_TENANT: [
    // Own tenant only (validated separately)
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_UPDATE,

    // Users (own tenant)
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_UPDATE_ROLE,
    PERMISSIONS.USERS_DISABLE,
    PERMISSIONS.USERS_AUDIT,

    // Pipeline (full)
    PERMISSIONS.PIPELINE_READ,
    PERMISSIONS.PIPELINE_CREATE,
    PERMISSIONS.PIPELINE_UPDATE,
    PERMISSIONS.PIPELINE_DELETE,
    PERMISSIONS.PIPELINE_EXPORT,

    // Warehouse & Delivery (full)
    PERMISSIONS.WAREHOUSE_READ,
    PERMISSIONS.WAREHOUSE_UPDATE,
    PERMISSIONS.DELIVERY_READ,
    PERMISSIONS.DELIVERY_UPDATE,

    // Billing (full)
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.BILLING_EXPORT,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_CANCEL,

    // Security (own tenant)
    PERMISSIONS.SECURITY_READ,
    PERMISSIONS.SECURITY_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_EXPORT,

    // Admin logs
    PERMISSIONS.ADMIN_LOGS,
  ],

  JEFE: [
    // Tenant (read only)
    PERMISSIONS.TENANT_READ,

    // Users (limited - own team only)
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE, // own team only
    PERMISSIONS.USERS_UPDATE, // own team only
    PERMISSIONS.USERS_DISABLE, // own team only
    PERMISSIONS.USERS_AUDIT,

    // Pipeline (full)
    PERMISSIONS.PIPELINE_READ,
    PERMISSIONS.PIPELINE_CREATE,
    PERMISSIONS.PIPELINE_UPDATE,
    PERMISSIONS.PIPELINE_DELETE,
    PERMISSIONS.PIPELINE_EXPORT,

    // Warehouse & Delivery (read only)
    PERMISSIONS.WAREHOUSE_READ,
    PERMISSIONS.DELIVERY_READ,

    // Billing (read only)
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_EXPORT,

    // Audit (read only)
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.ADMIN_LOGS,
  ],

  VENTAS: [
    // Tenant (read only)
    PERMISSIONS.TENANT_READ,

    // Pipeline (own prospects)
    PERMISSIONS.PIPELINE_READ,
    PERMISSIONS.PIPELINE_CREATE,
    PERMISSIONS.PIPELINE_UPDATE, // own only

    // Warehouse (read only - relevante)
    PERMISSIONS.WAREHOUSE_READ,

    // Billing (read only - información relevante)
    PERMISSIONS.BILLING_READ,
  ],

  ALMACEN: [
    PERMISSIONS.TENANT_READ,

    // Warehouse (full)
    PERMISSIONS.WAREHOUSE_READ,
    PERMISSIONS.WAREHOUSE_UPDATE,

    // Delivery (read only)
    PERMISSIONS.DELIVERY_READ,
  ],

  REPARTO: [
    PERMISSIONS.TENANT_READ,

    // Delivery (own)
    PERMISSIONS.DELIVERY_READ,
    PERMISSIONS.DELIVERY_UPDATE,

    // Warehouse (read only - stock info)
    PERMISSIONS.WAREHOUSE_READ,
  ],

  TESORERIA: [
    PERMISSIONS.TENANT_READ,

    // Billing (full)
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.BILLING_EXPORT,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_CANCEL,

    // Pipeline (read only)
    PERMISSIONS.PIPELINE_READ,
  ],

  FACTURACION: [
    PERMISSIONS.TENANT_READ,

    // Billing (full)
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_EXPORT,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_CANCEL,

    // Pipeline (read only)
    PERMISSIONS.PIPELINE_READ,
  ],

  SOPORTE_INTERNO: [
    // Audit & security (para troubleshooting)
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.SECURITY_READ,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.ADMIN_LOGS,
    PERMISSIONS.ADMIN_BREAK_GLASS, // con restricciones
  ],
};
