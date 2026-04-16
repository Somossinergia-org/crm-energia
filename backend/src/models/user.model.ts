import { query } from '../config/database';
import { Role } from '../utils/constants';

export interface User {
  id: string;
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  role: Role;
  foto_url: string | null;
  firma_email: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export type UserPublic = Omit<User, 'password'>;

// Buscar usuario por email
export async function findByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1 AND activo = true',
    [email]
  );
  return result.rows[0] || null;
}

// Buscar usuario por ID
export async function findById(id: string): Promise<UserPublic | null> {
  const result = await query<UserPublic>(
    `SELECT id, email, nombre, apellidos, telefono, role, foto_url,
            firma_email, activo, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Crear usuario
export async function create(userData: {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  role: Role;
}): Promise<UserPublic> {
  const result = await query<UserPublic>(
    `INSERT INTO users (email, password, nombre, apellidos, telefono, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, nombre, apellidos, telefono, role, activo, created_at, updated_at`,
    [
      userData.email,
      userData.password,
      userData.nombre,
      userData.apellidos || '',
      userData.telefono || '',
      userData.role,
    ]
  );
  return result.rows[0];
}

// Listar todos los usuarios
export async function findAll(): Promise<UserPublic[]> {
  const result = await query<UserPublic>(
    `SELECT id, email, nombre, apellidos, telefono, role, foto_url,
            activo, created_at, updated_at
     FROM users ORDER BY created_at DESC`
  );
  return result.rows;
}

// Actualizar usuario
export async function update(
  id: string,
  data: Partial<Pick<User, 'nombre' | 'apellidos' | 'telefono' | 'foto_url' | 'firma_email' | 'role' | 'activo'>>
): Promise<UserPublic | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<UserPublic>(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, email, nombre, apellidos, telefono, role, foto_url, firma_email, activo, created_at, updated_at`,
    values
  );
  return result.rows[0] || null;
}

// Actualizar contraseña
export async function updatePassword(id: string, hashedPassword: string): Promise<void> {
  await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [
    hashedPassword,
    id,
  ]);
}

// Guardar refresh token
export async function saveRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date,
  userAgent: string,
  ip: string
): Promise<void> {
  await query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, token, expiresAt, userAgent, ip]
  );
}

// Buscar refresh token
export async function findRefreshToken(token: string): Promise<{
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: Date;
  revoked: boolean;
} | null> {
  const result = await query(
    'SELECT * FROM sessions WHERE refresh_token = $1 AND revoked = false',
    [token]
  );
  return result.rows[0] || null;
}

// Revocar refresh token
export async function revokeRefreshToken(token: string): Promise<void> {
  await query(
    'UPDATE sessions SET revoked = true WHERE refresh_token = $1',
    [token]
  );
}

// Revocar todas las sesiones de un usuario
export async function revokeAllSessions(userId: string): Promise<void> {
  await query(
    'UPDATE sessions SET revoked = true WHERE user_id = $1',
    [userId]
  );
}

// Registrar actividad
export async function logActivity(
  userId: string,
  action: string,
  description: string = '',
  ip: string = ''
): Promise<void> {
  await query(
    `INSERT INTO activity_log (user_id, action, description, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [userId, action, description, ip]
  );
}
