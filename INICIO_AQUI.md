# 🚀 COMIENZA AQUÍ - GUÍA RÁPIDA EN ESPAÑOL

**Tu CRM está listo. Solo necesitas 10 minutos para ponerlo en producción.**

---

## 📍 TU SITUACIÓN ACTUAL

✅ Código completo en GitHub  
✅ Frontend compila perfectamente  
✅ Backend listo para producción  
✅ Todo documentado  

❓ Necesitas:
1. Base de datos Supabase
2. Despliegue en Render (backend)
3. Despliegue en Vercel (frontend)

---

## ⏱️ TIEMPO TOTAL: 10-15 MINUTOS

```
Crear Supabase:      3-4 min (espera automática)
Desplegar Render:    3-4 min (espera automática)
Desplegar Vercel:    2-3 min (espera automática)
Pruebas:             2-3 min
---
TOTAL:               10-15 min
```

---

## 🎯 PLAN DE ACCIÓN

### PASO 1️⃣: BASE DE DATOS (3-4 minutos)

**Archivo a leer**: `DEPLOY_TODO.md` ← Lee esto primero

**Qué hacer**:
1. Abre: https://supabase.com/dashboard
2. Login con: orihuela@somossinergia.es / s30251310S@
3. Crea proyecto: "crm-energia"
4. Copia la URL de conexión (Connection String)
5. Me la pasas aquí

**Cuando termines**, me dices:
```
postgresql://postgres:s30251310S@db.XXXXX.supabase.co:5432/postgres
```

---

### PASO 2️⃣: DESPLEGAR BACKEND (3-4 minutos)

**Archivo a leer**: `INSTRUCCIONES_RENDER.md`

**Qué hacer**:
1. Abre: https://dashboard.render.com
2. Crea Web Service
3. Conecta GitHub repo: `crm-energia`
4. Agrega variables de entorno (copiar-pegar desde archivo)
5. Click "Create Web Service"
6. Espera a que compile

**Cuando termine**, Render te da URL:
```
https://crm-energia-api.onrender.com
```

---

### PASO 3️⃣: DESPLEGAR FRONTEND (2-3 minutos)

**Archivo a leer**: `INSTRUCCIONES_VERCEL.md`

**Qué hacer**:
1. Abre: https://vercel.com/new
2. Importa repo GitHub: `crm-energia`
3. Agrega variable: `VITE_API_URL = <URL de Render>/api`
4. Click "Deploy"
5. Espera a que compile

**Cuando termine**, Vercel te da URL:
```
https://crm-energia.vercel.app
```

---

### PASO 4️⃣: PRUEBAS (2-3 minutos)

**Archivo a leer**: `INSTRUCCIONES_VERCEL.md` (sección Testing)

**Qué hacer**:
1. Abre: https://crm-energia.vercel.app
2. Login con:
   - Email: `comercial@empresa.com`
   - Password: `password`
3. Verifica que ves:
   - Dashboard
   - Alertas de Follow-up
   - Gráficos
   - Everything funciona

---

## 📚 DOCUMENTOS (EN ORDEN)

| # | Archivo | Cuándo leer |
|---|---------|-----------|
| 1 | **DEPLOY_TODO.md** | Ahora mismo |
| 2 | **INSTRUCCIONES_RENDER.md** | Después de crear Supabase |
| 3 | **INSTRUCCIONES_VERCEL.md** | Después de desplegar Render |
| 4 | **QUICK_DEPLOY.md** | Si necesitas referencia |
| 5 | **README_PRODUCTION.md** | Para documentación completa |

---

## 🔐 TUS CREDENCIALES GUARDADAS

```
Email Supabase:      orihuela@somossinergia.es
Password Supabase:   s30251310S@
JWT Secret:          RqZ7mK9nLp2XvN4Qw5YbJfGhD8eA1sT3uI6oPcBmX9zVkL2pQrStUvWxYz0aB1Cd
JWT Refresh Secret:  FqH3kL6mN9pR2sT5uV8wX1yZ4aB7cD0eF3gH6iJ9kL2mN5oP8qR1sT4uV7wX0yZ
```

---

## ✅ CHECKLIST

- [ ] Abrí Supabase
- [ ] Creé proyecto "crm-energia"
- [ ] Copié Connection String
- [ ] Pasé URL a Claude
- [ ] Abrí Render
- [ ] Creé Web Service
- [ ] Copié URL de Render
- [ ] Abrí Vercel
- [ ] Importé repo
- [ ] Agregué VITE_API_URL
- [ ] Copié URL de Vercel
- [ ] Probé login
- [ ] Todo funciona! 🎉

---

## 🎯 RESULTADO FINAL

Cuando termines, tendrás:

```
🎨 FRONTEND:
   https://crm-energia.vercel.app
   
🔧 BACKEND:
   https://crm-energia-api.onrender.com
   
💾 DATABASE:
   Supabase (PostgreSQL)
   
✅ COMPLETAMENTE FUNCIONAL
✅ LISTO PARA PRODUCCIÓN
✅ CON DATOS DE PRUEBA
✅ MOBILE-RESPONSIVE
```

---

## 🚀 AHORA SÍ, VAMOS!

**Abre Supabase** → https://supabase.com/dashboard

**Login** con: orihuela@somossinergia.es / s30251310S@

**Lee**: `DEPLOY_TODO.md` para instrucciones exactas

**Cuando tengas la Connection String, pégala aquí ↓**

---

## ❓ ¿DUDAS?

- Revisa el archivo `.md` correspondiente
- Busca la sección "TROUBLESHOOTING"
- Mira los ejemplos de configuración

---

**¡Vamos! El tiempo comienza ahora! ⏱️**
