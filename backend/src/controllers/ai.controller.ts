import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import {
  scoreLead,
  generateCallBriefing,
  generateEmail,
  type ProspectData,
} from '../services/gemini.service';

// ── 1. Score de un prospecto ───────────────────────────────────────────────
export async function scoreProspect(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM prospects WHERE id = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    const prospect = result.rows[0] as ProspectData;
    const score = await scoreLead(prospect);

    // Guardar/actualizar en BD
    await query(`
      INSERT INTO prospect_scores (prospect_id, score_total, score_email, score_energetico, score_actividad, probabilidad_cierre, calculado_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (prospect_id) DO UPDATE SET
        score_total = EXCLUDED.score_total,
        score_email = EXCLUDED.score_email,
        score_energetico = EXCLUDED.score_energetico,
        score_actividad = EXCLUDED.score_actividad,
        probabilidad_cierre = EXCLUDED.probabilidad_cierre,
        calculado_at = NOW(),
        updated_at = NOW()
    `, [id, score.score_total, score.score_email, score.score_energetico, score.score_actividad, score.probabilidad_cierre]);

    return res.json({ ...score, prospect_id: id });
  } catch (err) {
    logger.error('Error calculando score:', err);
    return res.status(500).json({ error: 'Error calculando score' });
  }
}

// ── 2. Score masivo (todos los prospectos del usuario) ─────────────────────
export async function scoreBulk(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role || (req as any).user.rol;

    const whereClause = role === 'admin' ? '' : 'WHERE asignado_a = $1';
    const params = role === 'admin' ? [] : [userId];

    const result = await query(
      `SELECT * FROM prospects ${whereClause} ORDER BY created_at DESC LIMIT 200`,
      params
    );

    let actualizados = 0;
    for (const prospect of result.rows) {
      try {
        const score = await scoreLead(prospect as ProspectData);
        await query(`
          INSERT INTO prospect_scores (prospect_id, score_total, score_email, score_energetico, score_actividad, probabilidad_cierre, calculado_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (prospect_id) DO UPDATE SET
            score_total = EXCLUDED.score_total,
            score_email = EXCLUDED.score_email,
            score_energetico = EXCLUDED.score_energetico,
            score_actividad = EXCLUDED.score_actividad,
            probabilidad_cierre = EXCLUDED.probabilidad_cierre,
            calculado_at = NOW(),
            updated_at = NOW()
        `, [prospect.id, score.score_total, score.score_email, score.score_energetico, score.score_actividad, score.probabilidad_cierre]);
        actualizados++;
      } catch (e) {
        logger.warn(`Score fallido para ${prospect.id}`);
      }
    }

    return res.json({ actualizados, total: result.rows.length });
  } catch (err) {
    logger.error('Error en score bulk:', err);
    return res.status(500).json({ error: 'Error calculando scores' });
  }
}

// ── 3. Briefing de llamada ─────────────────────────────────────────────────
export async function getCallBriefing(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [prospectResult, historialResult] = await Promise.all([
      query('SELECT * FROM prospects WHERE id = $1', [id]),
      query(
        `SELECT tipo, descripcion, created_at FROM contact_history WHERE prospect_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [id]
      ).catch(() => ({ rows: [] as any[] })),
    ]);

    if (!prospectResult.rows.length) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    const prospect = prospectResult.rows[0] as ProspectData;
    const historial = historialResult.rows
      .map((h: any) => `[${new Date(h.created_at).toLocaleDateString('es-ES')}] ${h.tipo}: ${h.descripcion}`)
      .join('\n');

    // Verificar si hay uno reciente (< 6 horas)
    const existente = await query(
      "SELECT * FROM prospect_ai_insights WHERE prospect_id = $1 AND ultima_actualizacion > NOW() - INTERVAL '6 hours'",
      [id]
    );

    if (existente.rows.length) {
      return res.json(existente.rows[0]);
    }

    const briefing = await generateCallBriefing(prospect, historial);

    // Guardar
    await query(`
      INSERT INTO prospect_ai_insights (prospect_id, briefing_llamada, sugerencia_siguiente_paso, motivos_interes, objeciones_detectadas, mejor_hora_contacto, resumen_historial, ultima_actualizacion)
      VALUES ($1, $2, $3, $4, $5, $6::TIME, $7, NOW())
      ON CONFLICT (prospect_id) DO UPDATE SET
        briefing_llamada = EXCLUDED.briefing_llamada,
        sugerencia_siguiente_paso = EXCLUDED.sugerencia_siguiente_paso,
        motivos_interes = EXCLUDED.motivos_interes,
        objeciones_detectadas = EXCLUDED.objeciones_detectadas,
        mejor_hora_contacto = EXCLUDED.mejor_hora_contacto,
        resumen_historial = EXCLUDED.resumen_historial,
        ultima_actualizacion = NOW()
    `, [
      id,
      briefing.briefing_llamada,
      briefing.sugerencia_siguiente_paso,
      briefing.motivos_interes,
      briefing.objeciones_detectadas,
      briefing.mejor_hora_contacto,
      briefing.resumen_historial,
    ]);

    return res.json({ prospect_id: id, ...briefing });
  } catch (err) {
    logger.error('Error generando briefing:', err);
    return res.status(500).json({ error: 'Error generando briefing' });
  }
}

// ── 4. Generar email con IA ────────────────────────────────────────────────
export async function generateEmailAI(req: Request, res: Response) {
  try {
    const { prospect_id, objetivo = 'presentacion' } = req.body;

    if (!prospect_id) {
      return res.status(400).json({ error: 'prospect_id requerido' });
    }

    const result = await query('SELECT * FROM prospects WHERE id = $1', [prospect_id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    const email = await generateEmail(
      result.rows[0] as ProspectData,
      objetivo as any
    );

    return res.json(email);
  } catch (err) {
    logger.error('Error generando email:', err);
    return res.status(500).json({ error: 'Error generando email' });
  }
}

// ── 5. Briefing diario del usuario ────────────────────────────────────────
export async function getDailyBriefing(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role || (req as any).user.rol;

    const whereUser = role === 'admin' ? '' : 'AND p.asignado_a = $1';
    const params = role === 'admin' ? [] : [userId];

    const [topProspectos, pipelineStats, visitasHoy] = await Promise.all([
      // Top prospectos por score
      query(`
        SELECT p.id, p.nombre_negocio, p.temperatura, p.estado, p.fecha_ultimo_contacto,
               COALESCE(ps.score_total, 0) as score_total,
               p.ahorro_estimado_eur
        FROM prospects p
        LEFT JOIN prospect_scores ps ON ps.prospect_id = p.id
        WHERE p.estado NOT IN ('cliente','contrato_firmado','perdido','descartado','rechazado') ${whereUser}
        ORDER BY ps.score_total DESC NULLS LAST, p.updated_at DESC
        LIMIT 5
      `, params),

      // Stats pipeline
      query(`
        SELECT COUNT(*) as total
        FROM prospects p
        WHERE p.estado NOT IN ('cliente','contrato_firmado','perdido','descartado','rechazado') ${whereUser}
      `, params),

      // Visitas de hoy
      query(`
        SELECT COUNT(*) as total
        FROM visits v
        JOIN prospects p ON p.id = v.prospect_id
        WHERE DATE(v.fecha_visita) = CURRENT_DATE ${whereUser}
      `, params).catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';

    // Generar alertas
    const alertas: Array<{ tipo: string; mensaje: string; severidad: 'alta' | 'media' | 'baja' }> = [];

    const sinContacto = topProspectos.rows.filter((p: any) => {
      if (!p.fecha_ultimo_contacto) return true;
      const dias = Math.ceil((Date.now() - new Date(p.fecha_ultimo_contacto).getTime()) / 86400000);
      return dias > 7;
    });

    if (sinContacto.length > 0) {
      alertas.push({
        tipo: 'seguimiento',
        mensaje: `${sinContacto.length} prospectos sin contacto en más de 7 días`,
        severidad: 'alta',
      });
    }

    const calientes = topProspectos.rows.filter((p: any) => p.temperatura === 'caliente');
    if (calientes.length > 0) {
      alertas.push({
        tipo: 'oportunidad',
        mensaje: `${calientes.length} prospectos calientes listos para cerrar`,
        severidad: 'alta',
      });
    }

    const top = topProspectos.rows.slice(0, 3).map((p: any) => ({
      id: p.id,
      nombre: p.nombre_negocio,
      score: parseInt(p.score_total) || 0,
      motivo: p.temperatura === 'caliente'
        ? 'Prospecto caliente'
        : p.ahorro_estimado_eur > 300
        ? `Ahorro ${p.ahorro_estimado_eur}€/mes`
        : 'Seguimiento pendiente',
    }));

    const pipelineActivo = parseInt(pipelineStats.rows[0]?.total) || 0;
    const visitasCount = parseInt(visitasHoy.rows[0]?.total) || 0;
    const resumen = `Tienes ${pipelineActivo} prospectos activos en el pipeline. ${calientes.length > 0 ? `${calientes.length} están calientes.` : 'Sigue trabajando el pipeline.'} ${visitasCount > 0 ? `Tienes ${visitasCount} visita(s) programadas hoy.` : ''}`.trim();

    return res.json({
      saludo,
      resumen,
      alertas,
      top_prospectos: top,
      stats_hoy: {
        pipeline_activo: pipelineActivo,
        emails_pendientes: 0,
        visitas_hoy: visitasCount,
      },
    });
  } catch (err) {
    logger.error('Error generando briefing diario:', err);
    return res.status(500).json({ error: 'Error generando briefing' });
  }
}

// ── 6. Obtener score de un prospecto ──────────────────────────────────────
export async function getScore(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM prospect_scores WHERE prospect_id = $1',
      [id]
    );
    if (!result.rows.length) {
      return res.json({ score_total: null, calculado_at: null });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error obteniendo score:', err);
    return res.status(500).json({ error: 'Error obteniendo score' });
  }
}
