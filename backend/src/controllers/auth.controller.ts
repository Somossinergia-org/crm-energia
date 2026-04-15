import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as authService from '../services/auth.service';

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  apellidos: z.string().optional(),
  telefono: z.string().optional(),
  role: z.enum(['admin', 'comercial', 'supervisor']).default('comercial'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Minimo 6 caracteres'),
});

// POST /api/auth/login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const result = await authService.login(email, password, userAgent, ip);

  // Guardar refresh token en cookie HttpOnly
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    path: '/api/auth',
  });

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: 'No hay refresh token' });
    return;
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken && req.user) {
    await authService.logout(refreshToken, req.user.id);
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ success: true, message: 'Sesion cerrada' });
});

// POST /api/auth/register (solo admin)
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data);

  res.status(201).json({
    success: true,
    data: user,
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { findById } = await import('../models/user.model');
  const user = await findById(req.user!.id);

  res.json({
    success: true,
    data: user,
  });
});

// POST /api/auth/change-password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  await authService.changePassword(req.user!.id, currentPassword, newPassword);

  res.json({
    success: true,
    message: 'Contraseña actualizada correctamente',
  });
});
