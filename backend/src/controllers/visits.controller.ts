import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import * as VisitModel from '../models/visit.model';

const createSchema = z.object({
  prospect_id: z.string().uuid(),
  titulo: z.string().min(1, 'Titulo requerido'),
  descripcion: z.string().optional().default(''),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  duracion_minutos: z.coerce.number().optional().default(20),
  direccion: z.string().optional().default(''),
  coordenadas_lat: z.coerce.number().optional(),
  coordenadas_lng: z.coerce.number().optional(),
  color: z.string().optional().default('#3b82f6'),
});

// GET /api/visits
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const start = req.query.start as string;
  const end = req.query.end as string;

  if (!start || !end) {
    throw new AppError('Parametros start y end requeridos', 400);
  }

  const visits = await VisitModel.findByDateRange(
    req.user!.id, req.user!.role, start, end
  );

  res.json({ success: true, data: visits });
});

// GET /api/visits/today
export const getToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  const visits = await VisitModel.findToday(req.user!.id);
  res.json({ success: true, data: visits });
});

// GET /api/visits/:id
export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const visit = await VisitModel.findById(req.params.id);
  if (!visit) throw new AppError('Visita no encontrada', 404);
  res.json({ success: true, data: visit });
});

// POST /api/visits
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createSchema.parse(req.body);
  const visit = await VisitModel.create({
    ...data,
    user_id: req.user!.id,
  });
  res.status(201).json({ success: true, data: visit });
});

// PUT /api/visits/:id
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const visit = await VisitModel.update(req.params.id, req.body);
  if (!visit) throw new AppError('Visita no encontrada', 404);
  res.json({ success: true, data: visit });
});

// DELETE /api/visits/:id
export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await VisitModel.remove(req.params.id);
  if (!deleted) throw new AppError('Visita no encontrada', 404);
  res.json({ success: true, message: 'Visita eliminada' });
});
