# 🚀 DESPLIEGUE EN RENDER (BACKEND)

## PASO 1: Abre Render
👉 https://dashboard.render.com

---

## PASO 2: Crea Web Service

1. Click **"+ New"** → **"Web Service"**
2. Click **"Deploy from Git Repository"**
3. Selecciona: **`crm-energia`**
4. Click **"Next"**

---

## PASO 3: Configuración de Render

Completa EXACTAMENTE así:

### Sección "Deploy from Git Repository"
- **Name**: `crm-energia-api`
- **Branch**: `develop`
- **Root Directory**: `backend` ← IMPORTANTE!

### Sección "Build Commands & Start Command"
- **Build Command**: 
  ```
  npm ci && npm run build
  ```
- **Start Command**: 
  ```
  npm run start
  ```

### Sección "Environment"
- **Environment**: Node
- **Node Version**: 18 (default está bien)

---

## PASO 4: Agregar Variables de Entorno

Click en la sección **"Environment Variables"** y agrega CADA UNA de estas (una por una):

### Base de Datos (SUPABASE)
```
DATABASE_URL = postgresql://postgres:s30251310S@db.XXXXX.supabase.co:5432/postgres
DB_HOST = db.XXXXX.supabase.co
DB_PORT = 5432
DB_USER = postgres
DB_PASSWORD = s30251310S@
DB_NAME = postgres
```

### JWT (IMPORTANTE - CAMBIAR ESTOS!)
```
JWT_SECRET = RqZ7mK9nLp2XvN4Qw5YbJfGhD8eA1sT3uI6oPcBmX9zVkL2pQrStUvWxYz0aB1Cd
JWT_REFRESH_SECRET = FqH3kL6mN9pR2sT5uV8wX1yZ4aB7cD0eF3gH6iJ9kL2mN5oP8qR1sT4uV7wX0yZ
JWT_EXPIRE = 24h
JWT_REFRESH_EXPIRE = 7d
```

### Gemini AI
```
GEMINI_API_KEY = AIzaSyDxxxx... (tu API key de Google)
```

### Configuración General
```
NODE_ENV = production
PORT = 3000
CORS_ORIGIN = https://crm-energia.vercel.app
LOG_LEVEL = info
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
```

---

## PASO 5: Crear el Servicio

1. Scroll abajo hasta el botón azul
2. Click **"Create Web Service"**
3. ⏳ **ESPERA 2-3 MINUTOS** mientras Render compila y despliega

---

## ✅ CUANDO TERMINE

Verás una URL como:
```
https://crm-energia-api.onrender.com
```

**COPIA ESTA URL** ← La necesitarás para Vercel

---

## 🧪 PRUEBA EL BACKEND

Abre terminal:

```bash
curl https://crm-energia-api.onrender.com/api/health

# Debería responder:
# {"status":"ok"}
```

Si ves "ok", ¡el backend funciona! ✅

---

## 🆘 TROUBLESHOOTING

### "Build failed"
- Verifica que DATABASE_URL está correcto
- Verifica que ALL env variables están en Render
- Mira los logs en Render (tab "Logs")

### "Cannot connect to database"
- Verifica que la URL de Supabase es correcta
- Espera a que Supabase termine de crear el proyecto (2-3 min)
- Las migraciones deben estar ejecutadas

### "502 Bad Gateway"
- Espera 1-2 minutos más
- Actualiza la página
- Mira los logs de Render

---

**Cuando el backend esté listo, pasa a VERCEL →**
