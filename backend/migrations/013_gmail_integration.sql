-- 013_gmail_integration.sql

-- Cuentas Gmail vinculadas (OAuth por usuario)
CREATE TABLE IF NOT EXISTS email_accounts_gmail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gmail_address VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP,
  activa BOOLEAN DEFAULT true,
  ultima_sync TIMESTAMP,
  historial_dias INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, gmail_address)
);

-- Emails recibidos sincronizados desde Gmail
CREATE TABLE IF NOT EXISTS emails_recibidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts_gmail(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  gmail_message_id VARCHAR(255) NOT NULL,
  gmail_thread_id VARCHAR(255),
  de_email VARCHAR(255) NOT NULL,
  de_nombre VARCHAR(255),
  asunto VARCHAR(500),
  extracto TEXT,
  cuerpo_texto TEXT,
  cuerpo_html TEXT,
  tiene_adjuntos BOOLEAN DEFAULT false,
  adjuntos JSONB DEFAULT '[]',
  categoria_ia VARCHAR(50),
  resumen_ia TEXT,
  sentimiento VARCHAR(20),
  leido BOOLEAN DEFAULT false,
  archivado BOOLEAN DEFAULT false,
  recibido_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, gmail_message_id)
);

-- Cola de envíos robusta (BullMQ + PostgreSQL como backup)
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(30) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  prospect_id UUID REFERENCES prospects(id),
  para_email VARCHAR(255) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  cuerpo_html TEXT NOT NULL,
  account_id UUID,
  referencia_id UUID,
  estado VARCHAR(20) DEFAULT 'pendiente',
  intentos INTEGER DEFAULT 0,
  programado_para TIMESTAMP NOT NULL DEFAULT NOW(),
  procesado_at TIMESTAMP,
  error_mensaje TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Opt-out / Bajas de email (LOPD)
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  token VARCHAR(100) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  motivo VARCHAR(255),
  unsubscribed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_emails_recibidos_account ON emails_recibidos(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_recibidos_prospect ON emails_recibidos(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emails_recibidos_thread ON emails_recibidos(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_recibidos_leido ON emails_recibidos(leido);
CREATE INDEX IF NOT EXISTS idx_email_queue_estado ON email_queue(estado, programado_para);
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_user ON email_accounts_gmail(user_id);
