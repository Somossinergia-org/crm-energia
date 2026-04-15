import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import * as ZoneModel from '../models/zone.model';

export const getAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const zones = await ZoneModel.findAll();
  res.json({ success: true, data: zones });
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { nombre, descripcion, color } = req.body;
  if (!nombre) throw new AppError('Nombre requerido', 400);
  const zone = await ZoneModel.create({ nombre, descripcion, color });
  res.status(201).json({ success: true, data: zone });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const zone = await ZoneModel.update(req.params.id, req.body);
  if (!zone) throw new AppError('Zona no encontrada', 404);
  res.json({ success: true, data: zone });
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await ZoneModel.remove(req.params.id);
  if (!deleted) throw new AppError('Zona no encontrada', 404);
  res.json({ success: true, message: 'Zona eliminada' });
});
