-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  cuerpo_html TEXT NOT NULL,
  cuerpo_texto TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  categoria VARCHAR(100) DEFAULT 'general',
  activa BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email accounts (SMTP config per user)
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(300) NOT NULL,
  smtp_host VARCHAR(300) NOT NULL,
  smtp_port INTEGER DEFAULT 587,
  smtp_user VARCHAR(300) NOT NULL,
  smtp_pass_encrypted TEXT NOT NULL,
  from_name VARCHAR(200),
  firma_html TEXT,
  activa BOOLEAN DEFAULT true,
  ultimo_envio TIMESTAMPTZ,
  envios_hoy INTEGER DEFAULT 0,
  limite_diario INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Email campaigns (bulk sends) - must be before emails_enviados
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(300) NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  asunto VARCHAR(500),
  filtros JSONB DEFAULT '{}'::jsonb,
  estado VARCHAR(50) DEFAULT 'borrador',
  total_destinatarios INTEGER DEFAULT 0,
  enviados INTEGER DEFAULT 0,
  abiertos INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  rebotes INTEGER DEFAULT 0,
  programado_para TIMESTAMPTZ,
  iniciado_at TIMESTAMPTZ,
  completado_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual emails sent
CREATE TABLE IF NOT EXISTS emails_enviados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES email_accounts(id),
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  de_email VARCHAR(300) NOT NULL,
  para_email VARCHAR(300) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  cuerpo_html TEXT NOT NULL,
  cuerpo_texto TEXT,
  estado VARCHAR(50) DEFAULT 'enviado',
  message_id VARCHAR(500),
  abierto BOOLEAN DEFAULT false,
  fecha_apertura TIMESTAMPTZ,
  num_aperturas INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  rebotado BOOLEAN DEFAULT false,
  error_mensaje TEXT,
  enviado_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email tracking pixels & click tracking
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails_enviados(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  url TEXT,
  ip VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drip sequences
CREATE TABLE IF NOT EXISTS email_secuencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(300) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_secuencia_pasos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secuencia_id UUID NOT NULL REFERENCES email_secuencias(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  template_id UUID NOT NULL REFERENCES email_templates(id),
  dias_espera INTEGER DEFAULT 1,
  condicion VARCHAR(100) DEFAULT 'siempre',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_secuencia_inscritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secuencia_id UUID NOT NULL REFERENCES email_secuencias(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  paso_actual INTEGER DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'activo',
  proximo_envio TIMESTAMPTZ,
  inscrito_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(secuencia_id, prospect_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emails_enviados_prospect ON emails_enviados(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emails_enviados_campaign ON emails_enviados(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_enviados_estado ON emails_enviados(estado);
CREATE INDEX IF NOT EXISTS idx_emails_enviados_fecha ON emails_enviados(enviado_at);
CREATE INDEX IF NOT EXISTS idx_email_tracking_email ON email_tracking(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_tipo ON email_tracking(tipo);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_estado ON email_campaigns(estado);
CREATE INDEX IF NOT EXISTS idx_email_secuencia_inscritos_proximo ON email_secuencia_inscritos(proximo_envio) WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_email_accounts_user ON email_accounts(user_id);
