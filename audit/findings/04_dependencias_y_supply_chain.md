# 04 - Dependencias y Supply Chain

## AUDIT-DEPS-001: Múltiples Dependencias Vulnerables

### Severidad
🔴 **CRITICAL**

### Módulo Afectado
Backend/Supply Chain

### Descripción
16 vulnerabilidades activas en el árbol de dependencias, incluyendo ataques de ReDoS, command injection y DoS.

### Evidencia
- Comando: `npm audit --audit-level=moderate`
- Total: 16 vulnerabilidades (3 moderate, 13 high)
- Paquetes afectados:
  - `ajv`: ReDoS via $data option
  - `basic-ftp`: FTP Command Injection
  - `minimatch`: ReDoS via wildcards
  - `nodemailer`: SMTP Command Injection
  - `path-to-regexp`: ReDoS
  - `smol-toml`: DoS via comments
  - `undici`: HTTP Request Smuggling

### Impacto
- **Negocio**: Riesgo de downtime, pérdida de confianza
- **Técnico**: Posible RCE, data exfiltration
- **Seguridad**: Múltiples vectores de ataque

### Probabilidad
Alta (dependencias en uso activo)

### Remediación
```bash
# Intentar fixes automáticos primero
npm audit fix

# Para vulnerabilidades críticas que requieren breaking changes
npm audit fix --force

# Verificar funcionalidad después de updates
npm test
npm run build
```

### Esfuerzo Estimado
**M** (1-2 días)

### Prioridad
Alta

### Estado
🔄 Pendiente

---

## AUDIT-DEPS-002: Dependencias No Utilizadas

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/Mantenibilidad

### Descripción
Posibles dependencias instaladas pero no utilizadas, aumentando superficie de ataque.

### Evidencia
- Comando: `npm list --depth=0` vs código fuente
- Candidatos potenciales:
  - `pgvector`: No detectado en código actual
  - `puppeteer`: Solo en dependencias, verificar uso
  - `winston`: Morgan está activo, winston podría ser redundante

### Impacto
- **Negocio**: Bundle size innecesario
- **Técnico**: Dependencias transitivas vulnerables
- **Seguridad**: Más código = más riesgos

### Probabilidad
Media

### Remediación
```bash
# Analizar uso real
npx depcheck

# Remover no utilizadas
npm uninstall <package>
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-DEPS-003: Versiones de Dependencias Desactualizadas

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Backend/Mantenibilidad

### Descripción
Algunas dependencias podrían tener versiones más recientes con mejoras de seguridad y performance.

### Evidencia
- `express`: v4.18.2 (latest: 4.19.x)
- `@types/express`: v4.17.25 (podría actualizarse)
- `typescript`: v5.9.3 (latest: 5.10.x)

### Impacto
- **Negocio**: Funcionalidades nuevas no disponibles
- **Técnico**: Posibles bugs corregidos no aplicados
- **Seguridad**: Fixes de seguridad pendientes

### Probabilidad
Baja

### Remediación
```bash
# Actualizar selectivamente
npm update express @types/express typescript

# Verificar compatibilidad
npm run build
npm test
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-DEPS-004: Falta de Lockfile en Frontend

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Frontend/Supply Chain

### Descripción
Frontend tiene package-lock.json pero no se verificó consistencia de instalación.

### Evidencia
- Archivo: `frontend/package-lock.json` existe
- Comando: `npm ci` no ejecutado en verificación
- ESLint no instalado en devDependencies

### Impacto
- **Negocio**: Instalaciones inconsistentes
- **Técnico**: Comportamiento impredecible
- **Seguridad**: Versiones transitivas variables

### Probabilidad
Media

### Remediación
```bash
cd frontend
npm ci
npm audit
npm run build
```

### Esfuerzo Estimado
**XS** (< 1 hora)

### Prioridad
Media

### Estado
🔄 Pendiente