-- Tabla de zonas geográficas
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT DEFAULT '',
  color VARCHAR(7) DEFAULT '#3b82f6',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_nombre ON zones(nombre);
