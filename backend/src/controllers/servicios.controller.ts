import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { serviciosModel } from '../models/servicios.model';
import { query } from '../config/database';

// Verificar que el comercial tiene acceso al prospecto
async function checkProspectAccess(prospectId: string, userId: string, role: string): Promise<boolean> {
  if (role !== 'comercial') return true;
  const result = await query(
    `SELECT 1 FROM prospects WHERE id = $1 AND asignado_a = $2`,
    [prospectId, userId]
  );
  return result.rows.length > 0;
}

// Si un servicio pasa a 'contratado', marcar el prospecto como cliente
async function syncProspectStatus(prospectId: string) {
  const check = await query(
    `SELECT COUNT(*) as c FROM prospect_servicios WHERE prospect_id = $1 AND estado = 'contratado'`,
    [prospectId]
  );
  if (parseInt(check.rows[0].c) > 0) {
    await query(
      `UPDATE prospects SET estado = 'contrato_firmado', fecha_conversion = COALESCE(fecha_conversion, NOW()), updated_at = NOW()
       WHERE id = $1 AND estado != 'contrato_firmado'`,
      [prospectId]
    );
  }
}

export const getByProspect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hasAccess = await checkProspectAccess(req.params.prospectId, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'No tienes acceso a este prospecto' });

    const servicios = await serviciosModel.getByProspect(req.params.prospectId);
    res.json({ data: servicios });
  } catch (e) { next(e); }
};

export const upsert = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hasAccess = await checkProspectAccess(req.body.prospect_id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'No tienes acceso a este prospecto' });

    const servicio = await serviciosModel.upsert(req.body);
    if (servicio.estado === 'contratado') {
      await syncProspectStatus(servicio.prospect_id);
    }
    res.json({ data: servicio });
  } catch (e) { next(e); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Verificar acceso al servicio existente
    const existing = await serviciosModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });

    const hasAccess = await checkProspectAccess(existing.prospect_id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'No tienes acceso a este servicio' });

    const servicio = await serviciosModel.update(req.params.id, req.body);
    if (servicio && servicio.estado === 'contratado') {
      await syncProspectStatus(servicio.prospect_id);
    }
    res.json({ data: servicio });
  } catch (e) { next(e); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await serviciosModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });

    const hasAccess = await checkProspectAccess(existing.prospect_id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'No tienes acceso a este servicio' });

    await serviciosModel.delete(req.params.id);
    res.json({ message: 'Servicio eliminado' });
  } catch (e) { next(e); }
};

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await serviciosModel.getStatsByServicio(req.user!.id, req.user!.role);
    res.json({ data: stats });
  } catch (e) { next(e); }
};

export const getAllWithProspect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = {
      servicio: req.query.servicio as string,
      estado: req.query.estado as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    };
    const result = await serviciosModel.findAllWithProspect(filters, req.user!.id, req.user!.role);
    res.json(result);
  } catch (e) { next(e); }
};

export const getGlobalStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await serviciosModel.getGlobalStats(req.user!.id, req.user!.role);
    res.json({ data: stats });
  } catch (e) { next(e); }
};
