-- Migration 014: Audit trail table for security logging
-- Logs all sensitive actions and permission denials

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Evento
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'INFO', -- INFO, WARNING, ERROR, CRITICAL
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  
  -- Usuario y tenant
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_role VARCHAR(50) NOT NULL,
  
  -- Contexto
  ip_address INET,
  user_agent TEXT,
  
  -- Resultado
  success BOOLEAN NOT NULL,
  reason TEXT,
  error TEXT,
  
  -- Break-glass
  is_break_glass_action BOOLEAN DEFAULT FALSE,
  break_glass_reason TEXT,
  break_glass_expiration TIMESTAMP,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para búsquedas rápidas
  CONSTRAINT audit_logs_severity_check CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL'))
);

-- Índices para queries comunes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type, created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id, created_at DESC);
CREATE INDEX idx_audit_logs_break_glass ON audit_logs(is_break_glass_action, created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Tabla de sesiones para rastrear break-glass
CREATE TABLE break_glass_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Detalles de la sesión
  reason TEXT NOT NULL,
  scope VARCHAR(255) NOT NULL, -- "FULL", "TENANT_ADMIN", "SPECIFIC_RESOURCE"
  scope_details JSONB, -- {"resource": "users", "resourceId": "..."}
  
  -- Validación
  requires_confirmation BOOLEAN DEFAULT TRUE,
  requires_reauth BOOLEAN DEFAULT TRUE,
  confirmed_at TIMESTAMP,
  reauth_at TIMESTAMP,
  
  -- Validez
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  
  CONSTRAINT break_glass_scope_check CHECK (scope IN ('FULL', 'TENANT_ADMIN', 'SPECIFIC_RESOURCE')),
  CONSTRAINT break_glass_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX idx_break_glass_sessions_user ON break_glass_sessions(user_id, expires_at DESC);
CREATE INDEX idx_break_glass_sessions_active ON break_glass_sessions(expires_at) 
  WHERE revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP;

-- Tabla de negaciones para análisis de intentos fallidos
CREATE TABLE access_denials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Qué se intentó
  permission_requested VARCHAR(100) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  
  -- Contexto
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  endpoint VARCHAR(255),
  method VARCHAR(10), -- GET, POST, etc
  
  -- Razón de denegación
  reason VARCHAR(100) NOT NULL, -- ROLE_MISMATCH, TENANT_MISMATCH, PERMISSION_DENIED, etc
  
  -- Contexto
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_denials_user ON access_denials(user_id, created_at DESC);
CREATE INDEX idx_access_denials_permission ON access_denials(permission_requested, created_at DESC);
CREATE INDEX idx_access_denials_reason ON access_denials(reason, created_at DESC);
CREATE INDEX idx_access_denials_ip ON access_denials(ip_address, created_at DESC);

-- Comentarios
COMMENT ON TABLE audit_logs IS 'Central audit log for all security-relevant actions. NEVER TRUNCATE. Required for compliance and security investigations.';
COMMENT ON TABLE break_glass_sessions IS 'Tracks break-glass (emergency escalation) sessions. Must have expiration and confirmation.';
COMMENT ON TABLE access_denials IS 'Logs access denial attempts for security monitoring and anomaly detection.';
