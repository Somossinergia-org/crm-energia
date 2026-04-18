-- =====================================================
-- Migration 014: Performance indexes and constraints
-- Adds composite indexes for common query patterns
-- and missing CHECK constraints for data integrity
-- =====================================================

-- ── Composite indexes for frequent JOIN/filter patterns ──

-- Prospects: servicios JOIN filtered by estado (used in /clients endpoint)
CREATE INDEX IF NOT EXISTS idx_prospect_servicios_prospect_estado
  ON prospect_servicios(prospect_id, estado);

-- Visits: user + date range (calendar views, daily agenda)
CREATE INDEX IF NOT EXISTS idx_visits_user_fecha
  ON visits(user_id, fecha_inicio DESC);

-- Contact history: user + date (today's activity count)
CREATE INDEX IF NOT EXISTS idx_contact_history_user_created
  ON contact_history(user_id, created_at DESC);

-- Emails sent: account + date (inbox view, recent sent)
CREATE INDEX IF NOT EXISTS idx_emails_enviados_account_fecha
  ON emails_enviados(account_id, enviado_at DESC);

-- Email queue: user + status (per-user queue view)
CREATE INDEX IF NOT EXISTS idx_email_queue_user_estado
  ON email_queue(user_id, estado);

-- Prospects: multi-column for search queries
-- (supports ILIKE on nombre_negocio, nombre_contacto, email_principal)
CREATE INDEX IF NOT EXISTS idx_prospects_codigo_postal
  ON prospects(codigo_postal);

CREATE INDEX IF NOT EXISTS idx_prospects_municipio
  ON prospects(municipio);

-- ── Full-text search index (Spanish) for prospect search ──
CREATE INDEX IF NOT EXISTS idx_prospects_fulltext
  ON prospects USING GIN(
    to_tsvector('spanish',
      COALESCE(nombre_negocio, '') || ' ' ||
      COALESCE(nombre_contacto, '') || ' ' ||
      COALESCE(email_principal, '') || ' ' ||
      COALESCE(municipio, '') || ' ' ||
      COALESCE(telefono_movil, '')
    )
  );

-- ── CHECK constraints for data integrity ──

-- Prospects: numeric fields must be non-negative
DO $$ BEGIN
  ALTER TABLE prospects ADD CONSTRAINT chk_prospects_potencia_p1
    CHECK (potencia_p1_kw IS NULL OR potencia_p1_kw >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE prospects ADD CONSTRAINT chk_prospects_potencia_p2
    CHECK (potencia_p2_kw IS NULL OR potencia_p2_kw >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE prospects ADD CONSTRAINT chk_prospects_potencia_p3
    CHECK (potencia_p3_kw IS NULL OR potencia_p3_kw >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE prospects ADD CONSTRAINT chk_prospects_consumo_anual
    CHECK (consumo_anual_kwh IS NULL OR consumo_anual_kwh >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE prospects ADD CONSTRAINT chk_prospects_gasto_mensual
    CHECK (gasto_mensual_estimado_eur IS NULL OR gasto_mensual_estimado_eur >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE prospects ADD CONSTRAINT chk_prospects_ahorro_porcentaje
    CHECK (ahorro_porcentaje IS NULL OR (ahorro_porcentaje >= 0 AND ahorro_porcentaje <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Visits: duration must be positive
DO $$ BEGIN
  ALTER TABLE visits ADD CONSTRAINT chk_visits_duracion
    CHECK (duracion_minutos IS NULL OR duracion_minutos > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Prospect scores: score range 0-100
DO $$ BEGIN
  ALTER TABLE prospect_scores ADD CONSTRAINT chk_scores_total_range
    CHECK (score_total >= 0 AND score_total <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE prospect_scores ADD CONSTRAINT chk_scores_email_range
    CHECK (score_email IS NULL OR (score_email >= 0 AND score_email <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE prospect_scores ADD CONSTRAINT chk_scores_energetico_range
    CHECK (score_energetico IS NULL OR (score_energetico >= 0 AND score_energetico <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE prospect_scores ADD CONSTRAINT chk_scores_actividad_range
    CHECK (score_actividad IS NULL OR (score_actividad >= 0 AND score_actividad <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
