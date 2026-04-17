# Registro de Riesgos - CRM Energía

**Versión:** 1.0  
**Última Actualización:** Abril 2026  
**Estado:** Activo - Seguimiento Continuo  

---

## 1. Riesgos Críticos Heredados (De Auditoría)

### RISK-001: Vulnerabilidades de Dependencias

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🔴 CRÍTICA |
| **Probabilidad** | Alta |
| **Impacto** | Compromiso de datos, RCE, DoS |
| **Estado** | ⏳ Pendiente |

**Vulnerabilidades Identificadas:**
- Backend: 13 high severity (basic-ftp, minimatch, nodemailer, path-to-regexp, undici)
- Frontend: 4 moderate severity (axios, esbuild, follow-redirects)

**Remediación:**
1. Ejecutar `npm audit fix` en ambos proyectos
2. Evaluar breaking changes
3. Testear todos los flujos críticos
4. Implementar en staging primero
5. Desplegar a producción con rollback plan

**Propietario:** Dev Lead  
**Fecha Objetivo:** Semana 1 de implementación  
**Métricas:** npm audit = 0 vulnerabilidades críticas

---

### RISK-002: Ausencia Total de Autorización Centralizada

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🔴 CRÍTICA |
| **Probabilidad** | Alta |
| **Impacto** | Acceso no autorizado a datos sensibles |
| **Estado** | ⏳ Pendiente |

**Problema Actual:**
- No existe middleware central de autorización
- Validaciones dispersas en endpoints
- UI es la única barrera en algunos casos
- Permiso = solo validar rol, no granular

**Remediación:**
1. Crear módulo centralizado en `src/security/authorization/`
2. Implementar `requirePermission()` middleware
3. Definir matriz de permisos por rol
4. Auditar TODOS los endpoints y reproteger
5. Tests de negación por rol

**Propietario:** Security Lead  
**Fecha Objetivo:** Semana 2-3 de implementación  
**Métricas:** 100% de endpoints protegiéndose vía middleware centralizado

---

### RISK-003: Debug Routes Expuesto en Producción

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🔴 CRÍTICA |
| **Probabilidad** | Alta |
| **Impacto** | Exposición de información sensible, bypass de validaciones |
| **Estado** | ⏳ Pendiente |

**Problema Actual:**
- `/api/debug/*` endpoints activos en producción
- Pueden revelar estructura interna, logs sensibles
- Pueden permitir test-login sin validación real

**Remediación:**
1. Crear guard: `if (NODE_ENV === 'production') { return 403; }`
2. O eliminar completamente `/debug` routes en prod
3. Crear endpoints de debugging solo en staging
4. Auditoría de qué se exponía en debug

**Propietario:** Dev Lead  
**Fecha Objetivo:** Semana 1  
**Métricas:** Ningún debug endpoint accesible en producción

---

### RISK-004: Endpoints Administrativos Sin Rate Limiting

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🟠 ALTA |
| **Probabilidad** | Media |
| **Impacto** | DoS, Brute force, Spam |
| **Estado** | ⏳ Pendiente |

**Endpoints Afectados:**
- `/api/auth/login` - sí, pero débil
- `/api/auth/mfa-verify` - NO
- `/api/users/*` (CRUD) - NO
- `/api/admin/*` - NO
- `/api/billing/*` - NO

**Remediación:**
1. Implementar rate limiting por endpoint
2. Login: 5 intentos / 15 minutos
3. MFA: 3 intentos / 5 minutos
4. Admin: 10 intentos / minuto por usuario
5. Global: 100 req/min por IP

**Propietario:** Backend Lead  
**Fecha Objetivo:** Semana 1  
**Métricas:** Todos los endpoints sensibles con rate limiting < 5 req/min

---

### RISK-005: Ausencia de MFA

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🟠 ALTA |
| **Probabilidad** | Media |
| **Impacto** | Account takeover, credential compromise |
| **Estado** | ⏳ Pendiente |

**Problema Actual:**
- Solo validación de email/password
- Sin segundo factor
- Especialmente crítico para ADMIN, SUPER_ADMIN

**Remediación:**
1. Implementar TOTP (Time-based OTP)
2. MFA obligatoria para SUPER_ADMIN, ADMIN_TENANT
3. MFA opcional para JEFE y superior
4. Backup codes para recovery
5. Auditoría de acceso MFA-bypass

**Propietario:** Security Lead  
**Fecha Objetivo:** Semana 3  
**Métricas:** 100% de SUPER_ADMIN con MFA activa

---

### RISK-006: No Existe Auditoría de Acceso

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🟠 ALTA |
| **Probabilidad** | Alta |
| **Impacto** | No trazabilidad de incidentes, compliance violation |
| **Estado** | ⏳ Pendiente |

**Problema Actual:**
- `activity_log` existe pero subutilizado
- Sin logs de acceso denegado
- Sin logs de cambios de permiso
- Sin logs de break-glass

**Remediación:**
1. Crear table `access_audit_log` con schema completo
2. Loguear:
   - Acceso permitido (acción sensible)
   - Acceso denegado (intento de violación)
   - Cambios de permiso
   - Uso de break-glass
   - Cambios de rol
3. Immutable trail (no puede deletarse)
4. Expiración según compliance (2-7 años)

**Propietario:** Security Lead  
**Fecha Objetivo:** Semana 4  
**Métricas:** 100% de accesos sensibles auditados

---

### RISK-007: Secretos Potencialmente en Git

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🔴 CRÍTICA |
| **Probabilidad** | Alta |
| **Impacto** | Exposición de credenciales, key compromise |
| **Estado** | ⏳ Pendiente |

**Acciones Requeridas:**
1. Auditar commit history: `git log -p -S "secret" | grep -i "key\|token\|password"`
2. Usar herramienta: `truffleHog`, `gitGuardian`
3. Si encontrados, rotarlos INMEDIATAMENTE
4. Regenerar .env.example sin valores
5. Crear .gitignore con `*.env` 6. CI/CD pre-commit hooks para detectar secrets

**Propietario:** DevOps Lead  
**Fecha Objetivo:** Antes de cualquier deploy  
**Métricas:** 0 secretos en repositorio

---

## 2. Riesgos de Diseño Identificados

### RISK-008: Modelo de Tenant No Explícito

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🔴 CRÍTICA |
| **Probabilidad** | Media |
| **Impacto** | Data leakage entre tenants |
| **Estado** | ⏳ Pendiente |

**Problema Actual:**
- No existe tabla `tenants`
- Usuarios no tienen `tenant_id` explícito
- Multi-tenant no es seguro

**Remediación:**
1. Crear tabla tenants (id, name, slug, status)
2. Agregar `tenant_id` a tabla users
3. Agregar `tenant_id` a todas las tablas multi-tenant
4. Validar `user.tenantId === resource.tenantId` en TODOS los endpoints
5. Crear índices (tenant_id, user_id, etc.)

**Propietario:** Database Lead  
**Fecha Objetivo:** Semana 2  
**Métricas:** Todos los endpoints validando tenant_id

---

### RISK-009: Falta de Validación en Varias Capas

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🟠 ALTA |
| **Probabilidad** | Alta |
| **Impacto** | Inyección, manipulación de datos |
| **Estado** | ⏳ Pendiente |

**Validaciones Faltantes:**
- Input en frontend (UI-only)
- Input en backend (algunos endpoints)
- Lógica de negocio (estado transitions)
- Output sanitization

**Remediación:**
1. Validación doble: frontend + backend
2. Zod schemas en TODOS los endpoints
3. State machine para transiciones
4. Sanitización de output antes de enviar al cliente

**Propietario:** Backend Lead  
**Fecha Objetivo:** Semana 2-3  
**Métricas:** 100% de inputs validados en backend

---

## 3. Riesgos de Testing

### RISK-010: 0% Cobertura de Tests

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🟠 ALTA |
| **Probabilidad** | Alta |
| **Impacto** | Regresiones no detectadas, bugs en producción |
| **Estado** | ⏳ Pendiente |

**Remediación:**
1. Configurar Vitest (backend) + Jest (frontend)
2. Tests críticos obligatorios:
   - Login flow
   - MFA flow
   - Role-based access
   - Data isolation by tenant
   - Break-glass usage
3. Mínima cobertura: 70% en auth/security

**Propietario:** QA Lead  
**Fecha Objetivo:** Semana 4-5  
**Métricas:** 70% cobertura en security layer

---

## 4. Riesgos Operacionales

### RISK-011: Falta de Disaster Recovery

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🟠 ALTA |
| **Probabilidad** | Baja |
| **Impacto** | Downtime, data loss |
| **Estado** | ⏳ Pendiente |

**Remediación:**
1. Backup de DB diario, almacenado 30 días
2. Restore test semanal
3. Failover plan documentado
4. RTO/RPO definidos

---

### RISK-012: Falta de Monitoreo en Producción

| Aspecto | Detalle |
|---------|---------|
| **Severidad** | 🟡 MEDIA |
| **Probabilidad** | Alta |
| **Impacto** | Incidentes no detectados rápidamente |
| **Estado** | ⏳ Pendiente |

**Remediación:**
1. Logging estructurado con ELK o Sumo Logic
2. Alertas en:
   - Tasa de errores 5xx
   - Acceso denegado > 10 en 5 min
   - Break-glass usage
   - DB query lentitud
3. Dashboard de health

---

## 5. Matriz de Riesgos

```
        Probabilidad
         ↑
    ALTA │  RISK-001  RISK-002  RISK-003  RISK-005  RISK-006
         │  RISK-004            RISK-007  RISK-008  RISK-010
    MED  │                 RISK-011       RISK-009
         │
    BAJA │                                        RISK-012
         └─────────────────────────────→ Impacto
```

---

## 6. Matriz de Remediación

| Risk ID | Prioridad | Sprint | Dueño | % Complete | Blocker |
|---------|-----------|--------|-------|------------|---------|
| RISK-001 | 🔴 Crítica | 1 | Dev Lead | 0% | Sí |
| RISK-002 | 🔴 Crítica | 2-3 | Security Lead | 0% | Sí |
| RISK-003 | 🔴 Crítica | 1 | Dev Lead | 0% | Sí |
| RISK-004 | 🟠 Alta | 1 | Backend Lead | 0% | Sí |
| RISK-005 | 🟠 Alta | 3 | Security Lead | 0% | No |
| RISK-006 | 🟠 Alta | 4 | Security Lead | 0% | No |
| RISK-007 | 🔴 Crítica | PRE-SPRINT | DevOps Lead | 0% | Sí |
| RISK-008 | 🔴 Crítica | 2 | DB Lead | 0% | Sí |
| RISK-009 | 🟠 Alta | 2-3 | Backend Lead | 0% | No |
| RISK-010 | 🟠 Alta | 4-5 | QA Lead | 0% | No |
| RISK-011 | 🟠 Alta | 6+ | DevOps Lead | 0% | No |
| RISK-012 | 🟡 Media | 5 | DevOps Lead | 0% | No |

---

## 7. Definiciones

**Severidad:**
- 🔴 **CRÍTICA:** Compromete seguridad, confidencialidad, disponibilidad
- 🟠 **ALTA:** Afecta funcionalidad crítica, compliance
- 🟡 **MEDIA:** Mejoras importantes, reducen riesgo

**Probabilidad:**
- **Alta:** > 60% de ocurrir o muy fácil explotar
- **Media:** 20-60% de ocurrir
- **Baja:** < 20% de ocurrir

**Impacto:**
- **Alto:** Compromiso de datos, downtime
- **Medio:** Degradación de servicio, exposición limitada
- **Bajo:** Inconveniente, mejora de UI

---

## 8. Revisión de Riesgos

**Cadencia:** Semanal durante implementación, mensual después  
**Dueño:** Security Lead + Product Manager  
**Escalación:** Si un risk blocker no se cierra en su sprint, escalar a CTO  

---

**Status:** ✅ Completo - Listo para seguimiento