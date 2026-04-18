# 08 - Rendimiento y Observabilidad

## AUDIT-PERF-001: Falta de Métricas de Rendimiento

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/Observabilidad

### Descripción
No se detectan métricas de rendimiento ni monitoring de queries.

### Evidencia
- Archivo: `backend/src/index.ts`
- No hay middleware de métricas (prometheus, etc.)
- Solo logging básico con Morgan

### Impacto
- **Negocio**: Dificultad para identificar cuellos de botella
- **Técnico**: Sin datos para optimización
- **Seguridad**: No aplica

### Probabilidad
Media

### Remediación
```bash
npm install prom-client response-time
```

```typescript
import promClient from 'prom-client';
import responseTime from 'response-time';

// Métricas
const register = new promClient.Registry();
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

// Middleware
app.use(responseTime((req, res, time) => {
  httpRequestDuration
    .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
    .observe(time / 1000);
}));

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Esfuerzo Estimado
**M** (1-2 días)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-PERF-002: Falta de Connection Pooling Óptimo

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/Database

### Descripción
Pool de conexiones PostgreSQL con configuración básica, posible subutilización.

### Evidencia
- Archivo: `backend/src/config/database.ts`
- Pool config: `max: 20` fijo
- No hay configuración adaptativa

### Impacto
- **Negocio**: Conexiones limitadas en alta carga
- **Técnico**: Posible agotamiento de pool
- **Seguridad**: No aplica

### Probabilidad
Media

### Remediación
```typescript
const poolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  allowExitOnIdle: true,
};
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-PERF-003: Falta de Caché en Consultas Frecuentes

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/Caching

### Descripción
Consultas de estadísticas y datos de referencia sin caché.

### Evidencia
- Archivo: `backend/src/controllers/prospects.controller.ts`
- Método: `getStats`, `getClientStats`
- Consultas ejecutadas cada vez sin cache

### Impacto
- **Negocio**: Dashboard lento en múltiples usuarios
- **Técnico**: Carga innecesaria en DB
- **Seguridad**: No aplica

### Probabilidad
Media

### Remediación
```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const getStatsCached = async (userId: string, role: string) => {
  const cacheKey = `stats:${userId}:${role}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const stats = await getStats(userId, role);
  await redis.setex(cacheKey, 300, JSON.stringify(stats)); // 5 min cache

  return stats;
};
```

### Esfuerzo Estimado
**M** (1-2 días)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-PERF-004: Winston y Morgan Redundantes

### Severidad
🔵 **LOW**

### Módulo Afectado
Backend/Logging

### Descripción
Dos sistemas de logging activos simultáneamente.

### Evidencia
- Archivo: `backend/src/index.ts:44`
- Código: `app.use(morgan('short', { stream: ... }));`
- Archivo: `backend/src/utils/logger.ts`
- Winston configurado para archivos y consola

### Impacto
- **Negocio**: Logs duplicados, confusión
- **Técnico**: Overhead de procesamiento doble
- **Seguridad**: No aplica

### Probabilidad
Baja

### Remediación
```typescript
// Unificar logging con Winston solo
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Remover Morgan si Winston cubre todo
// npm uninstall morgan
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Baja

### Estado
🔄 Pendiente

---

## AUDIT-PERF-005: Falta de Health Checks Avanzados

### Severidad
🔵 **LOW**

### Módulo Afectado
Backend/Observabilidad

### Descripción
Health check básico sin verificar dependencias críticas.

### Evidencia
- Archivo: `backend/src/index.ts:75`
- Código: `app.get('/api/health', (req, res) => res.json({ status: 'ok' }));`
- No verifica DB, Redis, servicios externos

### Impacto
- **Negocio**: Falsos positivos en monitoring
- **Técnico**: Dificultad para troubleshooting
- **Seguridad**: No aplica

### Probabilidad
Baja

### Remediación
```typescript
app.get('/api/health', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString()
  };

  try {
    await pool.query('SELECT 1');
    checks.database = true;
  } catch (err) {
    logger.error('Database health check failed:', err);
  }

  try {
    // Verificar Redis si está disponible
    checks.redis = true;
  } catch (err) {
    logger.error('Redis health check failed:', err);
  }

  const isHealthy = checks.database && checks.redis;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    ...checks
  });
});
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Baja

### Estado
🔄 Pendiente
