# 03 - Seguridad

## AUDIT-SEC-001: Configuración de Rate Limiting Permisiva en Desarrollo

### Severidad
🟠 **HIGH**

### Módulo Afectado
Backend/Seguridad

### Descripción
La configuración de rate limiting permite bypass cuando `trust proxy` está activado, lo que puede permitir ataques de fuerza bruta en entornos de desarrollo.

### Evidencia
- Archivo: `backend/src/index.ts:35`
- Código: `app.set('trust proxy', true);`
- Archivo: `backend/src/middleware/rateLimiter.ts`
- Logs: `ValidationError: The Express 'trust proxy' setting is true, which allows anyone to trivially bypass IP-based rate limiting`

### Impacto
- **Negocio**: Riesgo de ataques de fuerza bruta a endpoints de autenticación
- **Técnico**: Rate limiting inefectivo en desarrollo, potencial exposición en staging
- **Seguridad**: Ataques DoS posibles, credenciales comprometidas

### Probabilidad
Alta (configuración activa en desarrollo)

### Remediación
```typescript
// En desarrollo local, deshabilitar trust proxy
app.set('trust proxy', process.env.NODE_ENV === 'production');
```

### Esfuerzo Estimado
**XS** (< 1 hora)

### Prioridad
Alta

### Estado
🔄 Pendiente

---

## AUDIT-SEC-002: Dependencias Vulnerables Críticas

### Severidad
🔴 **CRITICAL**

### Módulo Afectado
Backend/Supply Chain

### Descripción
16 vulnerabilidades detectadas en dependencias, incluyendo 13 de alta severidad relacionadas con ReDoS, command injection y DoS.

### Evidencia
- Comando: `npm audit --audit-level=moderate`
- Vulnerabilidades críticas:
  - `basic-ftp`: FTP Command Injection
  - `minimatch`: ReDoS via wildcards
  - `nodemailer`: SMTP Command Injection
  - `path-to-regexp`: ReDoS
  - `undici`: HTTP Request Smuggling

### Impacto
- **Negocio**: Riesgo de compromiso de datos, interrupción de servicio
- **Técnico**: Posible ejecución remota de código
- **Seguridad**: Múltiples vectores de ataque activos

### Probabilidad
Alta (dependencias activas en producción)

### Remediación
```bash
npm audit fix
# Para fixes que requieren cambios breaking:
npm audit fix --force
# Verificar compatibilidad después
```

### Esfuerzo Estimado
**M** (1-2 días, testing incluido)

### Prioridad
Alta

### Estado
🔄 Pendiente

---

## AUDIT-SEC-003: Secrets Expuestos en Control de Versiones

### Severidad
🟠 **HIGH**

### Módulo Afectado
Configuración/Seguridad

### Descripción
Archivo `.env` en repositorio contiene credenciales reales de base de datos y JWT secrets.

### Evidencia
- Archivo: `.env` (líneas 4-8)
- Contenido: `DB_PASSWORD=s30251310S@`, `JWT_SECRET=...`
- Archivo: `backend/.env` contiene credenciales de desarrollo

### Impacto
- **Negocio**: Exposición de datos sensibles si repo es público
- **Técnico**: Credenciales comprometidas
- **Seguridad**: Acceso no autorizado a base de datos

### Probabilidad
Media (depende de visibilidad del repo)

### Remediación
- Mover secrets a variables de entorno del sistema
- Usar `.env.example` solo con placeholders
- Implementar secret management (Vault, AWS Secrets, etc.)

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Alta

### Estado
🔄 Pendiente

---

## AUDIT-SEC-004: Falta de Validación de Input en Uploads

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/File Upload

### Descripción
No se detecta validación específica de tipos de archivo y tamaños en endpoints de upload.

### Evidencia
- Archivo: `backend/src/routes/documents.routes.ts`
- Falta validación de MIME types
- Solo límite global de 10MB sin validación por tipo

### Impacto
- **Negocio**: Posible upload de malware
- **Técnico**: Almacenamiento de archivos no deseados
- **Seguridad**: Ejecución de código remoto vía file inclusion

### Probabilidad
Media

### Remediación
```typescript
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-SEC-005: CORS Configurado con Origen Dinámico

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/CORS

### Descripción
CORS permite cualquier origen en desarrollo, pero usa URL hardcodeada de producción.

### Evidencia
- Archivo: `backend/src/index.ts:38-42`
- Código: `origin: env.FRONTEND_URL`
- env.FRONTEND_URL apunta a localhost en desarrollo

### Impacto
- **Negocio**: Posible CORS errors en desarrollo
- **Técnico**: Configuración inconsistente dev/prod
- **Seguridad**: Exposición potencial si mal configurado

### Probabilidad
Baja

### Remediación
```typescript
origin: process.env.NODE_ENV === 'production'
  ? env.FRONTEND_URL
  : ['http://localhost:5173', 'http://localhost:3000']
```

### Esfuerzo Estimado
**XS** (< 1 hora)

### Prioridad
Baja

### Estado
🔄 Pendiente
