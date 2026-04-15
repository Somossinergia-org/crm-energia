import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import * as ContactHistoryModel from '../models/contactHistory.model';
import * as ProspectModel from '../models/prospect.model';

const createSchema = z.object({
  prospect_id: z.string().uuid(),
  tipo: z.enum([
    'llamada', 'visita_presencial', 'whatsapp',
    'email_enviado', 'email_recibido', 'nota_interna',
    'cambio_estado', 'oferta_enviada', 'contrato',
  ]),
  resultado: z.enum(['positivo', 'neutro', 'negativo', 'no_contesto', 'buzon']).optional(),
  nota: z.string().optional().default(''),
  duracion_minutos: z.coerce.number().optional(),
  estado_nuevo: z.string().optional(),
  proxima_accion: z.string().optional().default(''),
  fecha_proxima_accion: z.string().optional(),
});

// GET /api/contacts/prospect/:prospectId
export const getByProspect = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verificar acceso para comercial
  if (req.user!.role === 'comercial') {
    const prospect = await ProspectModel.findById(req.params.prospectId);
    if (!prospect || prospect.asignado_a !== req.user!.id) {
      throw new AppError('No tienes acceso a este prospecto', 403);
    }
  }

  const history = await ContactHistoryModel.findByProspect(req.params.prospectId);
  res.json({ success: true, data: history });
});

// GET /api/contacts/recent
export const getRecent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const history = await ContactHistoryModel.findRecent(req.user!.id, req.user!.role, limit);
  res.json({ success: true, data: history });
});

// GET /api/contacts/today
export const getToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await ContactHistoryModel.countToday(req.user!.id);
  res.json({ success: true, data: stats });
});

// POST /api/contacts
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createSchema.parse(req.body);

  // Verificar que el prospecto existe y acceso
  const prospect = await ProspectModel.findById(data.prospect_id);
  if (!prospect) {
    throw new AppError('Prospecto no encontrado', 404);
  }
  if (req.user!.role === 'comercial' && prospect.asignado_a !== req.user!.id) {
    throw new AppError('No tienes acceso a este prospecto', 403);
  }

  // Si es cambio de estado, actualizar el prospecto
  let estado_anterior: string | undefined;
  if (data.estado_nuevo && data.estado_nuevo !== prospect.estado) {
    estado_anterior = prospect.estado;
    await ProspectModel.updateStatus(data.prospect_id, data.estado_nuevo);
  }

  const entry = await ContactHistoryModel.create({
    ...data,
    user_id: req.user!.id,
    estado_anterior,
  });

  res.status(201).json({ success: true, data: entry });
});

// DELETE /api/contacts/:id
export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await ContactHistoryModel.remove(req.params.id);
  if (!deleted) throw new AppError('Entrada no encontrada', 404);
  res.json({ success: true, message: 'Entrada eliminada' });
});
