# ⚡ QUICK DEPLOY GUIDE (5 MINUTOS)

Sigue estos pasos en orden para desplegar todo en PRODUCCIÓN.

---

## 📍 PASO 1: CREAR BASE DE DATOS (Supabase)

### 1.1 Abre Supabase
👉 https://supabase.com/dashboard

### 1.2 Crear nuevo proyecto
1. Click **"New Project"**
2. **Project name**: `crm-energia`
3. **Database password**: Usa una FUERTE (ej: `Sup@base2024!xYz123`)
4. **Region**: Tu región (Europa = EU-West)
5. Click **"Create new project"**
6. ⏳ **ESPERA 2-3 MINUTOS** (se está creando la BD)

### 1.3 Obtener credenciales
1. Una vez listo, ve a **Settings** (engranaje abajo)
2. Click tab **"Database"**
3. Copia la sección **"Connection string"**
   ```
   postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
4. Guarda esta URL en un lugar seguro ✅

---

## 🔐 PASO 2: GENERAR SECRETS

Abre terminal y ejecuta:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

Copia los 2 valores generados (diferentes para cada uno) ✅

---

## 📝 PASO 3: CONFIGURAR .env

Edita el archivo `.env` en la raíz del proyecto:

```bash
# Copia tu connection string de Supabase aquí:
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Desde el connection string, extrae:
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=PASSWORD_QUE_CREASTE
DB_NAME=postgres

# Pega los secrets que generaste:
JWT_SECRET=PRIMER_VALOR_OPENSSL
JWT_REFRESH_SECRET=SEGUNDO_VALOR_OPENSSL

# Tu Gemini API key (de https://aistudio.google.com/app/apikey):
GEMINI_API_KEY=tu_gemini_api_key

# Otros valores:
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://crm-energia.vercel.app
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
LOG_LEVEL=info
```

Guarda el archivo ✅

---

## 🚀 PASO 4: DESPLEGAR BACKEND EN RENDER

### 4.1 Abre Render
👉 https://dashboard.render.com

### 4.2 Crear Web Service
1. Click **"+ New"** → **"Web Service"**
2. **Select repository**: `crm-energia`
3. **Name**: `crm-energia-api`
4. **Environment**: Node
5. **Build Command**: 
   ```
   cd backend && npm ci && npm run build
   ```
6. **Start Command**: 
   ```
   cd backend && npm run start
   ```

### 4.3 Agregar Environment Variables
Haz click en **"Environment"** y agrega EXACTAMENTE estas variables (copia de tu .env):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=PASSWORD_QUE_CREASTE
DB_NAME=postgres
JWT_SECRET=TU_PRIMER_SECRET
JWT_REFRESH_SECRET=TU_SEGUNDO_SECRET
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
GEMINI_API_KEY=tu_gemini_api_key
CORS_ORIGIN=https://crm-energia.vercel.app
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.4 Crear servicio
Click **"Create Web Service"**

⏳ **ESPERA 2-3 MINUTOS** mientras Render despliega

**✅ Cuando termine, recibirás una URL como:**
```
https://crm-energia-api.onrender.com
```

**GUARDA ESTA URL** 📌

---

## 🎨 PASO 5: DESPLEGAR FRONTEND EN VERCEL

### 5.1 Abre Vercel
👉 https://vercel.com/new

### 5.2 Importar repositorio
1. Click **"Import Git Repository"**
2. Selecciona: `Somossinergia-org/crm-energia`
3. Click **"Import"**

### 5.3 Configurar proyecto
- **Framework Preset**: Other (Vite)
- Build Command: ✅ Auto-detectado
- Output Directory: ✅ Auto-detectado
- Install Command: ✅ Auto-detectado

### 5.4 Agregar Environment Variable
Haz click en **"Environment Variables"** y agrega:

```
VITE_API_URL=https://crm-energia-api.onrender.com/api
```

(Reemplaza con la URL que obtuviste de Render en PASO 4)

### 5.5 Deploy
Click **"Deploy"**

⏳ **ESPERA 1-2 MINUTOS** mientras Vercel compila y despliega

**✅ Cuando termine, recibirás una URL como:**
```
https://crm-energia.vercel.app
```

---

## ✅ PASO 6: PRUEBAS FINALES

### 6.1 Prueba Backend
Abre terminal y ejecuta:

```bash
curl https://crm-energia-api.onrender.com/api/health

# Debería mostrar: {"status":"ok"}
```

✅ Si funciona, el backend está correcto.

### 6.2 Prueba Frontend
Abre tu navegador:

```
https://crm-energia.vercel.app
```

Deberías ver la pantalla de **LOGIN**

✅ Intenta login con:
- Email: `comercial@empresa.com`
- Password: `password`

Si ves el Dashboard, ¡**TODO FUNCIONA!** 🎉

---

## 📱 COMPARTIR CON TU EQUIPO

Ahora puedes compartir estas URLs:

**Frontend (móvil-friendly):**
```
https://crm-energia.vercel.app
```

**Credenciales de prueba:**
```
Email: comercial@empresa.com
Password: password
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

### "Render dice: Build failed"
- Verifica que DATABASE_URL está correcto
- Revisa que todos los env vars están en Render

### "Vercel dice: Build failed"  
- Abre terminal localmente:
  ```bash
  cd frontend && npm run build
  ```
- Si falla aquí, hay un error en el código

### "Frontend muestra error al conectar"
- Verifica VITE_API_URL es exacta
- Presiona Ctrl+Shift+R para limpiar cache
- Abre DevTools (F12) → Console → ¿Qué error ves?

### "Backend retorna 403 CORS"
- Verifica CORS_ORIGIN en Render env vars
- Debe ser: `https://crm-energia.vercel.app` (exactamente)
- Redeploya Render después de cambiar

---

## 🎉 ¡LISTO!

Tu CRM está en PRODUCCIÓN:

| Componente | URL |
|-----------|-----|
| 🎨 Frontend | https://crm-energia.vercel.app |
| 🔧 Backend | https://crm-energia-api.onrender.com |
| 💾 Database | Supabase (PostgreSQL) |

**Próximos pasos:**
- Invita a tu equipo a usar el sistema
- Monitorea logs en Render Dashboard
- Configura alertas de errores
- Realiza backup regular de la BD

---

**¿Necesitas ayuda?** Lee los archivos:
- `DEPLOYMENT.md` - Guía completa
- `SETUP_SUPABASE.md` - Detalles de Supabase
- `DEPLOY_VERCEL_RENDER.md` - Detalles Vercel + Render
