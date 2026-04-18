import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import * as UserModel from '../models/user.model';
import { AppError } from '../middleware/errorHandler';
import { Role } from '../utils/constants';

// Generar access token (15 min)
function generateAccessToken(user: { id: string; email: string; role: Role; nombre: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, nombre: user.nombre },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

// Generar refresh token (7 días)
function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
  );
}

// Login
export async function login(
  email: string,
  password: string,
  userAgent: string,
  ip: string
) {
  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw new AppError('Email o contraseña incorrectos', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Email o contraseña incorrectos', 401);
  }

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    nombre: user.nombre,
  });

  const refreshToken = generateRefreshToken(user.id);

  // Guardar refresh token en BD
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await UserModel.saveRefreshToken(user.id, refreshToken, expiresAt, userAgent, ip);

  // Log de actividad
  await UserModel.logActivity(user.id, 'login', `Login desde ${userAgent}`, ip);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellidos: user.apellidos,
      role: user.role,
      foto_url: user.foto_url,
    },
  };
}

// Refresh token
export async function refreshAccessToken(refreshToken: string) {
  // Verificar que el token es válido
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Refresh token invalido', 401);
  }

  // Verificar que existe en BD y no está revocado
  const session = await UserModel.findRefreshToken(refreshToken);
  if (!session) {
    throw new AppError('Sesion no encontrada o revocada', 401);
  }

  if (new Date() > session.expires_at) {
    await UserModel.revokeRefreshToken(refreshToken);
    throw new AppError('Refresh token expirado', 401);
  }

  // Obtener usuario
  const user = await UserModel.findById(decoded.id);
  if (!user) {
    throw new AppError('Usuario no encontrado', 401);
  }

  // Generar nuevo access token
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    nombre: user.nombre,
  });

  return { accessToken, user };
}

// Logout
export async function logout(refreshToken: string, userId: string): Promise<void> {
  await UserModel.revokeRefreshToken(refreshToken);
  await UserModel.logActivity(userId, 'logout', 'Cierre de sesion');
}

// Registrar usuario (solo admin)
export async function register(data: {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  role: Role;
}) {
  // Verificar que el email no existe
  const existing = await UserModel.findByEmail(data.email);
  if (existing) {
    throw new AppError('Ya existe un usuario con ese email', 409);
  }

  // Hash de contraseña
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await UserModel.create({
    ...data,
    password: hashedPassword,
  });

  return user;
}

// Cambiar contraseña
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Obtener usuario con su contraseña actual
  const result = await import('../config/database').then(db =>
    db.query('SELECT password FROM users WHERE id = $1', [userId])
  );

  if (!result.rows[0]) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
  if (!isMatch) {
    throw new AppError('Contraseña actual incorrecta', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await UserModel.updatePassword(userId, hashedPassword);
  await UserModel.logActivity(userId, 'cambio_password', 'Contraseña actualizada');
}
