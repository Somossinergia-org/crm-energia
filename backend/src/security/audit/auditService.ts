/**
 * Servicio de Auditoría Integrado
 * Conecta autorización con logging automático
 */

import { AuthContext, AuthorizationResult } from '../authorization/context';
import { AuditContextBuilder, AuditEventType, AuditSeverity } from './auditContext';
import { auditLogService } from './auditLog.model';

/**
 * Registra un evento de auditoría de forma automática
 */
export class AuditService {
  /**
   * Audita un check de permiso
   */
  static auditPermissionCheck(
    authContext: AuthContext,
    permission: string,
    result: AuthorizationResult,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      resource?: string;
      resourceId?: string;
    }
  ): void {
    const eventType = result.allowed
      ? AuditEventType.PERM_GRANTED
      : AuditEventType.PERM_DENIED;

    const builder = new AuditContextBuilder(eventType, authContext, options?.resource || 'unknown')
      .withAction(`PERMISSION_CHECK: ${permission}`)
      .withResourceId(options?.resourceId || '')
      .withSuccess(result.allowed, result.reason)
      .withIpAddress(options?.ipAddress || '')
      .withUserAgent(options?.userAgent || '');

    if (result.isBreakGlass) {
      builder.withBreakGlass(result.breakGlassReason || '', new Date());
    }

    const event = builder.build();

    // Log async
    auditLogService.log(event).catch((err: Error) => {
      console.error('Failed to log permission check:', err);
    });
  }

  /**
   * Audita un cambio de rol
   */
  static auditRoleChange(
    authContext: AuthContext,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    reason?: string
  ): void {
    const builder = new AuditContextBuilder(
      AuditEventType.ADMIN_ROLE_CHANGE,
      authContext,
      'users'
    )
      .withAction('ROLE_CHANGE')
      .withResourceId(targetUserId)
      .withSuccess(true, reason)
      .withMetadata({
        oldRole,
        newRole,
      });

    const event = builder.build();

    auditLogService.log(event).catch((err: Error) => {
      console.error('Failed to log role change:', err);
    });
  }

  /**
   * Audita un acceso a datos
   */
  static auditDataAccess(
    authContext: AuthContext,
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    resource: string,
    resourceId: string,
    success: boolean,
    metadata?: any
  ): void {
    const eventTypeMap = {
      CREATE: AuditEventType.DATA_CREATE,
      READ: AuditEventType.DATA_READ,
      UPDATE: AuditEventType.DATA_UPDATE,
      DELETE: AuditEventType.DATA_DELETE,
    };

    const builder = new AuditContextBuilder(
      eventTypeMap[action],
      authContext,
      resource
    )
      .withAction(action)
      .withResourceId(resourceId)
      .withSuccess(success);

    if (metadata) {
      builder.withMetadata(metadata);
    }

    const event = builder.build();

    auditLogService.log(event).catch((err: Error) => {
      console.error('Failed to log data access:', err);
    });
  }

  /**
   * Audita una escalación de permisos (break-glass)
   */
  static auditBreakGlass(
    authContext: AuthContext,
    resource: string,
    resourceId: string,
    reason: string,
    expiration: Date,
    metadata?: any
  ): void {
    const builder = new AuditContextBuilder(
      AuditEventType.PERM_ESCALATED,
      authContext,
      resource
    )
      .withAction('BREAK_GLASS_ESCALATION')
      .withResourceId(resourceId)
      .withSuccess(true)
      .withBreakGlass(reason, expiration)
      .withMetadata(metadata || {});

    const event = builder.build();

    auditLogService.log(event).catch((err: Error) => {
      console.error('Failed to log break-glass:', err);
    });
  }

  /**
   * Audita un login
   */
  static auditLogin(
    userId: string,
    tenantId: string,
    role: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): void {
    const mockAuthContext: AuthContext = {
      userId,
      tenantId,
      role: role as any,
      email: '',
      sessionId: '',
      sessionCreatedAt: new Date(),
      requestId: '',
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
      permissions: [],
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,
    };

    const builder = new AuditContextBuilder(
      success ? AuditEventType.AUTH_LOGIN : AuditEventType.AUTH_FAILED,
      mockAuthContext,
      'auth'
    )
      .withAction('LOGIN')
      .withSuccess(success)
      .withIpAddress(ipAddress || '')
      .withUserAgent(userAgent || '');

    const event = builder.build();

    auditLogService.log(event).catch((err: Error) => {
      console.error('Failed to log login:', err);
    });
  }

  /**
   * Audita un logout
   */
  static auditLogout(
    userId: string,
    tenantId: string,
    role: string,
    ipAddress?: string
  ): void {
    const mockAuthContext: AuthContext = {
      userId,
      tenantId,
      role: role as any,
      email: '',
      sessionId: '',
      sessionCreatedAt: new Date(),
      requestId: '',
      ipAddress: ipAddress || '',
      userAgent: '',
      permissions: [],
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,
    };

    const builder = new AuditContextBuilder(
      AuditEventType.AUTH_LOGOUT,
      mockAuthContext,
      'auth'
    )
      .withAction('LOGOUT')
      .withSuccess(true)
      .withIpAddress(ipAddress || '');

    const event = builder.build();

    auditLogService.log(event).catch((err: Error) => {
      console.error('Failed to log logout:', err);
    });
  }

  /**
   * Audita una negación de acceso
   */
  static async auditAccessDenial(
    userId: string,
    tenantId: string,
    userRole: string,
    permission: string,
    resource: string,
    resourceId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO access_denials (
          user_id, tenant_id, permission_requested, user_role,
          resource, resource_id, reason, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const { query: dbQuery } = await import('../../config/database');
      await dbQuery(query, [
        userId,
        tenantId,
        permission,
        userRole,
        resource,
        resourceId || null,
        reason || 'PERMISSION_DENIED',
        ipAddress || null,
        userAgent || null,
      ]);
    } catch (error) {
      console.error('Failed to log access denial:', error);
    }
  }
}
