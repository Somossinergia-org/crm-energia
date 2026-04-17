/**
 * Modelo de Audit Log
 * Servicio para interactuar con la tabla de auditoría
 */

import { query as dbQuery } from '../../config/database';
import { 
  AuditEvent, 
  AuditEventType, 
  AuditSeverity,
  IAuditService 
} from './auditContext';

/**
 * Implementación del servicio de auditoría usando PostgreSQL
 */
export class AuditLogService implements IAuditService {
  /**
   * Registra un evento en el audit log
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      const query = `
        INSERT INTO audit_logs (
          event_type,
          severity,
          action,
          resource,
          resource_id,
          user_id,
          tenant_id,
          user_role,
          ip_address,
          user_agent,
          success,
          reason,
          error,
          is_break_glass_action,
          break_glass_reason,
          break_glass_expiration,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `;

      await dbQuery(query, [
        event.eventType,
        event.severity,
        event.action,
        event.resource,
        event.resourceId || null,
        event.userId,
        event.tenantId,
        event.role,
        event.ipAddress || null,
        event.userAgent || null,
        event.success,
        event.reason || null,
        event.error || null,
        event.isBreakGlassAction || false,
        event.breakGlassReason || null,
        event.breakGlassExpiration || null,
        JSON.stringify(event.metadata || {}),
      ]);

      console.log(`📊 [AUDIT] ${event.eventType} - ${event.resource} - ${event.success ? '✅' : '❌'}`);
    } catch (error) {
      console.error('❌ Failed to log audit event:', error);
      // No rethrow - auditing should never break the application
    }
  }

  /**
   * Encuentra eventos por usuario
   */
  async findByUser(userId: string, limit: number = 100): Promise<AuditEvent[]> {
    const query = `
      SELECT 
        id,
        event_type as "eventType",
        severity,
        action,
        resource,
        resource_id as "resourceId",
        user_id as "userId",
        tenant_id as "tenantId",
        user_role as "role",
        ip_address as "ipAddress",
        user_agent as "userAgent",
        success,
        reason,
        error,
        is_break_glass_action as "isBreakGlassAction",
        break_glass_reason as "breakGlassReason",
        break_glass_expiration as "breakGlassExpiration",
        metadata,
        created_at as "timestamp"
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await dbQuery(query, [userId, limit]);
    return result.rows as AuditEvent[];
  }

  /**
   * Encuentra eventos por recurso
   */
  async findByResource(resource: string, limit: number = 100): Promise<AuditEvent[]> {
    const query = `
      SELECT 
        id,
        event_type as "eventType",
        severity,
        action,
        resource,
        resource_id as "resourceId",
        user_id as "userId",
        tenant_id as "tenantId",
        user_role as "role",
        ip_address as "ipAddress",
        user_agent as "userAgent",
        success,
        reason,
        error,
        is_break_glass_action as "isBreakGlassAction",
        break_glass_reason as "breakGlassReason",
        break_glass_expiration as "breakGlassExpiration",
        metadata,
        created_at as "timestamp"
      FROM audit_logs
      WHERE resource = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await dbQuery(query, [resource, limit]);
    return result.rows as AuditEvent[];
  }

  /**
   * Encuentra eventos por tenant
   */
  async findByTenant(tenantId: string, limit: number = 100): Promise<AuditEvent[]> {
    const query = `
      SELECT 
        id,
        event_type as "eventType",
        severity,
        action,
        resource,
        resource_id as "resourceId",
        user_id as "userId",
        tenant_id as "tenantId",
        user_role as "role",
        ip_address as "ipAddress",
        user_agent as "userAgent",
        success,
        reason,
        error,
        is_break_glass_action as "isBreakGlassAction",
        break_glass_reason as "breakGlassReason",
        break_glass_expiration as "breakGlassExpiration",
        metadata,
        created_at as "timestamp"
      FROM audit_logs
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await dbQuery(query, [tenantId, limit]);
    return result.rows as AuditEvent[];
  }

  /**
   * Encuentra eventos por severidad (para dashboards de seguridad)
   */
  async findBySeverity(
    severity: AuditSeverity,
    limit: number = 100
  ): Promise<AuditEvent[]> {
    const query = `
      SELECT 
        id,
        event_type as "eventType",
        severity,
        action,
        resource,
        resource_id as "resourceId",
        user_id as "userId",
        tenant_id as "tenantId",
        user_role as "role",
        ip_address as "ipAddress",
        user_agent as "userAgent",
        success,
        reason,
        error,
        is_break_glass_action as "isBreakGlassAction",
        break_glass_reason as "breakGlassReason",
        break_glass_expiration as "breakGlassExpiration",
        metadata,
        created_at as "timestamp"
      FROM audit_logs
      WHERE severity = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await dbQuery(query, [severity, limit]);
    return result.rows as AuditEvent[];
  }

  /**
   * Encuentra eventos críticos (break-glass)
   */
  async findBreakGlassActions(limit: number = 100): Promise<AuditEvent[]> {
    const query = `
      SELECT 
        id,
        event_type as "eventType",
        severity,
        action,
        resource,
        resource_id as "resourceId",
        user_id as "userId",
        tenant_id as "tenantId",
        user_role as "role",
        ip_address as "ipAddress",
        user_agent as "userAgent",
        success,
        reason,
        error,
        is_break_glass_action as "isBreakGlassAction",
        break_glass_reason as "breakGlassReason",
        break_glass_expiration as "breakGlassExpiration",
        metadata,
        created_at as "timestamp"
      FROM audit_logs
      WHERE is_break_glass_action = TRUE
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await dbQuery(query, [limit]);
    return result.rows as AuditEvent[];
  }

  /**
   * Encuentra negaciones de acceso
   */
  async findAccessDenials(limit: number = 100): Promise<any[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        tenant_id as "tenantId",
        permission_requested as "permissionRequested",
        user_role as "userRole",
        resource,
        resource_id as "resourceId",
        endpoint,
        method,
        reason,
        ip_address as "ipAddress",
        user_agent as "userAgent",
        created_at as "timestamp"
      FROM access_denials
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await dbQuery(query, [limit]);
    return result.rows;
  }

  /**
   * Estadísticas de auditoría
   */
  async getStats(tenantId?: string): Promise<any> {
    let whereClause = '';
    const params: any[] = [];

    if (tenantId) {
      whereClause = 'WHERE tenant_id = $1';
      params.push(tenantId);
    }

    const query = `
      SELECT
        COUNT(*) as total_events,
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_actions,
        SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as denied_actions,
        SUM(CASE WHEN is_break_glass_action = TRUE THEN 1 ELSE 0 END) as break_glass_actions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT resource) as unique_resources
      FROM audit_logs
      ${whereClause}
    `;

    const result = await dbQuery(query, params);
    return result.rows[0];
  }
}

// Singleton
export const auditLogService = new AuditLogService();
