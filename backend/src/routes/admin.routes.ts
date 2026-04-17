import { Router, Response } from 'express';
import { query } from '../config/database';
import bcrypt from 'bcryptjs';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Endpoint para inicializar la base de datos: requiere admin autenticado
router.post('/init', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 Iniciando creación de tablas...');

    // Crear extensión UUID
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ Extensión uuid-ossp creada');

    // Crear tabla users
    await query(`
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
      )
    `);
    console.log('✅ Tabla users creada');

    // Crear índices para users
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_activo ON users(activo)');
    console.log('✅ Índices de users creados');

    // Crear tabla sessions
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked BOOLEAN DEFAULT false,
        user_agent TEXT DEFAULT '',
        ip_address VARCHAR(45) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla sessions creada');

    // Crear índices para sessions
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON sessions(revoked)');
    console.log('✅ Índices de sessions creados');

    // Crear tabla activity_log
    await query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla activity_log creada');

    // Crear índices para activity_log
    await query('CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action)');
    console.log('✅ Índices de activity_log creados');

    // Insertar usuario admin
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    await query(
      `INSERT INTO users (email, password, nombre, apellidos, role, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password,
         nombre = EXCLUDED.nombre,
         role = EXCLUDED.role,
         activo = EXCLUDED.activo`,
      ['admin@sinergia.es', hashedPassword, 'Admin', 'System', 'admin', true]
    );
    console.log('✅ Usuario admin creado/actualizado');

    // Verificar tablas
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    res.json({
      success: true,
      message: 'Inicialización completada',
      tables: result.rows.map(r => r.table_name),
    });
  } catch (err: any) {
    console.error('❌ Error en inicialización:', err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
