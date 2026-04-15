-- Visitas programadas (agenda)
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT DEFAULT '',
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  duracion_minutos INTEGER DEFAULT 20,

  -- Estado de la visita
  estado VARCHAR(20) DEFAULT 'programada'
    CHECK (estado IN ('programada','en_curso','completada','cancelada','reagendada')),

  -- Resultado (después de completar)
  resultado VARCHAR(20),
  notas_resultado TEXT DEFAULT '',

  -- Ubicación
  direccion TEXT DEFAULT '',
  coordenadas_lat DECIMAL(10, 7),
  coordenadas_lng DECIMAL(10, 7),

  -- Orden en la ruta del día
  orden_ruta INTEGER DEFAULT 0,

  color VARCHAR(7) DEFAULT '#3b82f6',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_user ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_prospect ON visits(prospect_id);
CREATE INDEX IF NOT EXISTS idx_visits_fecha ON visits(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_visits_estado ON visits(estado);
