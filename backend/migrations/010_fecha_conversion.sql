-- Añadir fecha_conversion para saber cuándo un prospecto se convirtió en cliente
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS fecha_conversion TIMESTAMPTZ DEFAULT NULL;

-- Índice para consultas de clientes
CREATE INDEX IF NOT EXISTS idx_prospects_fecha_conversion ON prospects(fecha_conversion) WHERE fecha_conversion IS NOT NULL;
