-- Servicios que ofrece Somos Sinergia por prospecto
CREATE TABLE IF NOT EXISTS prospect_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  servicio VARCHAR(100) NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  -- Datos comunes
  proveedor_actual VARCHAR(200),
  gasto_actual_eur NUMERIC(10,2),
  precio_ofertado_eur NUMERIC(10,2),
  ahorro_estimado_eur NUMERIC(10,2),
  fecha_contratacion DATE,
  fecha_vencimiento DATE,
  -- Datos especificos por servicio (flexible)
  datos JSONB DEFAULT '{}'::jsonb,
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prospect_id, servicio)
);

CREATE INDEX IF NOT EXISTS idx_prospect_servicios_prospect ON prospect_servicios(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_servicios_servicio ON prospect_servicios(servicio);
CREATE INDEX IF NOT EXISTS idx_prospect_servicios_estado ON prospect_servicios(estado);
