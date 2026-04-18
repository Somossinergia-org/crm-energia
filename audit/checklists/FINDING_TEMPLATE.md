# Plantilla de Hallazgos

## Estructura Obligatoria por Hallazgo

### ID
**AUDIT-[MÓDULO]-[NÚMERO]**

### Severidad
- 🔴 **CRITICAL**: Riesgo de seguridad, pérdida de datos, indisponibilidad
- 🟠 **HIGH**: Funcionalidad bloqueada, vulnerabilidades exploitables
- 🟡 **MEDIUM**: Degradación de UX, deuda técnica significativa
- 🔵 **LOW**: Mejoras menores, mejores prácticas
- ⚪ **INFO**: Observaciones, recomendaciones no críticas

### Módulo Afectado
- Backend/API
- Frontend/UI
- Base de Datos
- Seguridad
- Rendimiento
- Accesibilidad
- Testing
- Infraestructura

### Descripción
Descripción clara y concisa del hallazgo.

### Evidencia
- Comando ejecutado
- Archivo y línea
- Output/error
- Captura de pantalla (si aplica)

### Impacto
- **Negocio**: Efecto en usuarios, operaciones, compliance
- **Técnico**: Complejidad de implementación, riesgo de regression
- **Seguridad**: Exposición de datos, vulnerabilidades

### Probabilidad
Alta/Media/Baja

### Remediación
Pasos específicos para corregir, con código si aplica.

### Esfuerzo Estimado
- **XS**: < 1 hora
- **S**: 1-4 horas
- **M**: 1-2 días
- **L**: 3-7 días
- **XL**: > 1 semana

### Prioridad
Alta/Media/Baja (basado en impacto × probabilidad ÷ esfuerzo)

### Estado
- 🔄 Pendiente
- ✅ Corregido
- ❌ Rechazado (con justificación)

### Notas Adicionales
Contexto adicional, dependencias, riesgos de corrección.