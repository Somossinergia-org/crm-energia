# CRM Energia - Somos Sinergia

CRM comercial para gestion de prospectos PYME en el sector energetico.

## Requisitos

- Node.js 20+
- Docker Desktop (para PostgreSQL y Redis)

## Instalacion rapida

```bash
# 1. Levantar PostgreSQL y Redis
docker-compose up -d postgres redis

# 2. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# 3. Ejecutar migrations y seed
cd ../backend
npm run migrate
npm run seed

# 4. Arrancar backend y frontend
npm run dev          # backend en http://localhost:3000
cd ../frontend
npm run dev          # frontend en http://localhost:5173
```

## Credenciales de prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@sinergia.es | admin123 | Admin |
| juan@sinergia.es | comercial123 | Comercial |
| maria@sinergia.es | comercial123 | Comercial |
| pedro@sinergia.es | supervisor123 | Supervisor |

## Variables de entorno

Ver `.env.example` para todas las variables disponibles.

## API Endpoints (Fase 1)

- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Renovar token
- `POST /api/auth/logout` — Cerrar sesion
- `GET /api/auth/me` — Perfil actual
- `POST /api/auth/register` — Crear usuario (admin)
- `GET /api/users` — Listar usuarios (admin/supervisor)
- `GET /api/health` — Health check
