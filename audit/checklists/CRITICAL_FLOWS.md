# Flujos Críticos de Negocio

## 1. Autenticación y Autorización
**Endpoints:** `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`
**Funcionalidad:** Login con email/password, refresh tokens, logout
**Riesgo:** Acceso no autorizado a datos sensibles
**Pruebas:** Login válido/inválido, token expirado, RBAC

## 2. Dashboard Principal
**Ruta:** `/dashboard`
**Funcionalidad:** Métricas generales, resumen de prospectos
**Riesgo:** Información incorrecta, rendimiento lento
**Pruebas:** Carga inicial, actualización de datos

## 3. Gestión de Prospectos
**Endpoints:** `/api/prospects/*`
**Funcionalidad:** CRUD completo, búsqueda, filtros
**Riesgo:** Pérdida de datos comerciales
**Pruebas:** Crear, leer, actualizar, eliminar prospecto

## 4. Historial de Contactos
**Endpoints:** `/api/contacts/*`
**Funcionalidad:** Timeline de interacciones, notas
**Riesgo:** Pérdida de trazabilidad
**Pruebas:** Agregar contacto, ver historial

## 5. Programación de Visitas
**Endpoints:** `/api/visits/*`
**Funcionalidad:** CRUD de visitas, calendario
**Riesgo:** Conflictos de agenda
**Pruebas:** Programar, modificar, cancelar visita

## 6. Gestión de Documentos
**Endpoints:** `/api/documents/*`
**Funcionalidad:** Upload, descarga, gestión de archivos
**Riesgo:** Exposición de documentos sensibles
**Pruebas:** Upload válido, validación de tipos, permisos

## 7. Reportes y Analytics
**Endpoints:** `/api/analytics/*`
**Funcionalidad:** Consultas, exportaciones Excel
**Riesgo:** Datos incorrectos en reportes
**Pruebas:** Generación de reportes, exportación

## 8. Administración de Usuarios
**Endpoints:** `/api/users/*` (admin only)
**Funcionalidad:** Gestión de usuarios, roles
**Riesgo:** Escalada de privilegios
**Pruebas:** Crear usuario, cambiar roles, permisos