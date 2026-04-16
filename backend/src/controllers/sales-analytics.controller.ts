import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import {
  getSalesMetrics,
  getEffectivityByState,
  getCommercialStats,
  getResponseRateByTemperature,
  getEmailPerformance,
} from '../services/sales-analytics.service';

/**
 * GET /api/sales/analytics/metrics?days=30
 * Obtener métricas generales de ventas (últimos N días)
 */
export async function getSalesMetricsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const metrics = await getSalesMetrics(days);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    logger.error('Error obteniendo métricas de ventas:', err);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo métricas de ventas',
    });
  }
}

/**
 * GET /api/sales/analytics/effectiveness-by-state
 * Obtener efectividad de conversión por estado del prospecto
 */
export async function getEffectivityHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const effectivity = await getEffectivityByState();

    res.json({
      success: true,
      data: effectivity,
    });
  } catch (err) {
    logger.error('Error obteniendo effectivity by state:', err);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo efectividad por estado',
    });
  }
}

/**
 * GET /api/sales/analytics/commercial-stats
 * Obtener estadísticas de desempeño por comercial
 */
export async function getCommercialStatsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await getCommercialStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error('Error obteniendo commercial stats:', err);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas de comerciales',
    });
  }
}

/**
 * GET /api/sales/analytics/response-rate-by-temperature
 * Obtener tasa de respuesta y conversión por temperatura
 */
export async function getResponseRateHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const responseRate = await getResponseRateByTemperature();

    res.json({
      success: true,
      data: responseRate,
    });
  } catch (err) {
    logger.error('Error obteniendo response rate by temperature:', err);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo tasa de respuesta por temperatura',
    });
  }
}

/**
 * GET /api/sales/analytics/email-performance
 * Obtener métricas de rendimiento de emails (últimos 30 días)
 */
export async function getEmailPerformanceHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const performance = await getEmailPerformance();

    res.json({
      success: true,
      data: performance,
    });
  } catch (err) {
    logger.error('Error obteniendo email performance:', err);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo rendimiento de emails',
    });
  }
}
