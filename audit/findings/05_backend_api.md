# 05 - Backend API

## AUDIT-API-001: Falta de Paginación Limitada

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/API

### Descripción
La paginación permite límites altos (default 25, pero configurable) sin restricción superior.

### Evidencia
- Archivo: `backend/src/controllers/prospects.controller.ts:62`
- Código: `limit: parseInt(req.query.limit as string) || 25`
- No hay validación de máximo (ej: 100)

### Impacto
- **Negocio**: Consultas pesadas pueden afectar performance
- **Técnico**: Posible DoS vía queries grandes
- **Seguridad**: Consumo excesivo de recursos

### Probabilidad
Media

### Remediación
```typescript
const MAX_LIMIT = 100;
const limit = Math.min(parseInt(req.query.limit as string) || 25, MAX_LIMIT);
```

### Esfuerzo Estimado
**XS** (< 1 hora)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-API-002: Falta de Rate Limiting Específico por Endpoint

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/API

### Descripción
Solo existe rate limiting global, pero endpoints críticos como login tienen límites específicos.

### Evidencia
- Archivo: `backend/src/middleware/rateLimiter.ts`
- Solo `generalLimiter` y `loginLimiter`
- Endpoints de escritura sin protección específica

### Impacto
- **Negocio**: Posible spam en creación de registros
- **Técnico**: Base de datos sobrecargada
- **Seguridad**: Ataques de spam automatizados

### Probabilidad
Media

### Remediación
```typescript
// Rate limiter para operaciones de escritura
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 operaciones por minuto
  message: 'Demasiadas operaciones de escritura',
});

// Aplicar en rutas POST/PUT/DELETE
router.post('/', writeLimiter, controller.create);
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-API-003: Falta de Validación de Permisos en Queries

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/API

### Descripción
Los filtros de usuario incluyen `asignado_a` pero no validan que el usuario pueda ver prospects de otros.

### Evidencia
- Archivo: `backend/src/controllers/prospects.controller.ts:56`
- Código: `asignado_a: req.query.asignado_a as string`
- Falta validación de permisos para ver prospects ajenos

### Impacto
- **Negocio**: Posible fuga de información
- **Técnico**: Inconsistencia de datos
- **Seguridad**: Acceso a datos no autorizados

### Probabilidad
Media

### Remediación
```typescript
// Solo admin puede filtrar por asignado_a de otros
if (req.query.asignado_a && req.query.asignado_a !== req.user!.id && req.user!.role !== 'admin') {
  throw new AppError('No autorizado para ver prospects de otros usuarios', 403);
}
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-API-004: Respuestas de Error sin Información Sensible

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/API

### Descripción
Los errores podrían estar exponiendo información interna en desarrollo.

### Evidencia
- Archivo: `backend/src/middleware/errorHandler.ts`
- Código: `res.status(err.statusCode || 500).json({ ...err });`
- En desarrollo podría exponer stack traces

### Impacto
- **Negocio**: Información sensible expuesta
- **Técnico**: Debugging difícil en producción
- **Seguridad**: Información para attackers

### Probabilidad
Baja (solo en desarrollo)

### Remediación
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
res.status(err.statusCode || 500).json({
  success: false,
  message: err.message,
  ...(isDevelopment && { stack: err.stack, details: err })
});
```

### Esfuerzo Estimado
**XS** (< 1 hora)

### Prioridad
Baja

### Estado
🔄 Pendiente

---

## AUDIT-API-005: Falta de Compresión de Respuestas

### Severidad
🔵 **LOW**

### Módulo Afectado
Backend/Performance

### Descripción
No se detecta middleware de compresión para respuestas JSON/API.

### Evidencia
- Archivo: `backend/src/index.ts`
- No hay `compression` middleware
- Respuestas grandes sin optimización

### Impacto
- **Negocio**: Transferencia de datos más lenta
- **Técnico**: Mayor uso de bandwidth
- **Seguridad**: No aplica

### Probabilidad
Baja

### Remediación
```bash
npm install compression
```

```typescript
import compression from 'compression';
app.use(compression());
```

### Esfuerzo Estimado
**XS** (< 1 hora)

### Prioridad
Baja

### Estado
🔄 Pendiente
