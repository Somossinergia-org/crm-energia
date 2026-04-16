import { query } from '../config/database';
import { logger } from '../utils/logger';

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface FollowUpAlert {
  prospect_id: string;
  nombre_negocio: string;
  temperatura: string;
  estado: string;
  dias_sin_contacto: number;
  razon_alerta: string;
  urgencia: 'critica' | 'alta' | 'media' | 'baja';
  accion_recomendada: string;
  fecha_proxima_accion?: string;
}

// ── Generar alertas de follow-up basadas en contact_history ────────────────
export async function generateFollowUpAlerts(userId?: string): Promise<FollowUpAlert[]> {
  try {
    const alerts: FollowUpAlert[] = [];
    const ahora = new Date();

    // Query para obtener prospectos que necesitan follow-up
    let sql = `
      SELECT DISTINCT
        p.id as prospect_id,
        p.nombre_negocio,
        p.temperatura,
        p.estado,
        p.asignado_a,
        MAX(EXTRACT(DAY FROM (NOW() - ch.created_at))::INTEGER) as dias_sin_contacto,
        ch.fecha_proxima_accion
      FROM prospects p
      LEFT JOIN contact_history ch ON p.id = ch.prospect_id
      WHERE
        p.estado IN ('pendiente', 'interesado', 'contactado', 'oferta_enviada', 'volver_llamar')
        AND (ch.id IS NULL OR ch.created_at IS NOT NULL)
      GROUP BY p.id, ch.fecha_proxima_accion
      ORDER BY dias_sin_contacto DESC
    `;

    const params: any[] = [];

    // Filtrar por usuario si se proporciona
    if (userId) {
      sql = sql.replace(
        'WHERE ',
        `WHERE p.asignado_a = $1 AND `
      );
      params.push(userId);
    }

    const result = await query(sql, params);

    result.rows.forEach((row: any) => {
      const diasSinContacto = row.dias_sin_contacto || 999;
      let urgencia: 'critica' | 'alta' | 'media' | 'baja' = 'baja';
      let razonAlerta = '';
      let accionRecomendada = '';

      // Reglas de urgencia por temperatura y días
      if (row.temperatura === 'caliente') {
        if (diasSinContacto > 3) {
          urgencia = 'critica';
          razonAlerta = `Prospecto CALIENTE sin contacto ${diasSinContacto} días`;
          accionRecomendada = 'Llamar inmediatamente para no perder oportunidad';
        } else if (diasSinContacto > 1) {
          urgencia = 'alta';
          razonAlerta = `Prospecto CALIENTE: ${diasSinContacto} días sin contacto`;
          accionRecomendada = 'Llamar hoy o enviar email de seguimiento';
        }
      } else if (row.temperatura === 'tibio' || row.temperatura === 'templado') {
        if (diasSinContacto > 7) {
          urgencia = 'alta';
          razonAlerta = `Prospecto TIBIO: ${diasSinContacto} días sin contacto`;
          accionRecomendada = 'Enviar email de educación + propuesta';
        } else if (diasSinContacto > 4) {
          urgencia = 'media';
          razonAlerta = `Prospecto TIBIO: ${diasSinContacto} días sin actividad`;
          accionRecomendada = 'Siguiente toque: email o llamada corta';
        }
      } else if (row.temperatura === 'frio') {
        if (diasSinContacto > 14) {
          urgencia = 'media';
          razonAlerta = `Prospecto FRÍO: ${diasSinContacto} días sin contacto`;
          accionRecomendada = 'Intentar reactivación con propuesta nueva';
        } else if (diasSinContacto > 7) {
          urgencia = 'baja';
          razonAlerta = `Prospecto FRÍO: ${diasSinContacto} días sin actividad`;
          accionRecomendada = 'Nutrición: enviar contenido educativo';
        }
      }

      // Urgencia adicional por estado
      if (row.estado === 'oferta_enviada' && diasSinContacto > 5) {
        urgencia = 'critica';
        razonAlerta = `OFERTA SIN RESPUESTA: ${diasSinContacto} días`;
        accionRecomendada = 'Follow-up de oferta: llamar o enviar resumen ejecutivo';
      }

      if (row.estado === 'volver_llamar') {
        urgencia = 'alta';
        razonAlerta = 'Prospecto en estado VOLVER_LLAMAR';
        accionRecomendada = 'Hacer la llamada programada ahora';
      }

      // Solo incluir si hay alerta válida
      if (urgencia !== 'baja' || diasSinContacto > 10) {
        alerts.push({
          prospect_id: row.prospect_id,
          nombre_negocio: row.nombre_negocio,
          temperatura: row.temperatura || 'desconocida',
          estado: row.estado,
          dias_sin_contacto: diasSinContacto,
          razon_alerta: razonAlerta,
          urgencia,
          accion_recomendada: accionRecomendada,
          fecha_proxima_accion: row.fecha_proxima_accion,
        });
      }
    });

    logger.info(`Generadas ${alerts.length} alertas de follow-up`);
    return alerts.sort((a, b) => {
      const urgencyScore = { critica: 3, alta: 2, media: 1, baja: 0 };
      return urgencyScore[b.urgencia] - urgencyScore[a.urgencia];
    });
  } catch (err) {
    logger.error('Error generando alertas de follow-up:', err);
    throw err;
  }
}

// ── Obtener alertas para un usuario específico ──────────────────────────────
export async function getUserFollowUpAlerts(userId: string): Promise<FollowUpAlert[]> {
  return generateFollowUpAlerts(userId);
}

// ── Registrar acción de follow-up ──────────────────────────────────────────
export async function logFollowUpAction(
  prospectId: string,
  userId: string,
  tipo: 'llamada' | 'email_enviado' | 'visita_presencial' | 'whatsapp',
  resultado: 'positivo' | 'neutro' | 'negativo' | 'no_contesto',
  proxima_accion_fecha?: Date
): Promise<void> {
  try {
    await query(
      `INSERT INTO contact_history
       (prospect_id, user_id, tipo, resultado, fecha_proxima_accion, proxima_accion, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        prospectId,
        userId,
        tipo,
        resultado,
        proxima_accion_fecha || null,
        `Follow-up completado: ${tipo} con resultado ${resultado}`,
      ]
    );

    logger.info(`Follow-up logged: ${prospectId} - ${tipo}`);
  } catch (err) {
    logger.error('Error logging follow-up action:', err);
    throw err;
  }
}

// ── Obtener estadísticas de follow-up por usuario ────────────────────────────
export async function getFollowUpStats(userId?: string) {
  try {
    let sqlTotalAlerts = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM prospects p
      LEFT JOIN contact_history ch ON p.id = ch.prospect_id
      WHERE p.estado IN ('pendiente', 'interesado', 'contactado', 'oferta_enviada', 'volver_llamar')
    `;

    let sqlCompletedToday = `
      SELECT COUNT(*) as total
      FROM contact_history
      WHERE DATE(created_at) = CURRENT_DATE
        AND tipo IN ('llamada', 'email_enviado', 'visita_presencial', 'whatsapp')
    `;

    let sqlOfertaSinRespuesta = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM prospects p
      LEFT JOIN contact_history ch ON p.id = ch.prospect_id
      WHERE p.estado = 'oferta_enviada'
        AND EXTRACT(DAY FROM (NOW() - ch.created_at)) > 5
    `;

    const params: any[] = [];

    if (userId) {
      sqlTotalAlerts += ` AND p.asignado_a = $1`;
      sqlCompletedToday += ` AND user_id = $1`;
      sqlOfertaSinRespuesta += ` AND p.asignado_a = $1`;
      params.push(userId);
    }

    const [totalAlerts, completedToday, ofertaSinRespuesta] = await Promise.all([
      query(sqlTotalAlerts, params).then((r) => r.rows[0]?.total || 0),
      query(sqlCompletedToday, params).then((r) => r.rows[0]?.total || 0),
      query(sqlOfertaSinRespuesta, params).then((r) => r.rows[0]?.total || 0),
    ]);

    return {
      alertas_totales: totalAlerts,
      acciones_completadas_hoy: completedToday,
      ofertas_sin_respuesta: ofertaSinRespuesta,
      tasa_completion: totalAlerts > 0 ? Math.round((completedToday / totalAlerts) * 100) : 0,
    };
  } catch (err) {
    logger.error('Error calculating follow-up stats:', err);
    throw err;
  }
}
