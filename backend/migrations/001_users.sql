-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) DEFAULT '',
  telefono VARCHAR(20) DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'comercial'
    CHECK (role IN ('admin', 'comercial', 'supervisor')),
  foto_url TEXT,
  firma_email TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_activo ON users(activo);
