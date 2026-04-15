CREATE TABLE IF NOT EXISTS prospect_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- contrato, factura, oferta, dni, otro
  archivo_url VARCHAR(500) NOT NULL,
  archivo_nombre VARCHAR(255) NOT NULL,
  archivo_size INTEGER NOT NULL DEFAULT 0,
  archivo_mime VARCHAR(100),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_prospect ON prospect_documents(prospect_id);
CREATE INDEX idx_documents_tipo ON prospect_documents(tipo);
