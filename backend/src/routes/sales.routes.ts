import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPitch,
  handleProspectObjection,
  getStrategy,
  getAction,
  getSalesPanel,
} from '../controllers/sales.controller';
import {
  getSalesMetricsHandler,
  getEffectivityHandler,
  getCommercialStatsHandler,
  getResponseRateHandler,
  getEmailPerformanceHandler,
} from '../controllers/sales-analytics.controller';
import {
  getFollowUpAlertsHandler,
  getAllFollowUpAlertsHandler,
  logFollowUpActionHandler,
  getFollowUpStatsHandler,
} from '../controllers/sales-followup.controller';

const router = Router();

// Proteger todas las rutas con autenticación
router.use(authenticate);

// ── Endpoints de ventas ────────────────────────────────────────────────────────

/**
 * GET /api/sales/pitch/:prospect_id
 * Obtener guión de venta personalizado para un prospecto
 */
router.get('/pitch/:prospect_id', getPitch);

/**
 * POST /api/sales/objection/:prospect_id
 * Manejar objeción de un prospecto
 * Body: { objecion: string }
 */
router.post('/objection/:prospect_id', handleProspectObjection);

/**
 * GET /api/sales/strategy/:prospect_id
 * Obtener estrategia de venta para un prospecto
 */
router.get('/strategy/:prospect_id', getStrategy);

/**
 * GET /api/sales/action/:prospect_id
 * Obtener acción sugerida en tiempo real
 */
router.get('/action/:prospect_id', getAction);

/**
 * GET /api/sales/panel/:prospect_id
 * Obtener panel completo de ventas (pitch + strategy + action + historial)
 */
router.get('/panel/:prospect_id', getSalesPanel);

// ── Endpoints de Analytics ─────────────────────────────────────────────────────

/**
 * GET /api/sales/analytics/metrics?days=30
 * Obtener métricas generales de ventas (últimos N días)
 */
router.get('/analytics/metrics', getSalesMetricsHandler);

/**
 * GET /api/sales/analytics/effectiveness-by-state
 * Obtener efectividad de conversión por estado del prospecto
 */
router.get('/analytics/effectiveness-by-state', getEffectivityHandler);

/**
 * GET /api/sales/analytics/commercial-stats
 * Obtener estadísticas de desempeño por comercial
 */
router.get('/analytics/commercial-stats', getCommercialStatsHandler);

/**
 * GET /api/sales/analytics/response-rate-by-temperature
 * Obtener tasa de respuesta y conversión por temperatura
 */
router.get('/analytics/response-rate-by-temperature', getResponseRateHandler);

/**
 * GET /api/sales/analytics/email-performance
 * Obtener métricas de rendimiento de emails (últimos 30 días)
 */
router.get('/analytics/email-performance', getEmailPerformanceHandler);

// ── Endpoints de Follow-up ─────────────────────────────────────────────────────

/**
 * GET /api/sales/followup/alerts
 * Obtener alertas de follow-up del usuario (o filtrar por user_id si es admin)
 */
router.get('/followup/alerts', getFollowUpAlertsHandler);

/**
 * GET /api/sales/followup/alerts/all
 * Obtener todas las alertas de follow-up del sistema (solo admin)
 */
router.get('/followup/alerts/all', getAllFollowUpAlertsHandler);

/**
 * POST /api/sales/followup/action/:prospect_id
 * Registrar una acción de follow-up completada
 * Body: { tipo, resultado, fecha_proxima_accion? }
 */
router.post('/followup/action/:prospect_id', logFollowUpActionHandler);

/**
 * GET /api/sales/followup/stats
 * Obtener estadísticas de follow-up del usuario actual
 */
router.get('/followup/stats', getFollowUpStatsHandler);

export default router;
