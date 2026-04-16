# 🗄️ EJECUTAR MIGRACIONES EN SUPABASE

Tu Supabase ya está creada en: https://pwevqqbxiesmlkqyltwq.supabase.co

Las migraciones se ejecutarán de 2 formas:

---

## OPCIÓN 1: Automático en Render (RECOMENDADO)

Cuando despliegues en Render, las migraciones se ejecutarán automáticamente:

1. Render inicia el backend
2. Backend se conecta a Supabase
3. Ejecuta las migraciones automáticamente
4. ✅ Base de datos configurada

**No necesitas hacer nada extra.**

---

## OPCIÓN 2: Manual desde Supabase Dashboard

Si quieres hacerlo ANTES de Render:

### PASO 1: Abre Supabase
👉 https://supabase.com/dashboard

### PASO 2: SQL Editor
1. En tu proyecto `crm-energia`
2. Click **"SQL Editor"** (lado izquierdo)
3. Click **"New query"**

### PASO 3: Copiar y ejecutar migraciones

**Migración 1: Tabla Users**
```sql
-- 001_users.sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'comercial',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

1. Copia todo el SQL arriba
2. Pégalo en el editor de Supabase
3. Click **"Run"** (o Ctrl+Enter)
4. Espera a que termine
5. Deberías ver: ✅ "Success"

---

**Migración 2: Tabla Prospects**
```sql
-- 002_prospects.sql
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_negocio VARCHAR(255) NOT NULL,
  nombre_contacto VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(20),
  categoria VARCHAR(100),
  sector VARCHAR(100),
  provincia VARCHAR(100),
  municipio VARCHAR(100),
  temperatura VARCHAR(50) DEFAULT 'frio',
  estado VARCHAR(50) DEFAULT 'nuevo',
  ahorro_estimado_eur NUMERIC(12,2),
  dias_sin_contacto INTEGER DEFAULT 0,
  ultima_interaccion TIMESTAMP,
  assigned_to_id UUID REFERENCES users(id),
  fuente VARCHAR(100),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospects_estado ON prospects(estado);
CREATE INDEX IF NOT EXISTS idx_prospects_temperatura ON prospects(temperatura);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON prospects(assigned_to_id);
```

Repite los pasos: Copiar → Pegar → Run → ✅

---

**Migración 3: Tabla Contact History**
```sql
-- 003_contact_history.sql
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  tipo VARCHAR(100) NOT NULL,
  resultado VARCHAR(100),
  notas TEXT,
  fecha_proxima_accion DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_history_prospect ON contact_history(prospect_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_user ON contact_history(user_id);
```

---

**Migración 4: Tabla Emails**
```sql
-- 004_emails_enviados.sql
CREATE TABLE IF NOT EXISTS emails_enviados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES users(id),
  asunto VARCHAR(255),
  abierto BOOLEAN DEFAULT false,
  clicks INTEGER DEFAULT 0,
  rebotado BOOLEAN DEFAULT false,
  enviado_at TIMESTAMP DEFAULT NOW(),
  abierto_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emails_prospect ON emails_enviados(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emails_usuario ON emails_enviados(usuario_id);
```

---

## INSERTAR DATOS DE PRUEBA

Una vez creadas las tablas, crea 1 usuario de prueba:

```sql
-- Insertar usuario de prueba
INSERT INTO users (email, password, nombre, role)
VALUES (
  'comercial@empresa.com',
  'password',  -- En producción usar bcrypt!
  'Comercial Test',
  'comercial'
);
```

---

## ✅ VERIFICAR QUE FUNCIONÓ

En Supabase, ve a:
1. **Tables** (lado izquierdo)
2. Deberías ver:
   - ✅ users
   - ✅ prospects
   - ✅ contact_history
   - ✅ emails_enviados

Si ves todas las tablas, ¡las migraciones funcionaron! 🎉

---

## NOTAS IMPORTANTES

- Las migraciones son **idempotentes** (se pueden ejecutar múltiples veces)
- Usa `CREATE TABLE IF NOT EXISTS` para evitar errores
- Los índices mejoran rendimiento en búsquedas

---

## PRÓXIMO PASO

Una vez tengas las tablas, ve a:
👉 **INSTRUCCIONES_RENDER.md**
