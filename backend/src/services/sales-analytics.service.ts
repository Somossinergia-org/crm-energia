import { query } from '../config/database';
import { logger } from '../utils/logger';

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface SalesMetrics {
  periodo: string;
  emails_enviados: number;
  emails_abiertos: number;
  tasa_apertura: number;
  clicks_totales: number;
  tasa_click: number;
  llamadas_realizadas: number;
  oferta_conversion: number;
  tasa_conversion_oferta: number;
  temperatura_progression: Record<string, number>;
}

export interface EffectivityByState {
  estado: string;
  total: number;
  conversiones: number;
  tasa_conversion: number;
  dias_promedio: number;
}

export interface CommercialStats {
  user_id: string;
  nombre: string;
  prospectos_asignados: number;
  clientes_cerrados: number;
  tasa_cierre: number;
  emails_abiertos: number;
  llamadas_realizadas: number;
  oferta_enviada: number;
  oferta_aceptada: number;
}

// ── Métricas de ventas general (últimos 30 días) ───────────────────────────
export async function getSalesMetrics(days: number = 30): Promise<SalesMetrics> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Emails enviados y tracking
    const emailStats = await query(
      `SELECT
         COUNT(*) as total_enviados,
         SUM(CASE WHEN abierto = true THEN 1 ELSE 0 END) as abiertos,
         SUM(clicks) as total_clicks
       FROM emails_enviados
       WHERE enviado_at >= $1 AND estado = 'enviado'`,
      [startDate]
    );

    // Llamadas realizadas
    const callStats = await query(
      `SELECT COUNT(*) as total
       FROM contact_history
       WHERE created_at >= $1 AND tipo = 'llamada'`,
      [startDate]
    );

    // Ofertas enviadas vs aceptadas
    const ofertaStats = await query(
      `SELECT
         SUM(CASE WHEN estado = 'oferta_enviada' THEN 1 ELSE 0 END) as ofertas_enviadas,
         SUM(CASE WHEN estado = 'contrato_firmado' THEN 1 ELSE 0 END) as contratos_firmados
       FROM prospects
       WHERE updated_at >= $1`,
      [startDate]
    );

    // Progresión de temperatura
    const tempProgression = await query(
      `SELECT temperatura, COUNT(*) as cantidad
       FROM prospects
       WHERE updated_at >= $1
       GROUP BY temperatura`,
      [startDate]
    );

    const emailData = emailStats.rows[0] || {};
    const callData = callStats.rows[0] || {};
    const ofertaData = ofertaStats.rows[0] || {};

    const emailsEnviados = parseInt(emailData.total_enviados) || 0;
    const emailsAbiertos = parseInt(emailData.abiertos) || 0;
    const ofertasEnviadas = parseInt(ofertaData.ofertas_enviadas) || 0;
    const contratosAceptados = parseInt(ofertaData.contratos_firmados) || 0;

    const tempMap: Record<string, number> = {};
    tempProgression.rows.forEach((row: any) => {
      tempMap[row.temperatura] = parseInt(row.cantidad) || 0;
    });

    return {
      periodo: `Últimos ${days} días`,
      emails_enviados: emailsEnviados,
      emails_abiertos: emailsAbiertos,
      tasa_apertura: emailsEnviados > 0 ? Math.round((emailsAbiertos / emailsEnviados) * 100) : 0,
      clicks_totales: parseInt(emailData.total_clicks) || 0,
      tasa_click: emailsAbiertos > 0 ? Math.round((parseInt(emailData.total_clicks) / emailsAbiertos) * 100) : 0,
      llamadas_realizadas: parseInt(callData.total) || 0,
      oferta_conversion: contratosAceptados,
      tasa_conversion_oferta: ofertasEnviadas > 0 ? Math.round((contratosAceptados / ofertasEnviadas) * 100) : 0,
      temperatura_progression: tempMap,
    };
  } catch (err) {
    logger.error('Error calculando metrics de ventas:', err);
    throw err;
  }
}

// ── Efectividad por estado del prospecto ────────────────────────────────────
export async function getEffectivityByState(): Promise<EffectivityByState[]> {
  try {
    const result = await query(
      `SELECT
         p.estado,
         COUNT(p.id) as total,
         SUM(CASE WHEN p.estado = 'contrato_firmado' THEN 1 ELSE 0 END) as conversiones,
         ROUND(AVG(EXTRACT(DAY FROM (p.updated_at - p.created_at))))::INTEGER as dias_promedio
       FROM prospects p
       GROUP BY p.estado
       ORDER BY conversiones DESC`
    );

    return result.rows.map((row: any) => ({
      estado: row.estado,
      total: parseInt(row.total) || 0,
      conversiones: parseInt(row.conversiones) || 0,
      tasa_conversion: row.total > 0 ? Math.round((row.conversiones / row.total) * 100) : 0,
      dias_promedio: parseInt(row.dias_promedio) || 0,
    }));
  } catch (err) {
    logger.error('Error calculando effectivity by state:', err);
    throw err;
  }
}

// ── Estadísticas por comercial ────────────────────────────────────────────────
export async function getCommercialStats(): Promise<CommercialStats[]> {
  try {
    const result = await query(
      `SELECT
         u.id as user_id,
         u.nombre,
         COUNT(DISTINCT p.id) as prospectos_asignados,
         SUM(CASE WHEN p.estado = 'contrato_firmado' THEN 1 ELSE 0 END) as clientes_cerrados,
         SUM(CASE WHEN ee.abierto = true THEN 1 ELSE 0 END) as emails_abiertos,
         COUNT(DISTINCT CASE WHEN ch.tipo = 'llamada' THEN ch.id END) as llamadas_realizadas,
         COUNT(DISTINCT CASE WHEN p.estado = 'oferta_enviada' THEN p.id END) as oferta_enviada,
         COUNT(DISTINCT CASE WHEN p.estado = 'contrato_firmado' THEN p.id END) as oferta_aceptada
       FROM users u
       LEFT JOIN prospects p ON u.id = p.asignado_a
       LEFT JOIN emails_enviados ee ON p.id = ee.prospect_id
       LEFT JOIN contact_history ch ON p.id = ch.prospect_id
       WHERE u.role IN ('comercial', 'supervisor')
       GROUP BY u.id, u.nombre
       ORDER BY clientes_cerrados DESC`
    );

    return result.rows.map((row: any) => {
      const asignados = parseInt(row.prospectos_asignados) || 0;
      const cerrados = parseInt(row.clientes_cerrados) || 0;
      return {
        user_id: row.user_id,
        nombre: row.nombre,
        prospectos_asignados: asignados,
        clientes_cerrados: cerrados,
        tasa_cierre: asignados > 0 ? Math.round((cerrados / asignados) * 100) : 0,
        emails_abiertos: parseInt(row.emails_abiertos) || 0,
        llamadas_realizadas: parseInt(row.llamadas_realizadas) || 0,
        oferta_enviada: parseInt(row.oferta_enviada) || 0,
        oferta_aceptada: parseInt(row.oferta_aceptada) || 0,
      };
    });
  } catch (err) {
    logger.error('Error calculando commercial stats:', err);
    throw err;
  }
}

// ── Tasa de respuesta de prospectos por temperatura ───────────────────────────
export async function getResponseRateByTemperature(): Promise<Record<string, any>> {
  try {
    const result = await query(
      `SELECT
         p.temperatura,
         COUNT(DISTINCT p.id) as total,
         COUNT(DISTINCT CASE WHEN ch.id IS NOT NULL THEN p.id END) as respondieron,
         COUNT(DISTINCT CASE WHEN p.estado = 'contrato_firmado' THEN p.id END) as convertidos
       FROM prospects p
       LEFT JOIN contact_history ch ON p.id = ch.prospect_id
       GROUP BY p.temperatura
       ORDER BY respondieron DESC`
    );

    const stats: Record<string, any> = {};
    result.rows.forEach((row: any) => {
      const total = parseInt(row.total) || 0;
      const respondieron = parseInt(row.respondieron) || 0;
      const convertidos = parseInt(row.convertidos) || 0;

      stats[row.temperatura || 'desconocida'] = {
        total,
        respondieron,
        tasa_respuesta: total > 0 ? Math.round((respondieron / total) * 100) : 0,
        convertidos,
        tasa_conversion: total > 0 ? Math.round((convertidos / total) * 100) : 0,
      };
    });

    return stats;
  } catch (err) {
    logger.error('Error calculando response rate by temperature:', err);
    throw err;
  }
}

// ── Email performance (opening, clicks, bounces) ────────────────────────────
export async function getEmailPerformance() {
  try {
    const result = await query(
      `SELECT
         COUNT(*) as total_enviados,
         SUM(CASE WHEN abierto = true THEN 1 ELSE 0 END) as abiertos,
         SUM(CASE WHEN clicks > 0 THEN 1 ELSE 0 END) as con_clicks,
         SUM(CASE WHEN rebotado = true THEN 1 ELSE 0 END) as rebotados,
         AVG(CASE WHEN num_aperturas > 0 THEN num_aperturas END)::DECIMAL(10,2) as aperturas_promedio,
         AVG(CASE WHEN clicks > 0 THEN clicks END)::DECIMAL(10,2) as clicks_promedio
       FROM emails_enviados
       WHERE enviado_at >= NOW() - INTERVAL '30 days'`
    );

    const data = result.rows[0] || {};
    const totalEnviados = parseInt(data.total_enviados) || 0;

    return {
      total_enviados: totalEnviados,
      abiertos: parseInt(data.abiertos) || 0,
      tasa_apertura: totalEnviados > 0 ? Math.round((parseInt(data.abiertos) / totalEnviados) * 100) : 0,
      con_clicks: parseInt(data.con_clicks) || 0,
      tasa_click: totalEnviados > 0 ? Math.round((parseInt(data.con_clicks) / totalEnviados) * 100) : 0,
      rebotados: parseInt(data.rebotados) || 0,
      aperturas_promedio: parseFloat(data.aperturas_promedio) || 0,
      clicks_promedio: parseFloat(data.clicks_promedio) || 0,
    };
  } catch (err) {
    logger.error('Error calculando email performance:', err);
    throw err;
  }
}
