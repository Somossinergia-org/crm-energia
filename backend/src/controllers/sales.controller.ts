import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import {
  generateSalesPitch,
  handleObjection,
  getSalesStrategy,
  getSalesAction,
  type SalesProspect,
} from '../services/sales-agent.service';

// ── 1. Generar guión de venta personalizado ────────────────────────────────
export async function getPitch(req: Request, res: Response) {
  try {
    const { prospect_id } = req.params;
    const commercialName = (req as any).user.nombre || (req as any).user.name || 'Comercial';

    // Obtener prospect de la BD
    const prospectResult = await query(
      'SELECT * FROM prospects WHERE id = $1',
      [prospect_id]
    );

    if (!prospectResult.rows.length) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    const prospect = prospectResult.rows[0] as SalesProspect;
    const pitch = await generateSalesPitch(prospect, commercialName);

    return res.json({
      prospect_id,
      commercial_name: commercialName,
      pitch,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Error generando pitch:', err);
    return res.status(500).json({ error: 'Error generando pitch de venta' });
  }
}

// ── 2. Manejar objeción ────────────────────────────────────────────────────
export async function handleProspectObjection(req: Request, res: Response) {
  try {
    const { prospect_id } = req.params;
    const { objecion } = req.body;

    if (!objecion?.trim()) {
      return res.status(400).json({ error: 'Objeción requerida' });
    }

    // Obtener prospect de la BD
    const prospectResult = await query(
      'SELECT * FROM prospects WHERE id = $1',
      [prospect_id]
    );

    if (!prospectResult.rows.length) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    const prospect = prospectResult.rows[0] as SalesProspect;

    // Obtener historial de contactos para contexto
    const historialResult = await query(
      `SELECT tipo, descripcion, created_at FROM contact_history
       WHERE prospect_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [prospect_id]
    ).catch(() => ({ rows: [] as any[] }));

    const historial = historialResult.rows
      .map((h: any) => `[${h.tipo}] ${h.descripcion}`)
      .join('\n');

    const response = await handleObjection(objecion.trim(), prospect, historial);

    // Log de la objeción manejada
    await query(
      `INSERT INTO contact_history (prospect_id, tipo, descripcion)
       VALUES ($1, 'objecion_manejada', $2)`,
      [prospect_id, objecion.trim()]
    ).catch(() => {});

    return res.json({
      prospect_id,
      objecion: objecion.trim(),
      respuesta: response,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Error manejando objeción:', err);
    return res.status(500).json({ error: 'Error manejando objeción' });
  }
}

// ── 3. Obtener estrategia de venta ──────────────────────────────────────────
export async function getStrategy(req: Request, res: Response) {
  try {
    const { prospect_id } = req.params;

    // Obtener prospect de la BD
    const prospectResult = await query(
      'SELECT * FROM prospects WHERE id = $1',
      [prospect_id]
    );

    if (!prospectResult.rows.length) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    const prospect = prospectResult.rows[0] as SalesProspect;
    const strategy = await getSalesStrategy(prospect);

    return res.json({
      prospect_id,
      prospect_name: prospect.nombre_negocio,
      strategy,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Error obteniendo estrategia:', err);
    return res.status(500).json({ error: 'Error obteniendo estrategia de venta' });
  }
}

// ── 4. Obtener acción sugerida en tiempo real ───────────────────────────────
export async function getAction(req: Request, res: Response) {
  try {
    const { prospect_id } = req.params;

    // Obtener prospect de la BD
    const prospectResult = await query(
      'SELECT * FROM prospects WHERE id = $1',
      [prospect_id]
    );

    if (!prospectResult.rows.length) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    const prospect = prospectResult.rows[0] as SalesProspect;

    // Calcular días desde último contacto
    const ultimoContactoResult = await query(
      `SELECT MAX(created_at) as ultima_actividad FROM contact_history
       WHERE prospect_id = $1`,
      [prospect_id]
    );

    let diasDesdeContacto = 999;
    if (ultimoContactoResult.rows[0]?.ultima_actividad) {
      const ultimaFecha = new Date(ultimoContactoResult.rows[0].ultima_actividad);
      diasDesdeContacto = Math.floor(
        (Date.now() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const action = await getSalesAction(prospect, diasDesdeContacto);

    return res.json({
      prospect_id,
      prospect_name: prospect.nombre_negocio,
      dias_sin_contacto: diasDesdeContacto,
      action_suggested: action,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Error obteniendo acción sugerida:', err);
    return res.status(500).json({ error: 'Error obteniendo acción sugerida' });
  }
}

// ── 5. Obtener panel completo de ventas para un prospecto ──────────────────
export async function getSalesPanel(req: Request, res: Response) {
  try {
    const { prospect_id } = req.params;
    const commercialName = (req as any).user.nombre || (req as any).user.name || 'Comercial';

    // Obtener prospect
    const prospectResult = await query(
      'SELECT * FROM prospects WHERE id = $1',
      [prospect_id]
    );

    if (!prospectResult.rows.length) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    const prospect = prospectResult.rows[0] as SalesProspect;

    // Obtener historial
    const historialResult = await query(
      `SELECT tipo, descripcion, created_at FROM contact_history
       WHERE prospect_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [prospect_id]
    ).catch(() => ({ rows: [] as any[] }));

    // Calcular días sin contacto
    let diasDesdeContacto = 999;
    if (historialResult.rows.length > 0) {
      const ultimaFecha = new Date(historialResult.rows[0].created_at);
      diasDesdeContacto = Math.floor(
        (Date.now() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Generar todos los componentes en paralelo
    const [pitch, strategy, action] = await Promise.all([
      generateSalesPitch(prospect, commercialName),
      getSalesStrategy(prospect),
      getSalesAction(prospect, diasDesdeContacto),
    ]);

    return res.json({
      prospect_id,
      prospect: {
        nombre_negocio: prospect.nombre_negocio,
        nombre_contacto: prospect.nombre_contacto,
        categoria: prospect.categoria,
        temperatura: prospect.temperatura,
        estado: prospect.estado,
        ahorro_estimado_eur: prospect.ahorro_estimado_eur,
        dias_sin_contacto: diasDesdeContacto,
      },
      commercial_name: commercialName,
      pitch,
      strategy,
      action_suggested: action,
      historial_resumen: historialResult.rows.slice(0, 3).map((h: any) => ({
        tipo: h.tipo,
        descripcion: h.descripcion,
        fecha: h.created_at,
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Error obteniendo panel de ventas:', err);
    return res.status(500).json({ error: 'Error obteniendo panel de ventas' });
  }
}
