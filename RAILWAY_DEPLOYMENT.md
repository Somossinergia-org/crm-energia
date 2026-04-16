# 🚀 Despliegue en Railway - CRM Energía

**Frontend (Vercel)**: ✅ LISTO  
**Backend (Railway)**: Sigue estos pasos (2-3 minutos)

---

## OPCIÓN RÁPIDA: Despliegue con un Click

1. Ve a: https://railway.app
2. Haz click en "New Project"
3. Selecciona "Deploy from GitHub"
4. Elige el repositorio: `Somossinergia-org/crm-energia`
5. Selecciona la rama: `develop`
6. Click en "Deploy"
7. Railway preguntará por variables de entorno - pegalas abajo

---

## Variables de Entorno (Copia todas)

```
DATABASE_URL=postgresql://postgres:s30251310S@db.pwevqqbxiesmlkqyltwq.supabase.co:5432/postgres
DB_HOST=db.pwevqqbxiesmlkqyltwq.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=s30251310S@
DB_NAME=postgres
NODE_ENV=production
PORT=3000
JWT_SECRET=RqZ7mK9nLp2XvN4Qw5YbJfGhD8eA1sT3uI6oPcBmX9zVkL2pQrStUvWxYz0aB1Cd
JWT_REFRESH_SECRET=FqH3kL6mN9pR2sT5uV8wX1yZ4aB7cD0eF3gH6iJ9kL2mN5oP8qR1sT4uV7wX0yZ
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
GEMINI_API_KEY=AIzaSyDQkV4bsF5X_yJj-YzZp0sZ0Z8Z0Z0Z0Z0
CORS_ORIGIN=https://crm-energia.vercel.app
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## OPCIÓN CLI: Despliegue por Terminal

Si tienes Railway CLI instalado:

```bash
# 1. Login (abre browser para GitHub)
railway login

# 2. Ve al directorio backend
cd backend

# 3. Crea nuevo proyecto
railway init --name crm-energia-api

# 4. Agrega variables de entorno
railway variable set DATABASE_URL "postgresql://postgres:s30251310S@db.pwevqqbxiesmlkqyltwq.supabase.co:5432/postgres"
railway variable set NODE_ENV "production"
railway variable set JWT_SECRET "RqZ7mK9nLp2XvN4Qw5YbJfGhD8eA1sT3uI6oPcBmX9zVkL2pQrStUvWxYz0aB1Cd"
# ... (repite para todas las variables arriba)

# 5. Despliega
railway up
```

---

## URLs que Obtendrás

Después del despliegue, Railway te dará una URL como:
```
https://crm-energia-api-prod.railway.app
```

Úsala para actualizar el frontend:
- En **Vercel Project Settings**, agrega esta variable de entorno:
  ```
  VITE_API_URL=https://crm-energia-api-prod.railway.app/api
  ```

---

## Testing Rápido

Una vez deployed:

```bash
# Backend health check
curl https://crm-energia-api-prod.railway.app/api/health

# Login test
curl -X POST https://crm-energia-api-prod.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"comercial@empresa.com","password":"password"}'
```

---

## ⏱️ Tiempo Total
- Con UI: 3-5 minutos
- Con CLI: 5 minutos

**¿Listo?** Ve a https://railway.app y empieza! 🚀
