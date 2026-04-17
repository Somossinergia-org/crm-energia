/**
 * Contexto de auditoría para registro de acciones
 * Cada acción importante debe dejar traza
 */

import { AuthContext } from '../authorization/context';

/**
 * Tipos de eventos auditables
 */
export enum AuditEventType {
  // Seguridad
  AUTH_LOGIN = 'AUTH.LOGIN',
  AUTH_LOGOUT = 'AUTH.LOGOUT',
  AUTH_FAILED = 'AUTH.FAILED',
  AUTH_MFA_ENABLED = 'AUTH.MFA_ENABLED',
  AUTH_MFA_DISABLED = 'AUTH.MFA_DISABLED',

  // Permisos
  PERM_CHECK = 'PERM.CHECK',
  PERM_DENIED = 'PERM.DENIED',
  PERM_GRANTED = 'PERM.GRANTED',
  PERM_ESCALATED = 'PERM.ESCALATED', // Break-glass

  // Datos
  DATA_CREATE = 'DATA.CREATE',
  DATA_READ = 'DATA.READ',
  DATA_UPDATE = 'DATA.UPDATE',
  DATA_DELETE = 'DATA.DELETE',

  // Administración
  ADMIN_ROLE_CHANGE = 'ADMIN.ROLE_CHANGE',
  ADMIN_USER_DISABLE = 'ADMIN.USER_DISABLE',
  ADMIN_TENANT_CREATE = 'ADMIN.TENANT_CREATE',
  ADMIN_TENANT_DELETE = 'ADMIN.TENANT_DELETE',
}

/**
 * Severidad de evento
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Evento de auditoría
 */
export interface AuditEvent {
  id?: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  timestamp: Date;
  userId: string;
  tenantId: string;
  role: string;

  // Detalles de la acción
  action: string; // Ej: "DELETE_USER"
  resource: string; // Ej: "users"
  resourceId?: string;

  // Contexto
  ipAddress?: string;
  userAgent?: string;

  // Resultado
  success: boolean;
  reason?: string; // Por qué se permitió o denegó
  error?: string;

  // Break-glass
  isBreakGlassAction?: boolean;
  breakGlassReason?: string;
  breakGlassExpiration?: Date;

  // Detalles adicionales
  metadata?: Record<string, any>;
}

/**
 * Constructor de eventos de auditoría
 */
export class AuditContextBuilder {
  private event: AuditEvent;

  constructor(
    eventType: AuditEventType,
    authContext: AuthContext,
    resource: string
  ) {
    this.event = {
      eventType,
      severity: this.determineSeverity(eventType),
      timestamp: new Date(),
      userId: authContext.userId,
      tenantId: authContext.tenantId,
      role: authContext.role,
      action: '',
      resource,
      success: false,
    };
  }

  private determineSeverity(eventType: AuditEventType): AuditSeverity {
    if (eventType.includes('DENIED') || eventType.includes('FAILED')) {
      return AuditSeverity.WARNING;
    }
    if (
      eventType.includes('ADMIN') ||
      eventType.includes('ESCALATED') ||
      eventType.includes('DELETE')
    ) {
      return AuditSeverity.CRITICAL;
    }
    if (eventType === AuditEventType.DATA_READ) {
      return AuditSeverity.INFO;
    }
    return AuditSeverity.INFO;
  }

  withAction(action: string): this {
    this.event.action = action;
    return this;
  }

  withResourceId(resourceId: string): this {
    this.event.resourceId = resourceId;
    return this;
  }

  withIpAddress(ipAddress: string): this {
    this.event.ipAddress = ipAddress;
    return this;
  }

  withUserAgent(userAgent: string): this {
    this.event.userAgent = userAgent;
    return this;
  }

  withSuccess(success: boolean, reason?: string): this {
    this.event.success = success;
    if (reason) {
      this.event.reason = reason;
    }
    return this;
  }

  withError(error: string): this {
    this.event.error = error;
    this.event.success = false;
    return this;
  }

  withBreakGlass(reason: string, expiration: Date): this {
    this.event.isBreakGlassAction = true;
    this.event.breakGlassReason = reason;
    this.event.breakGlassExpiration = expiration;
    return this;
  }

  withMetadata(metadata: Record<string, any>): this {
    this.event.metadata = metadata;
    return this;
  }

  build(): AuditEvent {
    return this.event;
  }
}

/**
 * Servicio de auditoría (interface)
 * Implementación será en los servicios
 */
export interface IAuditService {
  log(event: AuditEvent): Promise<void>;
  findByUser(userId: string, limit?: number): Promise<AuditEvent[]>;
  findByResource(resource: string, limit?: number): Promise<AuditEvent[]>;
  findByTenant(tenantId: string, limit?: number): Promise<AuditEvent[]>;
}
