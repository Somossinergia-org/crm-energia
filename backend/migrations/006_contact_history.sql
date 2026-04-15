-- Historial de contactos / interacciones con prospectos
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Tipo de interacción
  tipo VARCHAR(30) NOT NULL
    CHECK (tipo IN ('llamada','visita_presencial','whatsapp',
                    'email_enviado','email_recibido','nota_interna',
                    'cambio_estado','oferta_enviada','contrato')),

  -- Resultado
  resultado VARCHAR(20) DEFAULT 'neutro'
    CHECK (resultado IN ('positivo','neutro','negativo','no_contesto','buzon')),

  -- Detalles
  nota TEXT DEFAULT '',
  duracion_minutos INTEGER,
  estado_anterior VARCHAR(30),
  estado_nuevo VARCHAR(30),

  -- Próxima acción
  proxima_accion TEXT DEFAULT '',
  fecha_proxima_accion TIMESTAMP WITH TIME ZONE,

  -- Adjuntos
  adjuntos TEXT[] DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_history_prospect ON contact_history(prospect_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_user ON contact_history(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_tipo ON contact_history(tipo);
CREATE INDEX IF NOT EXISTS idx_contact_history_created ON contact_history(created_at DESC);
