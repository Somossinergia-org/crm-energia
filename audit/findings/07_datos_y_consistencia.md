# 07 - Datos y Consistencia

## AUDIT-DATA-001: Falta de Índices en Consultas Frecuentes

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Base de Datos/Performance

### Descripción
Posibles consultas N+1 o falta de índices en campos frecuentemente filtrados.

### Evidencia
- Archivo: `backend/src/models/prospect.model.ts`
- Filtros comunes: `estado`, `prioridad`, `temperatura`, `categoria`, `provincia`
- Migración: índices solo en `created_at`, `updated_at`

### Impacto
- **Negocio**: Consultas lentas afectan UX
- **Técnico**: Alto uso de CPU/memoria en DB
- **Seguridad**: No aplica

### Probabilidad
Alta

### Remediación
```sql
-- Añadir índices en campos de filtro comunes
CREATE INDEX CONCURRENTLY idx_prospects_estado ON prospects(estado);
CREATE INDEX CONCURRENTLY idx_prospects_prioridad ON prospects(prioridad);
CREATE INDEX CONCURRENTLY idx_prospects_temperatura ON prospects(temperatura);
CREATE INDEX CONCURRENTLY idx_prospects_categoria ON prospects(categoria);
CREATE INDEX CONCURRENTLY idx_prospects_provincia ON prospects(provincia);
CREATE INDEX CONCURRENTLY idx_prospects_asignado_a ON prospects(asignado_a);
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-DATA-002: Falta de Constraints en Datos Numéricos

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Base de Datos/Integridad

### Descripción
Campos numéricos sin validación de rangos realistas.

### Evidencia
- Archivo: `backend/migrations/005_prospects.sql`
- Campos: `potencia_p1_kw`, `consumo_anual_kwh`, `gasto_mensual_estimado_eur`
- Sin CHECK constraints para valores positivos o rangos realistas

### Impacto
- **Negocio**: Datos inválidos afectan cálculos
- **Técnico**: Errores en reportes/analytics
- **Seguridad**: No aplica

### Probabilidad
Media

### Remediación
```sql
-- Añadir constraints de integridad
ALTER TABLE prospects ADD CONSTRAINT potencia_p1_positive CHECK (potencia_p1_kw > 0);
ALTER TABLE prospects ADD CONSTRAINT consumo_anual_positive CHECK (consumo_anual_kwh >= 0);
ALTER TABLE prospects ADD CONSTRAINT gasto_mensual_positive CHECK (gasto_mensual_estimado_eur >= 0);
ALTER TABLE prospects ADD CONSTRAINT potencia_realista CHECK (potencia_p1_kw <= 10000);
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-DATA-003: Falta de Soft Delete en Tablas Críticas

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Base de Datos/Integridad

### Descripción
Tablas críticas sin soft delete, riesgo de pérdida de datos por borrados accidentales.

### Evidencia
- Archivo: `backend/migrations/005_prospects.sql`
- No hay campo `deleted_at`
- DELETE físico directo

### Impacto
- **Negocio**: Pérdida irreversible de datos comerciales
- **Técnico**: Dificultad para recovery
- **Seguridad**: No aplica

### Probabilidad
Media

### Remediación
```sql
-- Añadir soft delete
ALTER TABLE prospects ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_prospects_deleted_at ON prospects(deleted_at);

-- Actualizar queries para filtrar deleted_at IS NULL
-- Cambiar DELETE por UPDATE deleted_at = NOW()
```

### Esfuerzo Estimado
**M** (1-2 días)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-DATA-004: Seeds con Datos Hardcodeados

### Severidad
🔵 **LOW**

### Módulo Afectado
Base de Datos/Testing

### Descripción
Seeds contienen datos de ejemplo que podrían confundirse con datos reales.

### Evidencia
- Archivo: `backend/seeds/seed.ts`
- Usuarios: `admin@sinergia.es`, `juan@sinergia.es`, etc.
- Contraseñas: `admin123`, `comercial123`

### Impacto
- **Negocio**: Confusión entre datos de test y reales
- **Técnico**: Dificultad para identificar datos de prueba
- **Seguridad**: Credenciales conocidas

### Probabilidad
Baja

### Remediación
```typescript
// Usar variables de entorno para seeds
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASS = process.env.SEED_ADMIN_PASS || 'changeme123';

// O crear flag para datos de desarrollo
if (process.env.NODE_ENV === 'development') {
  // Crear datos de test
}
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Baja

### Estado
🔄 Pendiente

---

## AUDIT-DATA-005: Falta de Triggers de Auditoría

### Severidad
🔵 **LOW**

### Módulo Afectado
Base de Datos/Seguridad

### Descripción
No hay triggers automáticos para auditar cambios en tablas críticas.

### Evidencia
- Tabla `activity_log` existe pero no hay triggers automáticos
- Cambios manuales solo en algunos controladores

### Impacto
- **Negocio**: Falta trazabilidad de cambios
- **Técnico**: Dificultad para debugging
- **Seguridad**: Cambios no auditados

### Probabilidad
Baja

### Remediación
```sql
-- Crear función de auditoría
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS trigger AS $$
BEGIN
  INSERT INTO activity_log (user_id, action, description, ip_address)
  VALUES (current_setting('app.user_id', true)::uuid, TG_OP, TG_TABLE_NAME || ' ' || TG_OP, current_setting('app.ip', true));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
CREATE TRIGGER prospects_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON prospects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Esfuerzo Estimado
**M** (1-2 días)

### Prioridad
Baja

### Estado
🔄 Pendiente