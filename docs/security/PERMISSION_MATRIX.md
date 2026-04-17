# Matriz de Permisos - CRM Energía

**Versión:** 1.0
**Última Actualización:** Abril 2026
**Modelo:** RBAC (Role-Based Access Control) + Tenant-Scoped

---

## 1. Definición de Roles

| Rol | Descripción | Alcance | Típico |
|-----|-------------|---------|--------|
| **SUPER_ADMIN** | Acceso total a plataforma. Solo operaciones críticas. | Global | 1-2 personas |
| **ADMIN_TENANT** | Administrador de su tenant. Gestión de usuarios y configuración. | Tenant | 1-3 por tenant |
| **JEFE** | Gestor de equipo. Reportes, supervisión, escalación. | Tenant | 2-5 por tenant |
| **VENTAS** | Prospección y pipeline. Crear y gestionar oportunidades. | Tenant | 5-20 por tenant |
| **ALMACEN** | Gestión de inventario y warehouse. | Tenant | 2-10 por tenant |
| **REPARTO** | Logística y entregas. | Tenant | 5-20 por tenant |
| **TESORERIA** | Pagos, cobranzas y facturación. | Tenant | 2-5 por tenant |
| **FACTURACION** | Emisión de facturas y documentación. | Tenant | 2-5 por tenant |
| **SOPORTE_INTERNO** | Escalación y troubleshooting. Acceso auditado. | Tenant | 2-3 por tenant |

---

## 2. Matriz de Permisos Detallada

### 2.1 Gestión de Tenants

| Permiso | Super Admin | Admin Tenant | Jefe | Ventas | Almacen | Reparto | Tesoreria | Facturacion | Soporte |
|---------|:-----------:|:-----------:|:---:|:-----:|:-------:|:-------:|:---------:|:-----------:|:-------:|
| `tenant.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tenant.create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `tenant.update` | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `tenant.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*_ADMIN_TENANT solo puede actualizar su propio tenant_

### 2.2 Gestión de Usuarios

| Permiso | Super Admin | Admin Tenant | Jefe | Ventas | Almacen | Reparto | Tesoreria | Facturacion | Soporte |
|---------|:-----------:|:-----------:|:---:|:-----:|:-------:|:-------:|:---------:|:-----------:|:-------:|
| `users.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `users.create` | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.update` | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.update_role` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.disable` | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.audit` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

*_JEFE solo puede crear/actualizar usuarios de su equipo_

### 2.3 Pipeline y Ventas

| Permiso | Super Admin | Admin Tenant | Jefe | Ventas | Almacen | Reparto | Tesoreria | Facturacion | Soporte |
|---------|:-----------:|:-----------:|:---:|:-----:|:-------:|:-------:|:---------:|:-----------:|:-------:|
| `pipeline.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| `pipeline.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `pipeline.update` | ✅ | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ |
| `pipeline.delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `pipeline.export` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*_VENTAS solo puede actualizar prospects asignados a ellos_
⚠️ _Solo lectura de datos relevantes a su función_

### 2.4 Warehouse y Logística

| Permiso | Super Admin | Admin Tenant | Jefe | Ventas | Almacen | Reparto | Tesoreria | Facturacion | Soporte |
|---------|:-----------:|:-----------:|:---:|:-----:|:-------:|:-------:|:---------:|:-----------:|:-------:|
| `warehouse.read` | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ | ❌ | ❌ | ✅ |
| `warehouse.update` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `delivery.read` | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | ❌ | ❌ | ✅ |
| `delivery.update` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### 2.5 Billing y Facturación

| Permiso | Super Admin | Admin Tenant | Jefe | Ventas | Almacen | Reparto | Tesoreria | Facturacion | Soporte |
|---------|:-----------:|:-----------:|:---:|:-----:|:-------:|:-------:|:---------:|:-----------:|:-------:|
| `billing.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `billing.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `billing.update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `billing.export` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `invoice.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `invoice.cancel` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

### 2.6 Seguridad y Administración

| Permiso | Super Admin | Admin Tenant | Jefe | Ventas | Almacen | Reparto | Tesoreria | Facturacion | Soporte |
|---------|:-----------:|:-----------:|:---:|:-----:|:-------:|:-------:|:---------:|:-----------:|:-------:|
| `security.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `security.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit.view` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `audit.export` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `admin.featureFlags` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `admin.breakGlass` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅* |
| `admin.logs` | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

*_SOPORTE_INTERNO solo puede usar break-glass con aprobación de SUPER_ADMIN y para scope limitado_

---

## 3. Restricciones Críticas

### 3.1 Restricciones por Tenant

```
REGLA: Todo acceso debe validar que el usuario pertenece al tenant del recurso

Si usuario.tenantId ≠ recurso.tenantId → 403 ACCESS_TENANT_MISMATCH

Excepción: SUPER_ADMIN puede acceder a cualquier tenant con auditoría obligatoria
```

### 3.2 Restricciones por Recurso

```
REGLA: Usuarios solo pueden acceder/modificar sus propios recursos

VENTAS.usuario_X solo ve prospects asignados a usuario_X
ALMACEN.usuario_X solo maneja items asignados a su zona

Excepción: JEFE, ADMIN_TENANT, SUPER_ADMIN pueden ver todo de su tenant
```

### 3.3 Restricciones de Acciones Sensibles

| Acción | Requiere | Duración |
|--------|----------|----------|
| Crear usuario | REAUTH + 5 min | Sesión actual |
| Cambiar rol usuario | REAUTH + 1 min | Sesión actual |
| Deshabilitar usuario | REAUTH + 1 min | Sesión actual |
| Crear factura | Validar monto | Según política |
| Usar break-glass | REAUTH + motivo | Máx 1 hora |
| Exportar datos | Auditado | Sesión actual |

### 3.4 Restricciones por Hora (Futura)

```
Admin operations (provisión, desactivación): solo 9-17h en días laborales
Facturas críticas: requerida confirmación manual
Break-glass: genera alerta inmediata
```

---

## 4. Feature Flags por Rol

```typescript
// src/security/features/featureFlags.ts
export const FEATURE_FLAGS = {
  // Disponible para todos
  PIPELINE_VIEW: true,
  DASHBOARD_READ: true,

  // Disponible solo para Super Admin
  TENANT_PROVISIONING: env.NODE_ENV !== 'production' || breakGlass,

  // Disponible para Tesoreria y Facturacion
  BULK_INVOICING: ['TESORERIA', 'FACTURACION'],

  // Disponible para equipos piloto
  AI_AGENTS_EXECUTIVE: process.env.AI_AGENTS_ENABLED === 'true' && userRole === 'JEFE',

  // Desactivado por defecto en producción
  DEV_AUTO_APPROVE: process.env.NODE_ENV !== 'production' && dev mode,
  DEBUG_ENDPOINTS: process.env.NODE_ENV !== 'production',
};
```

---

## 5. Políticas de Acceso Condicional

### 5.1 DENY by Default

```
Pseudocódigo:
```

```typescript
function authorize(user, action, resource) {
  // Paso 1: Autenticado?
  if (!user.authenticated) return DENY;

  // Paso 2: Sesión válida?
  if (user.sessionExpired) return DENY;

  // Paso 3: Tenant correcto?
  if (user.tenantId !== resource.tenantId && user.role !== SUPER_ADMIN) {
    return DENY;
  }

  // Paso 4: Rol tiene permiso?
  if (!hasPermission(user.role, action)) {
    return DENY;
  }

  // Paso 5: Acción sensible?
  if (isSensitiveAction(action)) {
    if (user.reauthAge > 300s) { // 5 minutos
      return REQUIRE_REAUTH;
    }
    if (!user.reauthReason) {
      return REQUIRE_REASON;
    }
  }

  // Paso 6: Rate limit OK?
  if (isRateLimited(user, action)) {
    return DENY_RATE_LIMITED;
  }

  // Paso 7: Break-glass?
  if (user.breakGlass) {
    if (isExpired(user.breakGlass)) return DENY;
    if (action not in user.breakGlass.scope) return DENY;
  }

  return ALLOW;
}
```

### 5.2 Validación de Acceso Sensible

```typescript
// Para acciones de alto riesgo:
1. Validar autenticación reciente (< 5 minutos)
2. Validar motivo (2+ caracteres, no vacío)
3. Validar confirmación explícita ("Sí, entiendo")
4. Log inmediato con requestId, userId, action, motivo, IP
5. Alert si es anómalo (ej: multiple en 1 min)
```

---

## 6. Permisos por Endpoint

### Ejemplos de Mapeo

```
POST /api/users
  Requiere: authenticate() + authorize('users.create')
  Validación adicional: ADMIN_TENANT o JEFE de equipo
  Rate limit: 10/min
  Sensible: Sí, requiere reauth + motivo

GET /api/pipeline
  Requiere: authenticate()
  Filtrado: Solo prospects del usuario/equipo (según rol)
  Rate limit: 100/min
  Sensible: No

DELETE /api/users/:id
  Requiere: authenticate() + authorize('users.disable')
  Validación: No puede desactivarse a sí mismo
  Rate limit: 5/min
  Sensible: Sí, requiere reauth + motivo + confirm

POST /api/admin/break-glass
  Requiere: SUPER_ADMIN o SOPORTE_INTERNO
  Payload: { scope: string[], reason: string, expiresIn: number }
  Rate limit: 1/hour
  Log: Completo, con aprobación requerida?
```

---

## 7. Transiciones Permitidas por Rol

### Pipeline State Transitions

```
PENDIENTE → LLAMADO         (VENTAS, JEFE)
LLAMADO → CONTACTADO        (VENTAS, JEFE)
CONTACTADO → INTERESADO     (VENTAS, JEFE)
INTERESADO → OFERTA_ENVIADA (VENTAS, JEFE)
OFERTA_ENVIADA → NEGOCIACION (VENTAS, JEFE)
NEGOCIACION → CONTRATO_FIRMADO (VENTAS, ADMIN_TENANT, TESORERIA)
* → RECHAZADO               (VENTAS, JEFE, ADMIN_TENANT)
* → VOLVER_LLAMAR           (VENTAS, JEFE)
```

---

## 8. Auditoría de Cambios

Cada cambio de permiso debe ser auditado:

```json
{
  "timestamp": "2026-04-17T14:30:00Z",
  "actor": { "userId": "abc123", "role": "ADMIN_TENANT" },
  "action": "users.update_role",
  "target": { "userId": "xyz789", "oldRole": "VENTAS", "newRole": "JEFE" },
  "reason": "Promoción de vendedor a gestor",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "outcome": "success"
}
```

---

## 9. Estados de Implementación

| Rol | Status | Notes |
|-----|--------|-------|
| SUPER_ADMIN | ✅ Implementado | Ya existe como ADMIN |
| ADMIN_TENANT | ⏳ Nuevo | Reemplaza parcialmente ADMIN |
| JEFE | ⏳ Nuevo | Necesita auditoría y reportes |
| VENTAS | ✅ Implementado | Ya existe como COMERCIAL |
| ALMACEN | ⏳ Nuevo | Diseñado pero no usado |
| REPARTO | ⏳ Nuevo | Diseñado pero no usado |
| TESORERIA | ⏳ Nuevo | Necesita acceso a billing |
| FACTURACION | ⏳ Nuevo | Necesita emisión de facturas |
| SOPORTE_INTERNO | ⏳ Nuevo | Con break-glass limitado |

---

## 10. Migración desde Roles Antiguos

```
ADMIN (actual)       → SUPER_ADMIN (algunos) + ADMIN_TENANT (otros)
COMERCIAL (actual)   → VENTAS (mantener permisos)
SUPERVISOR (actual)  → JEFE (mejorar con reportes)

Estrategia:
1. Auditar usuarios actuales
2. Clasificar por nuevo rol
3. Validar permisos en staging
4. Migrar con notificación
5. Auditar accesos post-migración
```

---

**Status:** ✅ Completo - Listo para implementación
