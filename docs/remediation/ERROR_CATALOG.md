# Catálogo de Errores - CRM Energía

**Versión:** 1.0
**Última Actualización:** Abril 2026

## Propósito

Centralizar todos los códigos de error del sistema con:
- Códigos únicos y predecibles
- Mensajes seguros para cliente
- Acciones correctivas
- Logging estructurado

---

## 1. Errores de Autenticación (AUTH_*)

### AUTH_REQUIRED (401)
**Código:** `AUTH_REQUIRED`
**Mensaje al Cliente:** "Se requiere autenticación"
**Causa:** Token ausente o inválido
**Log:** `user.id=null, endpoint=xxx, reason=no_token`
**Acción Correctiva:** Redirigir a /login

### AUTH_TOKEN_EXPIRED (401)
**Código:** `AUTH_TOKEN_EXPIRED`
**Mensaje al Cliente:** "Tu sesión ha expirado. Por favor inicia sesión de nuevo."
**Causa:** JWT expiró
**Log:** `user.id=xxx, endpoint=xxx, reason=token_expired, age=120m`
**Acción Correctiva:** Usar refresh token; si no funciona, redirigir a /login

### AUTH_TOKEN_INVALID (401)
**Código:** `AUTH_TOKEN_INVALID`
**Mensaje al Cliente:** "Token inválido"
**Causa:** Token no puede verificarse (malformed, wrong signature, etc.)
**Log:** `user.id=null, endpoint=xxx, reason=invalid_signature`
**Acción Correctiva:** Logout, limpiar cookies, redirigir a /login

### AUTH_MFA_REQUIRED (403)
**Código:** `AUTH_MFA_REQUIRED`
**Mensaje al Cliente:** "Autenticación de dos factores requerida"
**Causa:** Usuario debe completar MFA
**Log:** `user.id=xxx, mfa_enabled=true, mfa_verified=false`
**Acción Correctiva:** Navegar a /mfa-verify

### AUTH_MFA_INVALID (403)
**Código:** `AUTH_MFA_INVALID`
**Mensaje al Cliente:** "Código de verificación inválido"
**Causa:** Código TOTP incorrecto o expirado
**Log:** `user.id=xxx, attempt=2/3, expires_in=25s`
**Acción Correctiva:** Permitir reintentar; lockout después de 3 fallos

### AUTH_ACCOUNT_LOCKED (403)
**Código:** `AUTH_ACCOUNT_LOCKED`
**Mensaje al Cliente:** "Cuenta bloqueada por razones de seguridad. Contacta al soporte."
**Causa:** Demasiados intentos fallidos de login/MFA
**Log:** `user.id=xxx, reason=failed_attempts, attempts=5, locked_until=2026-04-17T14:30Z`
**Acción Correctiva:** Mostrar tiempo de desbloqueo; opción de "He olvidado la contraseña"

### AUTH_SESSION_INVALID (401)
**Código:** `AUTH_SESSION_INVALID`
**Mensaje al Cliente:** "La sesión no es válida o ha sido revocada"
**Causa:** Sesión en DB fue revocada o no existe
**Log:** `user.id=xxx, session.id=yyy, reason=revoked_or_not_found`
**Acción Correctiva:** Logout y redirigir a /login

---

## 2. Errores de Autorización (ACCESS_*)

### ACCESS_DENIED (403)
**Código:** `ACCESS_DENIED`
**Mensaje al Cliente:** "No tienes permiso para realizar esta acción"
**Causa:** Usuario autenticado pero rol/permiso insuficiente
**Log:** `user.id=xxx, user.role=comercial, required_role=admin, resource=users.create`
**Acción Correctiva:** Mostrar error, no permitir reintento

### ACCESS_TENANT_MISMATCH (403)
**Código:** `ACCESS_TENANT_MISMATCH`
**Mensaje al Cliente:** "No tienes acceso a este recurso"
**Causa:** Usuario intenta acceder a recurso de otro tenant
**Log:** `user.id=xxx, user.tenant=A, resource.tenant=B, resource.id=yyy`
**Acción Correctiva:** Bloquear silenciosamente, registrar intento sospechoso

### ACCESS_RESOURCE_MISMATCH (403)
**Código:** `ACCESS_RESOURCE_MISMATCH`
**Mensaje al Cliente:** "El recurso no existe o no tienes acceso"
**Causa:** Recurso no pertenece a usuario/tenant o no existe
**Log:** `user.id=xxx, resource.type=prospect, resource.id=yyy, reason=not_found_or_forbidden`
**Acción Correctiva:** Devolver 404 (no confirmar si existe pero no tienes acceso)

### ACCESS_RATE_LIMITED (429)
**Código:** `ACCESS_RATE_LIMITED`
**Mensaje al Cliente:** "Demasiadas solicitudes. Intenta en unos momentos."
**Causa:** Rate limit excedido para endpoint/usuario
**Log:** `user.id=xxx, endpoint=xxx, limit=10/minute, remaining=0, reset_at=2026-04-17T14:31Z`
**Acción Correctiva:** Mostrar tiempo de espera (Retry-After header)

### ACCESS_FEATURE_FLAG_DISABLED (403)
**Código:** `ACCESS_FEATURE_FLAG_DISABLED`
**Mensaje al Cliente:** "Esta funcionalidad no está disponible en tu región/plan"
**Causa:** Feature flag desactivado
**Log:** `user.id=xxx, feature=ai_agents, flag_value=false, env=production`
**Acción Correctiva:** Mostrar mensaje educativo

---

## 3. Errores de Validación (VALIDATION_*)

### VALIDATION_ERROR (400)
**Código:** `VALIDATION_ERROR`
**Mensaje al Cliente:** "Datos inválidos: [detalle específico del campo]"
**Causa:** Body no pasa esquema Zod/validación
**Log:** `endpoint=xxx, field=email, error=invalid_format`
**Acción Correctiva:** Mostrar errores por campo en UI

### VALIDATION_PASSWORD_WEAK (400)
**Código:** `VALIDATION_PASSWORD_WEAK`
**Mensaje al Cliente:** "La contraseña no cumple los requisitos: mínimo 8 caracteres, incluye mayúscula, número y símbolo"
**Causa:** Password no es suficientemente fuerte
**Log:** `user.id=xxx, password_strength=2/5`
**Acción Correctiva:** Mostrar requisitos, permitir reintentar

### VALIDATION_EMAIL_ALREADY_EXISTS (409)
**Código:** `VALIDATION_EMAIL_ALREADY_EXISTS`
**Mensaje al Cliente:** "Este email ya está registrado"
**Causa:** Intento de registro con email duplicado
**Log:** `email=xxx@xxx.com, reason=duplicate_email`
**Acción Correctiva:** Sugerir "¿Ya tienes cuenta? Inicia sesión" o reset password

---

## 4. Errores de Estado (STATE_*)

### STATE_INVALID_TRANSITION (400)
**Código:** `STATE_INVALID_TRANSITION`
**Mensaje al Cliente:** "No se puede cambiar el estado de aquí a allá"
**Causa:** Transición de estado no permitida
**Log:** `resource.type=prospect, resource.id=xxx, current_state=rechazado, requested_state=oferta_enviada, valid_transitions=[volver_llamar,perdido]`
**Acción Correctiva:** Mostrar transiciones válidas

### STATE_RESOURCE_DELETED (410)
**Código:** `STATE_RESOURCE_DELETED`
**Mensaje al Cliente:** "El recurso ha sido eliminado o no está disponible"
**Causa:** Recurso fue soft-deleted o realmente eliminado
**Log:** `resource.type=prospect, resource.id=xxx, deleted_at=2026-04-16T10:00Z`
**Acción Correctiva:** Mostrar error, redirigir a lista

---

## 5. Errores de Dependencias (DEPENDENCY_*)

### DEPENDENCY_DATABASE_ERROR (500)
**Código:** `DEPENDENCY_DATABASE_ERROR`
**Mensaje al Cliente:** "Error de conectividad. Intenta en unos momentos."
**Causa:** Query falló, conexión perdida, timeout
**Log:** `error=query_timeout, query=SELECT * FROM prospects, duration=30s, user.id=xxx`
**Acción Correctiva:** Retry automático; si persiste, mostrar error

### DEPENDENCY_EXTERNAL_SERVICE_ERROR (502)
**Código:** `DEPENDENCY_EXTERNAL_SERVICE_ERROR`
**Mensaje al Cliente:** "Servicio externo no disponible. Intenta después."
**Causa:** Google AI, Gmail, etc. no responden
**Log:** `service=google_ai, error=timeout, duration=30s, user.id=xxx`
**Acción Correctiva:** Mostrar error genérico; permitir reintento

---

## 6. Errores Internos (INTERNAL_*)

### INTERNAL_ERROR (500)
**Código:** `INTERNAL_ERROR`
**Mensaje al Cliente:** "Error interno. Los administradores han sido notificados."
**Causa:** Excepción no manejada
**Log:** `error.stack=..., request.id=xxx, user.id=yyy, endpoint=zzz`
**Acción Correctiva:** Mostrar ID de error para soporte; log completo al servidor

### INTERNAL_CONFIG_ERROR (500)
**Código:** `INTERNAL_CONFIG_ERROR`
**Mensaje al Cliente:** "Error de configuración del servidor"
**Causa:** Variable de entorno faltante, configuración inválida
**Log:** `error=missing_env_var, var_name=DATABASE_URL`
**Acción Correctiva:** No arrancar la aplicación; alertar a DevOps

---

## 7. Respuesta Normalizada

Todos los endpoints deben devolver:

### Success (200, 201, 204)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-04-17T14:25:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error (4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "No tienes permiso para realizar esta acción",
    "statusCode": 403
  },
  "meta": {
    "timestamp": "2026-04-17T14:25:00Z",
    "requestId": "req_abc123"
  }
}
```

**NUNCA devolver:**
- Stack traces
- SQL queries
- Rutas internas
- Información de arquitectura
- Detalles que revelen si existe un recurso

---

## 8. Mapping de Errores Heredados

| Código Anterior | Nuevo Código | Razón |
|-----------------|--------------|-------|
| 401 genérico | AUTH_REQUIRED | Precisión |
| 403 genérico | ACCESS_DENIED | Precisión |
| ValidationError | VALIDATION_ERROR | Consistencia |
| DbError | DEPENDENCY_DATABASE_ERROR | Consistencia |

---

## 9. Implementación

### Backend
```typescript
// src/security/errors/errorCatalog.ts
export const ERROR_CODES = {
  AUTH_REQUIRED: { code: 'AUTH_REQUIRED', status: 401, message: '...' },
  AUTH_TOKEN_EXPIRED: { code: 'AUTH_TOKEN_EXPIRED', status: 401, message: '...' },
  // ... etc
} as const;

// middleware/errorHandler.ts
export function handleError(err: Error, req: Request, res: Response) {
  const errorResponse = normalizeError(err);
  logError(errorResponse, req);
  res.status(errorResponse.status).json(errorResponse);
}
```

### Frontend
```typescript
// services/errors.ts
export function handleApiError(error: AxiosError) {
  const code = error.response?.data?.error?.code;
  const handler = errorHandlers[code];
  if (handler) {
    handler(error);
  }
}
```

---

**Status:** ✅ Completo - Listo para implementación
