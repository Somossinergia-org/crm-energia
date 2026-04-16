# 🚀 Quick Start - Sistema de Ventas

## 1. Asegúrate que el sistema esté corriendo

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## 2. Accede a la aplicación

```
http://localhost:5173
Email: comercial@empresa.com
Password: password (o tu contraseña de seed)
```

## 3. Prueba las 3 partes del Sistema de Ventas

### PARTE 1: Agente de Ventas
1. Ve a **Pipeline** → Abre un prospecto
2. Click en tab **"💼 Agente de Ventas"**
3. Verás:
   - **Pitch**: Guión personalizado de 4 minutos
   - **Strategy**: Estrategia por temperatura
   - **Objeciones**: Escribe una objeción y obtén respuesta IA
   - **Acción Sugerida**: Lo que debes hacer ahora

### PARTE 2: Follow-up Alerts
1. Ve al **Dashboard** (página principal)
2. Scroll down hasta **"Alertas de Follow-up"**
3. Verás:
   - Alertas por urgencia (CRÍTICA/ALTA/MEDIA/BAJA)
   - Filtra por temperatura
   - Click en alerta → registra acción completada
   - **KPIs**: Alertas totales, sin respuesta, completadas hoy, tasa completion

### PARTE 3: Analytics Dashboard
1. Ve a **Reportes** (en el menú lateral)
2. Verás:
   - Time range selector (7/30/90/180 días)
   - 4 KPIs principales
   - 6 gráficos interactivos
   - Tabla detallada por comercial

---

## API Endpoints (para testing)

### Follow-up Alerts
```bash
# Obtener alertas del usuario
curl -X GET http://localhost:3000/api/sales/followup/alerts \
  -H "Authorization: Bearer {TOKEN}"

# Registrar acción completada
curl -X POST http://localhost:3000/api/sales/followup/action/prospecto_id \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "llamada",
    "resultado": "positivo"
  }'
```

### Analytics
```bash
# Métricas generales
curl -X GET "http://localhost:3000/api/sales/analytics/metrics?days=30" \
  -H "Authorization: Bearer {TOKEN}"

# Desempeño por comercial
curl -X GET http://localhost:3000/api/sales/analytics/commercial-stats \
  -H "Authorization: Bearer {TOKEN}"
```

---

## Estructura de Carpetas

```
backend/
├── src/
│   ├── controllers/
│   │   ├── sales.controller.ts          (Agente de Ventas)
│   │   ├── sales-followup.controller.ts (Follow-up)
│   │   └── sales-analytics.controller.ts (Analytics)
│   ├── services/
│   │   ├── sales-agent.service.ts       (IA + Fallbacks)
│   │   ├── sales-followup.service.ts    (Alertas + Lógica)
│   │   └── sales-analytics.service.ts   (KPIs + Métricas)
│   └── routes/
│       └── sales.routes.ts              (14 endpoints)

frontend/
├── src/
│   ├── components/
│   │   ├── SalesAgentPanel.tsx          (Pitch + Objeciones)
│   │   ├── FollowUpAlerts.tsx           (Alertas + Acciones)
│   │   └── SalesAnalyticsDashboard.tsx  (Gráficos + Tablas)
│   ├── pages/
│   │   ├── Dashboard.tsx                (Con FollowUpAlerts integrado)
│   │   ├── ProspectDetail.tsx           (Con SalesAgentPanel en tab)
│   │   └── Reports.tsx                  (Con SalesAnalyticsDashboard)
│   └── App.tsx                          (Routes actualizado)
```

---

## Flujo de Datos

```
Usuario abre prospecto
├── Solicita Pitch
│   └── Gemini 2.0 Flash → Respuesta IA o Fallback Template
├── Solicita Strategy
│   └── SQL Query → Datos prospecto + Histórico contactos
├── Escribe Objeción
│   └── Gemini 2.0 Flash → Respuesta + Contraargumentos
└── Ve Acción Sugerida
    └── Lógica Determinística (sin IA, rápido)

Usuario en Dashboard
├── Ve Follow-up Alerts
│   └── SQL Query → Prospectos + Contact History
│       └── Lógica Urgencia (días + temperatura)
└── Registra acción completada
    └── INSERT contact_history con tipo/resultado

Usuario en Reportes
├── Ve Analytics Dashboard
│   └── 5 SQL Queries en paralelo
│       ├── getSalesMetrics (emails, llamadas, conversiones)
│       ├── getEffectivityByState (conversión por estado)
│       ├── getCommercialStats (ranking comerciales)
│       ├── getResponseRateByTemperature (respuesta vs conversión)
│       └── getEmailPerformance (aperturas, clicks, rebotes)
└── Gráficos se actualizan según time range
```

---

## Configuración Base de Datos

Las siguientes tablas ya existen y son utilizadas:

| Tabla | Campos Clave | Usado por |
|-------|-------------|----------|
| `prospects` | id, nombre_negocio, temperatura, estado, ahorro_estimado | Todo |
| `contact_history` | prospect_id, tipo, resultado, created_at, fecha_proxima_accion | Follow-up + Analytics |
| `emails_enviados` | prospect_id, abierto, clicks, rebotado, enviado_at | Analytics |
| `users` | id, nombre, role, email | Comerciales + Supervisores |

No se crean tablas nuevas, solo se consultan tablas existentes.

---

## Testing Rápido

### Test 1: Agente de Ventas
1. Pipeline → Prospecto → Tab Agente de Ventas
2. ¿Aparece guión en 3 segundos? ✅
3. Escribe objeción → ¿Respuesta en 2 segundos? ✅

### Test 2: Follow-up Alerts
1. Dashboard → Scroll a Alertas
2. ¿Ves alertas listadas? ✅
3. Click en alerta → Expande opciones de acción ✅
4. Selecciona "Llamada + Positivo" → Se registra ✅

### Test 3: Analytics
1. Reportes → ¿Cargan gráficos? ✅
2. Cambia time range (7/30/90/180) → ¿Se actualizan? ✅
3. ¿Ves tabla de comerciales? ✅

---

## Troubleshooting

### "No se carga el componente FollowUpAlerts"
- Backend corriendo en puerto 3000?
- Frontend corriendo en puerto 5173?
- JWT token válido? (Verifica browser console)

### "Gráficos en blanco en Reports"
- ¿Hay datos en base de datos? (Verifica con semillas)
- ¿API responde? (Abre DevTools → Network → /api/sales/analytics/*)

### "Errores de permisos en Follow-up Alerts"
- ¿Usuario tiene role 'comercial' o 'supervisor'?
- Verifica en JWT claims (consola del navegador)

---

## Documentación Completa

Para detalles técnicos completos, ver: `SALES_SYSTEM_COMPLETE.md`

---

*Sistema listo para producción. Status: ✅ OPERACIONAL*
