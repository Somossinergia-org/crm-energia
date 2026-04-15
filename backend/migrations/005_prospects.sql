-- Tabla principal de prospectos
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificación
  nombre_negocio VARCHAR(255) NOT NULL,
  nombre_contacto VARCHAR(255) DEFAULT '',
  categoria VARCHAR(50) DEFAULT 'otro',
  subcategoria VARCHAR(100) DEFAULT '',
  zona_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  codigo_cnae VARCHAR(10) DEFAULT '',

  -- Contacto
  telefono_fijo VARCHAR(20) DEFAULT '',
  telefono_movil VARCHAR(20) DEFAULT '',
  whatsapp VARCHAR(20) DEFAULT '',
  email_principal VARCHAR(255) DEFAULT '',
  email_secundario VARCHAR(255) DEFAULT '',
  web VARCHAR(500) DEFAULT '',
  instagram VARCHAR(100) DEFAULT '',
  facebook VARCHAR(100) DEFAULT '',
  direccion_completa TEXT DEFAULT '',
  codigo_postal VARCHAR(10) DEFAULT '',
  municipio VARCHAR(100) DEFAULT '',
  provincia VARCHAR(100) DEFAULT '',
  coordenadas_lat DECIMAL(10, 7),
  coordenadas_lng DECIMAL(10, 7),

  -- Datos energéticos
  comercializadora_actual VARCHAR(100) DEFAULT '',
  tarifa_actual VARCHAR(10) DEFAULT '',
  potencia_p1_kw DECIMAL(10, 2),
  potencia_p2_kw DECIMAL(10, 2),
  potencia_p3_kw DECIMAL(10, 2),
  consumo_anual_kwh DECIMAL(12, 2),
  gasto_mensual_estimado_eur DECIMAL(10, 2),
  cups VARCHAR(25) DEFAULT '',
  fecha_vencimiento_contrato DATE,
  ahorro_estimado_eur DECIMAL(10, 2),
  ahorro_porcentaje DECIMAL(5, 2),

  -- Seguimiento
  estado VARCHAR(30) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','llamado','contactado','interesado',
                      'oferta_enviada','negociacion','contrato_firmado',
                      'rechazado','volver_llamar','perdido')),
  prioridad VARCHAR(10) DEFAULT 'media'
    CHECK (prioridad IN ('alta','media','baja')),
  temperatura VARCHAR(10) DEFAULT 'frio'
    CHECK (temperatura IN ('frio','tibio','caliente')),
  asignado_a UUID REFERENCES users(id) ON DELETE SET NULL,
  fecha_primer_contacto TIMESTAMP WITH TIME ZONE,
  fecha_ultimo_contacto TIMESTAMP WITH TIME ZONE,
  fecha_proximo_contacto TIMESTAMP WITH TIME ZONE,
  numero_intentos_contacto INTEGER DEFAULT 0,
  num_emails_enviados INTEGER DEFAULT 0,
  num_emails_abiertos INTEGER DEFAULT 0,
  num_emails_clicked INTEGER DEFAULT 0,

  -- Oferta
  oferta_generada BOOLEAN DEFAULT false,
  oferta_url TEXT DEFAULT '',
  oferta_enviada_en TIMESTAMP WITH TIME ZONE,
  oferta_vista_en TIMESTAMP WITH TIME ZONE,
  oferta_aceptada_en TIMESTAMP WITH TIME ZONE,
  precio_ofertado_eur DECIMAL(10, 2),
  margen_estimado_eur DECIMAL(10, 2),

  -- Metadata
  fuente VARCHAR(30) DEFAULT 'manual'
    CHECK (fuente IN ('manual','csv_importado','google_places','referido')),
  rating_google DECIMAL(2, 1),
  num_reviews_google INTEGER DEFAULT 0,
  etiquetas TEXT[] DEFAULT '{}',
  notas_internas TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_prospects_estado ON prospects(estado);
CREATE INDEX IF NOT EXISTS idx_prospects_zona ON prospects(zona_id);
CREATE INDEX IF NOT EXISTS idx_prospects_asignado ON prospects(asignado_a);
CREATE INDEX IF NOT EXISTS idx_prospects_categoria ON prospects(categoria);
CREATE INDEX IF NOT EXISTS idx_prospects_prioridad ON prospects(prioridad);
CREATE INDEX IF NOT EXISTS idx_prospects_temperatura ON prospects(temperatura);
CREATE INDEX IF NOT EXISTS idx_prospects_provincia ON prospects(provincia);
CREATE INDEX IF NOT EXISTS idx_prospects_nombre ON prospects(nombre_negocio);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email_principal);
CREATE INDEX IF NOT EXISTS idx_prospects_created ON prospects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_proximo_contacto ON prospects(fecha_proximo_contacto);
CREATE INDEX IF NOT EXISTS idx_prospects_fuente ON prospects(fuente);
