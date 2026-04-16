# 🔧 Supabase Setup Guide

## Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com/dashboard
2. Login con tu cuenta
3. Click **"New project"**
4. **Project Name**: `crm-energia`
5. **Database Password**: Genera una fuerte (ej: `Sup@base2024!xYz123`)
6. **Region**: Elige tu región
7. Click **"Create new project"**
8. ⏳ Espera 2-3 minutos mientras se crea la BD

---

## Paso 2: Obtener Credenciales

Después de crear el proyecto:

1. Ve a **Settings** (ícono engranaje abajo izq)
2. Tab **"Database"**
3. Busca **"Connection string"**
4. Copia la URL completa (ejemplo):
   ```
   postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```

---

## Paso 3: Configurar .env Local

Edita `.env.supabase` con tus credenciales reales:

```bash
# Desde tu string de conexión:
# postgresql://postgres:PASSWORD@HOST:5432/postgres

DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=postgres

# Genera secretos fuertes con:
# openssl rand -base64 32
JWT_SECRET=[resultado de openssl]
JWT_REFRESH_SECRET=[resultado de openssl]
```

---

## Paso 4: Ejecutar Migraciones

### Opción A: Con Supabase CLI (Recomendado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Conectar a tu proyecto
supabase link --project-ref YOUR_PROJECT_REF

# Ejecutar migraciones
supabase migration up

# Ejecutar seeds
supabase db push
```

### Opción B: Directamente con psql

```bash
# Instalar PostgreSQL client si no lo tienes
# En Windows: https://www.postgresql.org/download/windows/

# Conectar y ejecutar migraciones
psql postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres \
  < backend/migrations/001_users.sql

psql postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres \
  < backend/migrations/002_prospects.sql

psql postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres \
  < backend/migrations/003_contact_history.sql

# ... ejecutar todas las migraciones
```

### Opción C: Via Supabase Dashboard

1. Ve a **SQL Editor** en tu proyecto Supabase
2. Click **"New query"**
3. Copia y pega el contenido de cada archivo en `backend/migrations/`
4. Ejecuta cada uno en orden:
   - 001_users.sql
   - 002_prospects.sql
   - 003_contact_history.sql
   - etc.

---

## Paso 5: Verificar Conexión

Abre terminal y prueba:

```bash
# Con psql
psql postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres \
  -c "SELECT version();"

# Debería mostrar versión de PostgreSQL 15
```

---

## Paso 6: Crear Archivo .env para Backend

Copia `.env.supabase` a `.env` en el directorio backend:

```bash
cp .env.supabase backend/.env
```

---

## Verificación Final

Verifica que todo esté conectado:

```bash
cd backend

# Intenta conectar a BD
npm run db:test

# Debería mostrar: ✓ Database connected successfully
```

---

## Troubleshooting

### "Connection refused"
- ¿Copiaste bien las credenciales?
- ¿El password tiene caracteres especiales? Escápalo correctamente
- Verifica que la URL tenga el puerto 5432

### "ENOTFOUND db.xxxxx.supabase.co"
- Espera a que Supabase termine de crear el proyecto (2-3 min)
- Recarga la página de Settings
- Copia nuevamente la URL

### "FATAL: Ident authentication failed"
- Revisa que el usuario sea `postgres` (no otro)
- Revisa la contraseña (case-sensitive)

### "Migration fails"
- Asegúrate de ejecutarlas en orden numérico
- La primera vez, espera a que terminen los CREATE TABLE
- Verifica que la BD esté vacía (sin tablas existentes)

---

## ¿Ya tienes la BD lista?

Cuando veas en Supabase Dashboard:
- ✅ Tabla `users` con campos (id, email, password, etc)
- ✅ Tabla `prospects` con campos (id, nombre_negocio, temperatura, etc)
- ✅ Tabla `contact_history` con campos (id, prospect_id, tipo, etc)

¡La base de datos está lista para producción!

---

**Próximo paso**: Usar estas credenciales en tu hosting (Render o Railway)
