import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as UserModel from '../models/user.model';

// GET /api/users
export const getAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const users = await UserModel.findAll();
  res.json({ success: true, data: users });
});

// GET /api/users/:id
export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return;
  }
  res.json({ success: true, data: user });
});

// PUT /api/users/:id
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { nombre, apellidos, telefono, foto_url, firma_email, role, activo } = req.body;

  const user = await UserModel.update(req.params.id, {
    nombre,
    apellidos,
    telefono,
    foto_url,
    firma_email,
    role,
    activo,
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return;
  }

  res.json({ success: true, data: user });
});

// PUT /api/users/profile (perfil propio)
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { nombre, apellidos, telefono, foto_url, firma_email } = req.body;

  const user = await UserModel.update(req.user!.id, {
    nombre,
    apellidos,
    telefono,
    foto_url,
    firma_email,
  });

  res.json({ success: true, data: user });
});
