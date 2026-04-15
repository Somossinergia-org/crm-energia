-- 012_ai_engine.sql: Motor IA - scoring, insights y memoria vectorial

-- Extensión pgvector (si no está instalada)
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector no disponible, continuando sin ella: %', SQLERRM;
END $$;

-- Scores IA de prospectos
CREATE TABLE IF NOT EXISTS prospect_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  score_total INTEGER DEFAULT 0 CHECK (score_total BETWEEN 0 AND 100),
  score_email INTEGER DEFAULT 0,
  score_energetico INTEGER DEFAULT 0,
  score_actividad INTEGER DEFAULT 0,
  probabilidad_cierre DECIMAL(4,2) DEFAULT 0,
  modelo_version VARCHAR(20) DEFAULT 'v1',
  calculado_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(prospect_id)
);

-- Insights IA de prospectos (briefing de llamada, siguiente paso)
CREATE TABLE IF NOT EXISTS prospect_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  briefing_llamada TEXT,
  sugerencia_siguiente_paso TEXT,
  motivos_interes TEXT[] DEFAULT '{}',
  objeciones_detectadas TEXT[] DEFAULT '{}',
  mejor_hora_contacto TIME,
  resumen_historial TEXT,
  ultima_actualizacion TIMESTAMP DEFAULT NOW(),
  UNIQUE(prospect_id)
);

-- Memoria vectorial semántica
CREATE TABLE IF NOT EXISTS memory_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL,
  contenido TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Logs de acciones del agente IA
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  prospect_id UUID REFERENCES prospects(id),
  accion VARCHAR(100) NOT NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  tokens_usados INTEGER DEFAULT 0,
  duracion_ms INTEGER DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'ok',
  error_msg TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prospect_scores_prospect ON prospect_scores(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_ai_insights_prospect ON prospect_ai_insights(prospect_id);
CREATE INDEX IF NOT EXISTS idx_memory_sources_user ON memory_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_sources_prospect ON memory_sources(prospect_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user ON agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_prospect ON agent_logs(prospect_id);
