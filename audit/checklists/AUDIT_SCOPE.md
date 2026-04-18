# Alcance de la Auditoría

## Módulos Incluidos

### Backend (Node.js/TypeScript)
- ✅ Autenticación y autorización (JWT, bcrypt)
- ✅ API REST (Express, validación con Zod)
- ✅ Base de datos (PostgreSQL, migraciones)
- ✅ Caché y colas (Redis, BullMQ)
- ✅ Integraciones (Gmail, Gemini AI)
- ✅ Seguridad (Helmet, CORS, rate limiting)
- ✅ Logging y monitoreo (Morgan)

### Frontend (React/TypeScript)
- ✅ Autenticación y routing
- ✅ Gestión de estado (TanStack Query)
- ✅ Formularios (React Hook Form)
- ✅ UI/UX (Tailwind CSS, componentes)
- ✅ Mapas y calendario (Leaflet, FullCalendar)

### Infraestructura
- ✅ Docker (backend, frontend, postgres, redis)
- ✅ Migraciones y seeds
- ✅ Configuración de entorno

## Módulos Excluidos
- ❌ Infraestructura cloud (Railway, Vercel, Supabase)
- ❌ Integraciones externas activas
- ❌ Datos productivos
- ❌ Despliegues automatizados

## Supuestos
- El entorno local refleja la funcionalidad core
- Las credenciales de desarrollo son seguras
- No se modificarán datos productivos
- El foco es en calidad y seguridad del código

## Flujos Críticos Auditados
1. Login y autenticación
2. Dashboard principal
3. Gestión de prospectos (CRUD)
4. Historial de contactos
5. Programación de visitas
6. Gestión de documentos
7. Reportes y analytics
8. Administración de usuarios