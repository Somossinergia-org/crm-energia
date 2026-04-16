import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPitch,
  handleProspectObjection,
  getStrategy,
  getAction,
  getSalesPanel,
} from '../controllers/sales.controller';

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

export default router;
