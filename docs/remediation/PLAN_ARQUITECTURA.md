# Plan de Arquitectura - Remediación Segura
## CRM Energía - Rediseño de Permisos y Cierre de Vulnerabilidades

**Fecha:** Abril 2026
**Versión:** 1.0
**Estado:** En Planificación

---

## 1. Análisis del Estado Actual

### 1.1 Roles Identificados (Actual)
```
ADMIN       - acceso total
COMERCIAL   - acceso medio
SUPERVISOR  - acceso supervisión
```

**Problema:** Muy simplistas, no hay granularidad. No refleja la realidad del negocio (warehouse, delivery, billing, etc.)

### 1.2 Middleware de Auth Actual
- ✅ JWT en Bearer token
- ✅ Cookies HttpOnly para refresh token
- ✅ Función `authorize()` que valida roles por endpoint
- ❌ Sin validación de tenant (falta multi-tenant seguro)
- ❌ Sin auditoría de acceso
- ❌ Sin rate limiting específico por acción sensible
- ❌ Sin MFA

### 1.3 Protección Frontend
- ✅ ProtectedRoute con validación de autenticación
- ✅ Rechaza rutas si no tiene rol
- ❌ **CRÍTICO:** La UI es la única barrera; la API no valida permisos en todos los endpoints

### 1.4 Endpoints Sensibles Sin Protección Visible
- `/api/admin/init` - usa token en header (inseguro si token leakea)
- `/api/users/*` - crear, actualizar usuarios
- `/api/debug/*` - debug routes visibles en producción (riesgo)
- Endpoints de billing y facturación

### 1.5 Vulnerabilidades Críticas Heredadas de Auditoría
- 20 vulnerabilidades de dependencias (npm audit)
- Sin tests automatizados (0% cobertura)
- Rate limiting insuficiente
- Secrets potencialmente en control de versiones

---

## 2. Arquitectura Propuesta

### 2.1 Nuevos Roles (RBAC Extendido)

```
SUPER_ADMIN          ← Solo operaciones críticas de plataforma
JEFE                 ← Gestión de equipos, reportes ejecutivos
ADMIN_TENANT         ← Administración de su tenant
ALMACEN              ← Gestión de inventario/warehouse
REPARTO              ← Logística y entregas
VENTAS               ← Pipeline y prospección
TESORERIA            ← Pagos y cobranzas
FACTURACION          ← Emisión de facturas
SOPORTE_INTERNO      ← Escalación y troubleshooting
```

### 2.2 Modelo de Permisos (Granular)

Por cada rol, matriz explícita de permisos:

```
tenant.read
tenant.create (SUPER_ADMIN only)
tenant.update (SUPER_ADMIN, ADMIN_TENANT con scope)
tenant.delete (SUPER_ADMIN only)

users.read (por tenant)
users.create (ADMIN_TENANT, JEFE)
users.update (ADMIN_TENANT, JEFE con scope)
users.disable
users.audit_view

billing.read (TESORERIA, JEFE)
billing.manage (TESORERIA, JEFE)
billing.export

warehouse.read (ALMACEN, JEFE)
warehouse.modify (ALMACEN)
warehouse.audit

delivery.read (REPARTO, JEFE)
delivery.manage (REPARTO)

sales.read (VENTAS, JEFE)
sales.create (VENTAS)
sales.export (JEFE)

security.read (ADMIN_TENANT, SUPER_ADMIN)
security.manage (SUPER_ADMIN)
security.audit (SUPER_ADMIN, SOPORTE_INTERNO)

admin.provisionTenant (SUPER_ADMIN)
admin.featureFlags.manage (SUPER_ADMIN)
admin.breakGlass.use (SOPORTE_INTERNO, SUPER_ADMIN)
admin.logs.view (SUPER_ADMIN, SOPORTE_INTERNO)
```

### 2.3 Arquitectura de Autorización Central

```
src/security/
├── authorization/
│   ├── permission-registry.ts       (definición de permisos)
│   ├── roles.ts                     (definición de roles)
│   ├── policies.ts                  (reglas de acceso)
│   ├── context.ts                   (contexto de solicitud)
│   ├── authorize.ts                 (evaluador de permisos)
│   ├── requirePermission.ts         (middleware de permisos)
│   ├── requireSuperAdmin.ts         (middleware SuperAdmin)
│   ├── breakGlassOverride.ts        (override temporal controlado)
│   └── auditAccess.ts               (logging de acceso)
├── audit/
│   ├── accessLog.ts                 (persistencia de eventos)
│   ├── accessGovernance.ts          (dashboard de gobernanza)
│   └── incidentResponse.ts          (respuesta a incidentes)
├── errors/
│   ├── errorCatalog.ts              (catálogo de errores)
│   ├── errorHandler.ts              (normalización de errores)
│   └── errorMessages.ts             (mensajes seguros)
└── features/
    ├── featureFlags.ts              (feature flags seguros)
    └── constants.ts                 (constantes de seguridad)
```

### 2.4 Políticas Críticas

**DENY BY DEFAULT**
- Toda solicitud parte de "denegada"
- Solo se permite si:
  1. Usuario autenticado
  2. Sesión válida
  3. Tenant activo
  4. Rol permitido
  5. Permiso granular present
  6. Recurso pertenece al tenant
  7. No violado rate limit
  8. Estado compatible

**Acciones Sensibles Require:**
- Reautenticación reciente (< 5 min)
- Motivo obligatorio
- Confirmación explícita
- Trazabilidad inmediata
- Expiración del override (si aplica)

**Break-Glass (Solo para Soporte)**
```typescript
interface BreakGlassOverride {
  enabled: boolean;
  actorUserId: string;
  reason: string;           // Motivo audit obligatorio
  scope: string[];          // Qué puede hacer (ej: ["users.disable", "security.audit"])
  tenantId: string;         // Limitado a un tenant
  expiresAt: Date;          // Máx 1 hora
  approvedBy?: string;      // Quién autorizó
  auditTrail: AuditEvent[]; // Log completo
}
```

---

## 3. Hallazgos de Seguridad Crítica

### 3.1 Vulnerabilidades de Dependencias
**20 total:** 13 high + 4 moderate en frontend

**Acción:** Actualizar inmediatamente, evaluar compatibilidad

### 3.2 Endpoints Sin Autorización
- `/api/debug/*` - expuesto en TODOS los entornos
- `/api/admin/init` - solo valida token simple, no tenant
- Endpoints CRUD sin validar rol + permiso combinado

### 3.3 Rate Limiting Insuficiente
- Login: sí, pero no es aggressive
- MFA: no existe
- Password reset: no existe
- Admin operations: NO

### 3.4 Ausencia de Tests
- 0% cobertura automática
- No hay tests de autorización
- No hay tests de edge cases

---

## 4. Plan de Implementación Detallado

### Fase 1: Planificación ✓ (EN PROGRESO)
1. ✅ Auditar código real
2. ✅ Crear este documento
3. ⏳ Crear error-catalog.md
4. ⏳ Crear permission-matrix.md
5. ⏳ Marcar bypasses inseguros

### Fase 1.5: Setup Inicial
1. Instalar dependencias
2. Ejecutar auditorías base (lint, typecheck, test)
3. Crear estructura de carpetas
4. Crear feature flags seguros
5. Commit inicial

### Fase 2: Desarrollo Core
1. **Semana 1:** Seguridad Crítica
   - Actualizar dependencias (npm audit fix)
   - Implementar authorize central
   - Remover secretos del código
   - Eliminar /debug routes en producción

2. **Semana 2:** Modelo de Permisos
   - Definir roles nuevos
   - Crear matriz de permisos
   - Implementar requirePermission() middleware
   - Proteger TODOS los endpoints

3. **Semana 3:** Rate Limiting y MFA
   - Rate limiting by endpoint
   - MFA básico (TOTP)
   - Lockout después de N fallos

4. **Semana 4:** Auditoría y Break-Glass
   - Access audit trail
   - Break-glass override system
   - Access governance dashboard

### Fase 3: QA y Pulido
1. Verificar linter, typecheck, build
2. Testear todos los flujos críticos
3. Validar permisos por rol
4. Revisar que no hay bypasses activos

### Fase 4: Tests Automatizados
1. Tests de login/logout
2. Tests de MFA
3. Tests de permiso por rol
4. Tests de break-glass expiration
5. Cobertura mínima: 70% en auth/security

### Fase Final: Documentación
1. README actualizado
2. Guía de operación segura
3. Matriz de roles en docs
4. Runbook de incidentes

---

## 5. Stack Tecnológico

**Backend:**
- Express + TypeScript
- Middleware centralizado de autorización
- PostgreSQL para audit trail
- Redis para rate limiting (si está disponible)

**Frontend:**
- React + TypeScript
- Route guards por rol
- Components condicionales por permiso

**Seguridad:**
- JWT + Refresh Token
- TOTP para MFA
- Bcrypt para hashing
- Rate Limiting
- Audit Trail en DB

---

## 6. Reglas Inquebrantables

1. ❌ NUNCA aceptar "aceptar todo sí o sí"
2. ❌ NUNCA desactivar validaciones
3. ❌ NUNCA saltarse autorización
4. ❌ NUNCA hardcodear tokens
5. ✅ SIEMPRE deny by default
6. ✅ SIEMPRE auditar acciones sensibles
7. ✅ SIEMPRE limitar scope de overrides
8. ✅ SIEMPRE validar en API (no solo en UI)

---

## 7. Cronograma Estimado

| Fase | Duración | Status |
|------|----------|--------|
| Planificación | 2-3 h | 🔄 EN PROGRESO |
| Setup | 1-2 h | ⏳ Pendiente |
| Desarrollo Core | 3-4 sem | ⏳ Pendiente |
| QA | 1 sem | ⏳ Pendiente |
| Tests | 1-2 sem | ⏳ Pendiente |
| Docs | 2-3 h | ⏳ Pendiente |
| **Total** | **4-6 sem** | - |

---

**Próximo paso:** Crear error-catalog.md y permission-matrix.md
