import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import {
  generateFollowUpAlerts,
  getUserFollowUpAlerts,
  logFollowUpAction,
  getFollowUpStats,
} from '../services/sales-followup.service';

/**
 * GET /api/sales/followup/alerts
 * Obtener todas las alertas de follow-up (o filtrar por usuario si es admin)
 */
export async function getFollowUpAlertsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.query.user_id as string | undefined;
    const userRole = (req as any).user?.role;

    // Admin puede solicitar alertas de otros usuarios
    // Comerciales/supervisores solo ven sus propias alertas
    let effectiveUserId = (req as any).user?.id;
    if (userId && userRole === 'admin') {
      effectiveUserId = userId;
    }

    const alerts = await getUserFollowUpAlerts(effectiveUserId);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (err) {
    logger.error('Error obteniendo alertas de follow-up:', err);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo alertas de follow-up',
    });
  }
}

/**
 * GET /api/sales/followup/alerts/all
 * Obtener todas las alertas de follow-up del sistema (solo admin)
 */
export async function getAllFollowUpAlertsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Solo administradores pueden ver todas las alertas',
      });
      return;
    }

    const alerts = await generateFollowUpAlerts();

    res.json({
      success: true,
      data: alerts,
    });
  } catch (err) {
    logger.error('Error obteniendo todas las alertas:', err);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo alertas',
    });
  }
}

/**
 * POST /api/sales/followup/action/:prospect_id
 * Registrar una acción de follow-up completada
 * Body: { tipo: 'llamada'|'email_enviado'|'visita_presencial'|'whatsapp', resultado: 'positivo'|'neutro'|'negativo'|'no_contesto', fecha_proxima_accion?: ISO8601 }
 */
export async function logFollowUpActionHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { prospect_id } = req.params;
    const {
      tipo,
      resultado,
      fecha_proxima_accion,
    } = req.body;

    // Validar campos requeridos
    if (!tipo || !resultado) {
      res.status(400).json({
        success: false,
        error: 'Campos requeridos: tipo, resultado',
      });
      return;
    }

    // Validar valores permitidos
    const tiposValidos = ['llamada', 'email_enviado', 'visita_presencial', 'whatsapp'];
    const resultadosValidos = ['positivo', 'neutro', 'negativo', 'no_contesto'];

    if (!tiposValidos.includes(tipo)) {
      res.status(400).json({
        success: false,
        error: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`,
      });
      return;
    }

    if (!resultadosValidos.includes(resultado)) {
      res.status(400).json({
        success: false,
        error: `Resultado inválido. Debe ser uno de: ${resultadosValidos.join(', ')}`,
      });
      return;
    }

    const userId = (req as any).user?.id;
    const proximaAccionDate = fecha_proxima_accion
      ? new Date(fecha_proxima_accion)
      : undefined;

    await logFollowUpAction(
      prospect_id,
      userId,
      tipo as any,
      resultado as any,
      proximaAccionDate
    );

    res.json({
      success: true,
      message: 'Acción de follow-up registrada correctamente',
    });
  } catch (err) {
    logger.error('Error registrando acción de follow-up:', err);
    res.status(500).json({
      success: false,
      error: 'Error registrando acción de follow-up',
    });
  }
}

/**
 * GET /api/sales/followup/stats
 * Obtener estadísticas de follow-up del usuario actual
 */
export async function getFollowUpStatsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    const stats = await getFollowUpStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error('Error obteniendo estadísticas de follow-up:', err);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas de follow-up',
    });
  }
}
