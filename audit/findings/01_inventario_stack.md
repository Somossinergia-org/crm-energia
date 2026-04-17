# 01 - Inventario del Stack Tecnológico

## Información General
- **Nombre del Proyecto:** CRM Energía
- **Versión:** 1.0.0
- **Tipo:** Aplicación web full-stack
- **Arquitectura:** Cliente-Servidor con API REST
- **Repositorio:** Git (branch develop)
- **CI/CD:** No detectado (archivos de despliegue manual)

## Backend (Node.js/TypeScript)
### Runtime y Framework
- **Node.js:** v24.14.0 (desarrollo)
- **Express.js:** v4.18.2
- **TypeScript:** v5.9.3
- **TSX:** v4.21.0 (desarrollo)

### Base de Datos
- **PostgreSQL:** v15+ (Docker)
- **Redis:** v7+ (Docker, BullMQ)
- **ORM/Query Builder:** pg (directo)
- **Migraciones:** SQL files + tsx runner

### Autenticación y Seguridad
- **JWT:** jsonwebtoken v9.0.2
- **Hashing:** bcryptjs v2.4.3
- **Rate Limiting:** express-rate-limit v7.1.5
- **CORS:** cors v2.8.5
- **Helmet:** v7.1.0
- **Cookies:** cookie-parser v1.4.6

### APIs y Integraciones
- **Google AI:** @google/generative-ai v0.21.0
- **Google APIs:** googleapis v140.0.1
- **Email:** nodemailer v6.10.1
- **PDF Parsing:** pdf-parse v1.1.1
- **Puppeteer:** v24.40.0
- **Excel:** exceljs v4.4.0

### Utilidades
- **Validación:** zod v3.25.76
- **Logging:** morgan v1.10.0, winston v3.19.0
- **File Upload:** multer v1.4.5-lts.1
- **UUID:** uuid v9.0.1
- **PG Vector:** pgvector v0.2.1

### Comandos de Desarrollo
```bash
cd backend
npm run dev          # tsx watch src/index.ts
npm run build        # tsc
npm start           # node dist/index.js
npm run migrate     # tsx src/config/migrate.ts
npm run seed        # tsx seeds/seed.ts
npm run lint        # eslint src/
```

## Frontend (React/TypeScript)
### Runtime y Framework
- **React:** v18.2.0
- **Vite:** v5.4.21
- **TypeScript:** v5.9.3
- **React DOM:** v18.3.1

### Estado y Data Fetching
- **TanStack Query:** v5.17.19
- **Zustand:** v4.5.7
- **Axios:** v1.6.5

### UI y UX
- **Tailwind CSS:** v3.4.19
- **React Icons:** v5.0.1
- **React Toastify:** v10.0.6
- **Recharts:** v3.8.1
- **FullCalendar:** v6.1.20
- **Leaflet:** v1.9.4 + react-leaflet v5.0.0

### Formularios y Validación
- **React Hook Form:** v7.49.3
- **Hookform Resolvers:** v3.3.4
- **Zod:** v3.25.76

### Routing
- **React Router DOM:** v6.21.3

### Build Tools
- **Vite Plugin React:** v4.7.0
- **Autoprefixer:** v10.4.27
- **PostCSS:** v8.5.8

### Comandos de Desarrollo
```bash
cd frontend
npm run dev         # vite
npm run build       # tsc && vite build
npm run preview     # vite preview
```

## Infraestructura
### Contenedores
- **Docker Compose:** postgres, redis, backend, frontend
- **Base Images:** node:18-alpine, postgres:15-alpine, redis:7-alpine

### Despliegue
- **Railway:** Configurado
- **Vercel:** Configurado
- **Google Cloud Run:** Scripts disponibles

### Variables de Entorno
- **Desarrollo:** backend/.env, frontend/.env
- **Producción:** .env (Supabase), Railway, Vercel

## Herramientas de Desarrollo
### Linting y Formateo
- **ESLint:** Configurado (backend), pendiente (frontend)
- **Prettier:** Configurado
- **EditorConfig:** Configurado

### Testing
- **Framework:** No detectado (pendiente instalación)
- **Cobertura:** No configurada

### Monitoreo y Observabilidad
- **Logging:** Morgan, Winston
- **Health Checks:** /api/health
- **Métricas:** No configuradas

## Arquitectura de Datos
### Esquema Principal
- **users:** Autenticación y roles
- **prospects:** Clientes potenciales
- **contact_history:** Historial de interacciones
- **visits:** Programación de visitas
- **documents:** Gestión de archivos
- **zones:** Segmentación geográfica
- **activity_log:** Auditoría de acciones
- **sessions:** Sesiones JWT
- **email_templates:** Plantillas de correo

### Migraciones
- **Total:** 13 migraciones SQL
- **Estado:** Todas ejecutadas correctamente
- **Seeds:** Datos iniciales cargados

## Riesgos Iniciales Identificados
1. **ESLint no configurado en frontend** - Requiere instalación
2. **Testing framework ausente** - Cobertura 0%
3. **Dependencias vulnerables** - Pendiente auditoría npm audit
4. **Configuración de seguridad en desarrollo** - Rate limiting permisivo
5. **Secrets en .env** - Credenciales reales expuestas

## Recomendaciones Inmediatas
1. Instalar ESLint en frontend
2. Configurar framework de testing (Vitest)
3. Ejecutar npm audit en ambos proyectos
4. Revisar configuración de rate limiting
5. Mover secrets a variables de entorno seguras