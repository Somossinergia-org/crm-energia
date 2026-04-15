-- Tabla de sesiones (refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT false,
  user_agent TEXT DEFAULT '',
  ip_address VARCHAR(45) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON sessions(revoked);
