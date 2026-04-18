# 🎨 DESPLIEGUE EN VERCEL (FRONTEND)

## PASO 1: Abre Vercel
👉 https://vercel.com/new

---

## PASO 2: Importa Repositorio

1. Click **"Import Git Repository"**
2. En el campo de búsqueda, escribe: `crm-energia`
3. Selecciona: **`Somossinergia-org/crm-energia`**
4. Click **"Import"**

---

## PASO 3: Configuración del Proyecto

Vercel probablemente auto-detecte todo, pero verifica:

### Framework Preset
- **Preset**: Other (Vite)

### Build & Output Settings
- **Build Command**: ✅ Auto-detectado
- **Output Directory**: ✅ Auto-detectado
- **Install Command**: ✅ Auto-detectado

**Si dice**:
```
Build Command: cd frontend && npm ci && npm run build
Output Directory: frontend/dist
```

Eso está **PERFECTO** ✅

---

## PASO 4: Agregar Environment Variable

Click en **"Environment Variables"** y agrega:

```
VITE_API_URL = https://crm-energia-api.onrender.com/api
```

⚠️ **IMPORTANTE**: Reemplaza `crm-energia-api.onrender.com` con la URL exacta que obtuviste de Render.

**Ejemplo**:
```
VITE_API_URL = https://crm-energia-api.onrender.com/api
```

---

## PASO 5: Desplegar

1. Scroll abajo
2. Click **"Deploy"**
3. ⏳ **ESPERA 1-2 MINUTOS** mientras Vercel compila

---

## ✅ CUANDO TERMINE

Verás una pantalla de éxito con una URL como:
```
https://crm-energia.vercel.app
```

**GUARDA ESTA URL** ← Esta es tu aplicación!

---

## 🧪 PRUEBA EL FRONTEND

Abre la URL en tu navegador:

```
https://crm-energia.vercel.app
```

Deberías ver:
1. Pantalla de LOGIN
2. Campo Email
3. Campo Password
4. Botón "Ingresar"

---

## 🔑 LOGIN CON DATOS DE PRUEBA

Una vez en la pantalla de login, intenta:

```
Email: comercial@empresa.com
Password: password
```

Si ves el **DASHBOARD** con gráficos, ¡funciona! 🎉

---

## 📱 PRUEBA EN MÓVIL

Abre en tu teléfono:

```
https://crm-energia.vercel.app
```

Verifica que:
- ✅ Se ve bien en móvil
- ✅ Los botones funcionan
- ✅ Los gráficos se cargan
- ✅ Todo es responsive

---

## 🆘 TROUBLESHOOTING

### "Build failed"
- Verifica localmente:
  ```bash
  cd frontend && npm run build
  ```
- Si falla, hay error en el código
- Mira logs en Vercel (tab "Logs")

### "Blank page" o "Cannot connect"
- Presiona: **Ctrl + Shift + R** (limpiar cache)
- Abre DevTools: **F12**
- Tab "Console" - ¿Qué error ves?
- Verifica VITE_API_URL en env vars

### "CORS error" en console
- Verifica que CORS_ORIGIN en Render = https://crm-energia.vercel.app
- Redeploy Render después de cambiar

### "API returns 500"
- Verifica logs de Render (backend)
- ¿DATABASE_URL está correcto?
- ¿Las migraciones se ejecutaron?

---

## 📊 CUANDO TODO FUNCIONE

Deberías ver:
- ✅ Login exitoso
- ✅ Dashboard con datos
- ✅ Alertas de Follow-up
- ✅ Gráficos de Analytics
- ✅ Pipeline de Prospectos
- ✅ Diseño mobile-friendly

---

**¡LISTO! Tu CRM está en producción!** 🚀

URLs:
- Frontend: https://crm-energia.vercel.app
- Backend: https://crm-energia-api.onrender.com
