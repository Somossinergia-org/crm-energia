# 🔥 PLAN DE FUSIÓN: CRM Energía + Sinergia Mail
## "CRM Energía Intelligence" — La plataforma comercial más potente del sector energético español

> Fecha: Abril 2026  
> Estado: APROBADO PARA IMPLEMENTACIÓN  
> Prioridad: MÁXIMA

---

## 🎯 VISIÓN

Fusionar el CRM Energía (gestión de prospectos, visitas, pipeline) con Sinergia Mail (IA Gemini, Gmail sync, extracción de facturas, agente conversacional, memoria vectorial) para crear **una única plataforma inteligente** donde un comercial de energía pueda:

- 📧 Ver y gestionar **todos sus emails de clientes** sin salir del CRM
- 🤖 Pedir al **agente IA** "prepara una oferta para el cliente X basada en su última factura"
- 🧾 Subir una factura PDF y que el sistema **extraiga automáticamente** CUPS, tarifa, consumos y ahorro potencial
- 🎯 Ver el **score de probabilidad de cierre** de cada prospecto calculado por IA
- 📅 Recibir cada mañana un **briefing inteligente** con los clientes urgentes del día
- 💬 Hablar con el agente por **voz o texto** para ejecutar acciones sin tocar el teclado

---

## 🏗️ ARQUITECTURA DE FUSIÓN

```
┌─────────────────────────────────────────────────────────────┐
│                    CRM ENERGÍA INTELLIGENCE                   │
├─────────────────┬───────────────────┬───────────────────────┤
│   CRM CORE      │   MAIL ENGINE     │    IA ENGINE          │
│  (Express/PG)   │  (Gmail API)      │   (Gemini 2.5)        │
│                 │                   │                       │
│  • Prospectos   │  • Sync automático│  • Agente 28 tools    │
│  • Pipeline     │  • Inbox entrante │  • Scoring prospectos │
│  • Visitas      │  • Envíos + drip  │  • Extracción PDF     │
│  • Servicios    │  • Campañas       │  • Briefing diario    │
│  • Calculadora  │  • Tracking       │  • Memoria vectorial  │
│  • Documentos   │  • Multi-cuenta   │  • Chat con voz       │
└─────────────────┴───────────────────┴───────────────────────┘
         │                  │                    │
         └──────────────────┴────────────────────┘
                            │
              PostgreSQL + Redis + pgvector
```

---

## 📦 LO QUE SE IMPORTA DE SINERGIA-MAIL

| Módulo | Archivos clave | Adaptación necesaria |
|--------|---------------|----------------------|
| **Gmail sync multi-cuenta** | `src/lib/gmail.ts` | Cambiar NextAuth → JWT del CRM |
| **Motor Gemini IA** | `src/lib/gemini.ts` | Copiar tal cual, añadir `extractEnergyBill()` |
| **28 tools del agente** | `src/lib/agent/tools.ts` | Añadir 8 tools energéticas nuevas |
| **Prompts en español** | `src/lib/prompts.ts` | Reescribir con contexto energético |
| **Briefing diario** | `src/app/api/agent/briefing/route.ts` | Portar a Express, añadir KPIs pipeline |
| **Extracción PDF** | `src/app/api/agent/invoice-pdf-extract/route.ts` | Fusionar con billParser.controller.ts existente |
| **Memoria vectorial** | `src/db/schema.ts` (memorySources) | Nueva migración con pgvector |
| **Chat UI** | `src/components/AgentChat.tsx` | Portar a React + adaptar al design system |
| **Reglas automáticas** | `src/lib/agent/applyRules.ts` | Copiar con adaptación a prospectos |

---

## 🗺️ FASES DE IMPLEMENTACIÓN

---

### FASE A — Base IA (2 semanas)
**Objetivo:** El CRM tiene cerebro. Gemini integrado, memoria vectorial y scoring.

#### Backend
- [ ] Instalar `@google/generative-ai`, `pgvector`, `bullmq`
- [ ] Migración `012_ai_engine.sql`:
  - `prospect_scores` — score total/email/energético/actividad
  - `prospect_ai_insights` — briefing, siguiente paso, probabilidad cierre
  - `memory_sources` — vector(768) para búsqueda semántica
  - `agent_logs` — auditoría de todas las acciones IA
- [ ] `src/services/gemini.service.ts` — Motor IA centralizado:
  - `categorizeEmail()` — 10 categorías energéticas
  - `generateEmailDraft()` — borrador personalizado con datos prospecto
  - `extractEnergyBill()` — fusión billParser + Gemini Vision
  - `scoreLead()` — puntuación 0-100 basada en datos + comportamiento
  - `generateCallBriefing()` — resumen de 3 párrafos para llamada
  - `chat()` — conversación con historial
- [ ] `src/services/memory.service.ts` — Memoria vectorial con pgvector
- [ ] `GET /api/ai/briefing` — Briefing diario del comercial
- [ ] `POST /api/ai/prospects/:id/score` — Recalcular score
- [ ] `GET /api/ai/prospects/:id/briefing` — Briefing de llamada
- [ ] `POST /api/ai/generate-email` — Generar email con IA

#### Frontend
- [ ] **Nuevo componente `ScoreBadge`** — pill de color en cada prospecto (🔴🟡🟢)
- [ ] **Dashboard: "Buenos días" widget** — briefing IA con alertas del día
- [ ] **ProspectDetail: Tab "Asistente IA"** — briefing de llamada + siguiente paso sugerido

---

### FASE B — Gmail Integration (2 semanas)
**Objetivo:** El CRM lee y escribe emails de Gmail. Inbox centralizado.

#### Backend
- [ ] Instalar `googleapis`
- [ ] Migración `013_gmail_integration.sql`:
  - `email_accounts_gmail` — OAuth tokens multi-cuenta
  - `emails_recibidos` — inbox sincronizado con clasificación IA
  - `email_threads` — hilo completo por prospecto
  - `email_unsubscribes` — LOPD compliance
  - `email_queue` — cola BullMQ para envíos robustos
- [ ] `src/services/gmail.service.ts` — Sync, lectura, envío, adjuntos
- [ ] `src/services/emailQueue.service.ts` — Cola Redis/BullMQ para campañas
- [ ] Worker BullMQ que procesa:
  - Pasos de secuencias drip automáticamente
  - Campañas programadas
  - Categorización IA de emails entrantes
  - Extracción automática de facturas recibidas
- [ ] `GET /api/email/inbox` — Emails recibidos con threading
- [ ] `POST /api/email/sync` — Sincronización manual + auto-matching a prospectos
- [ ] `GET /api/email/threads/:prospectId` — Conversación completa
- [ ] `GET /api/email/unsubscribe/:token` — Endpoint público opt-out

#### Frontend
- [ ] **Nueva página `/emails/inbox`** — Inbox integrado con clasificación IA
- [ ] **ProspectDetail: Tab "Conversación"** — hilo email completo del prospecto
- [ ] **Redactar email**: botón "✨ Generar con IA" — genera asunto + cuerpo automáticamente

---

### FASE C — Agente Conversacional (1 semana)
**Objetivo:** Chat de voz/texto con 36 tools. El comercial habla, el CRM actúa.

#### Backend
- [ ] `src/services/agent.service.ts` — 36 tools (28 base + 8 nuevas):
  - `get_pipeline_summary` — resumen del pipeline por etapa
  - `find_prospects_by_criteria` — buscar por zona/tarifa/ahorro/CNAE
  - `get_prospect_full_profile` — datos completos + historial email + docs
  - `create_visit` — agendar visita con Google Calendar
  - `generate_proposal` — crear propuesta de ahorro con datos del prospecto
  - `extract_bill_from_email` — extraer datos de factura de email adjunto
  - `bulk_score_prospects` — recalcular scores de toda la zona
  - `get_energy_market_context` — contexto de precios de mercado
- [ ] `POST /api/agent/chat` — Chat con historial y function calling
- [ ] `POST /api/agent/execute` — Ejecutar acción específica

#### Frontend
- [ ] **`AgentPanel` flotante** — botón ⚡ en esquina inferior derecha siempre visible
- [ ] **Chat con voz** — Web Speech API para dictar (ideal en visitas)
- [ ] **Acciones rápidas del agente**:
  - "📋 Briefing del día" — resumen matutino
  - "🎯 ¿Con quién llamo hoy?" — prioridades del día
  - "📧 Redacta un follow-up para [prospecto]"
  - "📊 ¿Cómo va el pipeline esta semana?"

---

### FASE D — Extracción IA de Facturas (1 semana)
**Objetivo:** Subir cualquier factura eléctrica (PDF, foto, email) → datos estructurados en 3 segundos.

#### Backend
- [ ] Fusionar `billParser.controller.ts` (reglas regex) + `gemini.extractEnergyBill()` (IA):
  - Primero intenta extracción por regex (rápida, sin coste)
  - Si confianza < 85% → fallback a Gemini Vision
  - Si hay imagen (foto de factura) → siempre Gemini Vision multimodal
- [ ] Soporte formatos:
  - ✅ Naturgy 2.0TD (ya funciona, regex)
  - ✅ Enérgya VM 6.1TD (ya funciona, regex)
  - 🆕 Endesa/Iberdrola/EDP/Repsol → Gemini Vision
  - 🆕 Foto con móvil → Gemini Vision multimodal
- [ ] `POST /api/bill/extract-photo` — Subir foto y extraer con IA
- [ ] `POST /api/bill/extract-email` — Extraer de adjunto de email Gmail

#### Frontend
- [ ] **Upload drag & drop mejorado** — preview + indicador de confianza
- [ ] **"Fotografiar factura"** — captura de cámara en móvil para visitas in situ
- [ ] **Auto-relleno en Calculadora** — factura extraída → campos de calculadora automáticos

---

### FASE E — Dashboard Intelligence + Reportes Avanzados (1 semana)
**Objetivo:** El dashboard habla. KPIs en tiempo real, predicciones y alertas proactivas.

#### Widgets nuevos en Dashboard
- [ ] **"Briefing del día"** — widget matutino con alertas IA prioridad alta
- [ ] **"Radar de oportunidades"** — prospectos con score > 70 sin contacto en 7+ días
- [ ] **"Predicción de cierre"** — prospectos con probabilidad > 60% para este mes
- [ ] **"Ahorro total generado"** — suma de ahorro de todos los clientes convertidos
- [ ] **Heatmap de actividad** — visitas/emails/llamadas por hora del día y día de semana
- [ ] **"Siguiente mejor acción"** — IA sugiere los 3 prospectos a contactar HOY

#### Reportes exportables
- [ ] **Excel con todos los KPIs** — exportación con `exceljs`
- [ ] **Informe PDF semanal** — generado por IA en Markdown → PDF con Puppeteer
- [ ] **Reporte de ahorro energético** — por cliente, por zona, por comercializadora

---

## 🗄️ MIGRACIONES DE BASE DE DATOS

```sql
-- 012_ai_engine.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE prospect_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE UNIQUE,
  score_total INTEGER DEFAULT 0 CHECK (score_total BETWEEN 0 AND 100),
  score_email INTEGER DEFAULT 0,
  score_energetico INTEGER DEFAULT 0,
  score_actividad INTEGER DEFAULT 0,
  probabilidad_cierre DECIMAL(4,2),
  modelo_version VARCHAR(20) DEFAULT 'v1',
  calculado_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prospect_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE UNIQUE,
  briefing_llamada TEXT,
  sugerencia_siguiente_paso TEXT,
  motivos_interes TEXT[],
  objeciones_detectadas TEXT[],
  mejor_hora_contacto TIME,
  resumen_historial TEXT,
  ultima_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memory_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL, -- 'email'|'factura'|'nota'|'documento'|'visita'
  contenido TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON memory_sources USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  prospect_id UUID REFERENCES prospects(id),
  accion VARCHAR(100) NOT NULL,
  input JSONB,
  output JSONB,
  tokens_usados INTEGER,
  duracion_ms INTEGER,
  estado VARCHAR(20) DEFAULT 'ok', -- 'ok'|'error'
  error_msg TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 013_gmail_integration.sql
CREATE TABLE email_accounts_gmail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  gmail_address VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP,
  activa BOOLEAN DEFAULT true,
  ultima_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE emails_recibidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts_gmail(id),
  prospect_id UUID REFERENCES prospects(id),
  gmail_message_id VARCHAR(255) UNIQUE NOT NULL,
  gmail_thread_id VARCHAR(255),
  de_email VARCHAR(255) NOT NULL,
  de_nombre VARCHAR(255),
  asunto VARCHAR(500),
  extracto TEXT,
  cuerpo_texto TEXT,
  cuerpo_html TEXT,
  tiene_adjuntos BOOLEAN DEFAULT false,
  adjuntos JSONB DEFAULT '[]',
  categoria_ia VARCHAR(50),
  resumen_ia TEXT,
  sentimiento VARCHAR(20),
  accion_requerida VARCHAR(100),
  leido BOOLEAN DEFAULT false,
  archivado BOOLEAN DEFAULT false,
  recibido_at TIMESTAMP NOT NULL,
  procesado_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON emails_recibidos(prospect_id);
CREATE INDEX ON emails_recibidos(gmail_thread_id);

CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(30) NOT NULL, -- 'secuencia'|'campaña'|'individual'|'follow_up_ia'
  user_id UUID NOT NULL REFERENCES users(id),
  prospect_id UUID REFERENCES prospects(id),
  para_email VARCHAR(255) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  cuerpo_html TEXT NOT NULL,
  account_id UUID,
  referencia_id UUID,
  estado VARCHAR(20) DEFAULT 'pendiente',
  intentos INTEGER DEFAULT 0,
  programado_para TIMESTAMP NOT NULL DEFAULT NOW(),
  procesado_at TIMESTAMP,
  error_mensaje TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON email_queue(estado, programado_para);

CREATE TABLE email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  prospect_id UUID REFERENCES prospects(id),
  token VARCHAR(100) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  motivo VARCHAR(255),
  unsubscribed_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚡ NUEVAS DEPENDENCIAS

### Backend (`backend/package.json`)
```json
{
  "@google/generative-ai": "^0.21.0",
  "googleapis": "^140.0.0",
  "bullmq": "^5.0.0",
  "pgvector": "^0.2.0",
  "exceljs": "^4.4.0",
  "sharp": "^0.33.0"
}
```

### Frontend (`frontend/package.json`)
```json
{
  "socket.io-client": "^4.7.0",
  "@tiptap/react": "^2.4.0",
  "@tiptap/starter-kit": "^2.4.0"
}
```

---

## 🎨 NUEVAS PÁGINAS / COMPONENTES UI

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/emails/inbox` | `InboxPage` | Inbox unificado con threading |
| `/agente` | `AgentPage` | Chat full-screen con el agente |
| — (flotante) | `AgentPanel` | Chat flotante en todas las páginas |
| `/pipeline/:id` tab | `ProspectAITab` | Briefing IA + score + siguiente paso |
| `/pipeline/:id` tab | `ConversacionTab` | Hilo email completo del prospecto |
| `/dashboard` widget | `BriefingWidget` | Resumen matutino IA |
| `/dashboard` widget | `RadarOportunidades` | Prospectos calientes sin contactar |

---

## 📊 KPIs DE ÉXITO

| Métrica | Hoy | Objetivo tras fusión |
|---------|-----|---------------------|
| Tiempo medio para cualificar un lead | ~15 min | < 2 min (IA hace el briefing) |
| % facturas extraídas automáticamente | 2 formatos | > 95% de cualquier factura española |
| Emails gestionados desde CRM | 0% | 100% |
| Prospectos con score calculado | 0% | 100% en tiempo real |
| Follow-ups enviados puntualmente | ~60% | > 95% (drip automático) |
| Tiempo para generar propuesta | ~30 min | < 3 min (IA + calculadora) |

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

```
Semana 1-2:  FASE A — Motor IA + Scoring                  ← IMPACTO INMEDIATO VISIBLE
Semana 3-4:  FASE B — Gmail Integration + Inbox           ← FEATURE MÁS DEMANDADA
Semana 5:    FASE C — Agente Conversacional               ← WOW FACTOR
Semana 6:    FASE D — Extracción IA Facturas v2           ← DIFERENCIADOR SECTORIAL
Semana 7:    FASE E — Dashboard Intelligence              ← CIERRE PERFECTO
```

---

## 💡 EL RESULTADO FINAL

Un comercial de energía se sienta por la mañana, abre el CRM y:

1. Ve un **"Buenos días, tienes 3 clientes urgentes"** con resumen IA de cada uno
2. Hace clic en un prospecto → ve automáticamente **toda la conversación de email**, el **score de probabilidad de cierre** y la **sugerencia de siguiente acción**
3. Dice por micrófono: *"Prepara un email de seguimiento para Panadería García basado en su factura de Naturgy"* → el agente lee la factura, calcula el ahorro y **genera el email en 4 segundos**
4. En una visita, fotografía una factura con el móvil → el CRM **extrae todos los datos automáticamente** y rellena la calculadora de ahorro
5. Al final del día, exporta un **informe PDF** con todos los KPIs generado por IA

**Esto no existe en ningún CRM del mercado energético español.**

---

*Plan elaborado tras análisis profundo de sinergia-mail (14 tablas, 28 tools, Gemini 2.5 Flash) y crm-energia (11 módulos, modelo energético completo). Tecnología lista, sólo hay que fusionar.*
