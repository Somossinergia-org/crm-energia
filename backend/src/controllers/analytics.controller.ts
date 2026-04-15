import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ── Helper ─────────────────────────────────────────────────────────────────
function userFilter(req: Request): { where: string; params: any[] } {
  const user = (req as any).user;
  if (user.rol === 'admin') return { where: '', params: [] };
  return { where: 'AND asignado_a = $1', params: [user.id] };
}

// ── 1. KPIs principales ────────────────────────────────────────────────────
export async function getKPIs(req: Request, res: Response) {
  try {
    const { where, params } = userFilter(req);
    const p = [...params];

    const [pipeline, clientes, conv30d, conv7d, ahorroTotal, emailStats] = await Promise.all([
      query(`SELECT COUNT(*) as total, COALESCE(SUM(ahorro_estimado_eur),0) as ahorro_potencial
             FROM prospects WHERE estado NOT IN ('cliente','perdido','descartado') ${where}`, p),
      query(`SELECT COUNT(*) as total, COALESCE(SUM(ahorro_estimado_eur),0) as ahorro_generado,
                    COALESCE(SUM(gasto_mensual_estimado_eur),0) as gasto_gestionado
             FROM prospects WHERE estado='cliente' ${where}`, p),
      query(`SELECT COUNT(*) as total FROM prospects
             WHERE estado='cliente' AND fecha_conversion >= NOW()-INTERVAL '30 days' ${where}`, p),
      query(`SELECT COUNT(*) as total FROM prospects
             WHERE estado='cliente' AND fecha_conversion >= NOW()-INTERVAL '7 days' ${where}`, p),
      query(`SELECT COALESCE(SUM(ahorro_estimado_eur),0) as total FROM prospects
             WHERE estado='cliente' ${where}`, p),
      query(`SELECT COUNT(*) as enviados,
                    COUNT(*) FILTER (WHERE abierto_en IS NOT NULL) as abiertos,
                    COUNT(*) FILTER (WHERE clicked_en IS NOT NULL) as clicks
             FROM emails_enviados`, []).catch(() => ({ rows: [{ enviados: 0, abiertos: 0, clicks: 0 }] })),
    ]);

    const pipelineTotal = parseInt(pipeline.rows[0].total);
    const clientesTotal = parseInt(clientes.rows[0].total);
    const tasaConversion = pipelineTotal + clientesTotal > 0
      ? Math.round((clientesTotal / (pipelineTotal + clientesTotal)) * 100 * 10) / 10
      : 0;

    return res.json({
      success: true,
      data: {
        pipeline_activo: pipelineTotal,
        ahorro_potencial_mes: parseFloat(pipeline.rows[0].ahorro_potencial),
        clientes_activos: clientesTotal,
        ahorro_generado_mes: parseFloat(clientes.rows[0].ahorro_generado),
        gasto_gestionado_mes: parseFloat(clientes.rows[0].gasto_gestionado),
        conversiones_30d: parseInt(conv30d.rows[0].total),
        conversiones_7d: parseInt(conv7d.rows[0].total),
        tasa_conversion: tasaConversion,
        ahorro_total_acumulado: parseFloat(ahorroTotal.rows[0].total),
        emails: {
          enviados: parseInt(emailStats.rows[0].enviados),
          tasa_apertura: emailStats.rows[0].enviados > 0
            ? Math.round((emailStats.rows[0].abiertos / emailStats.rows[0].enviados) * 100)
            : 0,
        },
      },
    });
  } catch (err) {
    logger.error('Error KPIs:', err);
    return res.status(500).json({ error: 'Error obteniendo KPIs' });
  }
}

// ── 2. Evolución mensual (últimos 6 meses) ────────────────────────────────
export async function getMonthlyEvolution(req: Request, res: Response) {
  try {
    const { where, params } = userFilter(req);
    const p = [...params];

    const result = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as mes,
        DATE_TRUNC('month', created_at) as mes_date,
        COUNT(*) as nuevos,
        COUNT(*) FILTER (WHERE estado = 'cliente') as convertidos,
        COALESCE(SUM(ahorro_estimado_eur) FILTER (WHERE estado='cliente'), 0) as ahorro
      FROM prospects
      WHERE created_at >= NOW() - INTERVAL '6 months' ${where}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY mes_date ASC
    `, p);

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('Error evolución mensual:', err);
    return res.status(500).json({ error: 'Error obteniendo evolución' });
  }
}

// ── 3. Distribución por estado ─────────────────────────────────────────────
export async function getByEstado(req: Request, res: Response) {
  try {
    const { where, params } = userFilter(req);
    const result = await query(`
      SELECT estado, COUNT(*) as total,
             COALESCE(SUM(ahorro_estimado_eur), 0) as ahorro_potencial
      FROM prospects ${where ? `WHERE ${where.replace('AND ', '')}` : ''}
      GROUP BY estado ORDER BY total DESC
    `, params);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Error' });
  }
}

// ── 4. Top municipios ──────────────────────────────────────────────────────
export async function getTopMunicipios(req: Request, res: Response) {
  try {
    const { where, params } = userFilter(req);
    const p = [...params];
    const result = await query(`
      SELECT municipio, COUNT(*) as total,
             COUNT(*) FILTER (WHERE estado='cliente') as clientes,
             COALESCE(SUM(ahorro_estimado_eur), 0) as ahorro_potencial
      FROM prospects
      WHERE municipio IS NOT NULL AND municipio != '' ${where}
      GROUP BY municipio ORDER BY total DESC LIMIT 10
    `, p);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Error' });
  }
}

// ── 5. Radar de oportunidades (prospectos calientes sin contacto reciente) ─
export async function getRadarOportunidades(req: Request, res: Response) {
  try {
    const { where, params } = userFilter(req);
    const p = [...params];
    const result = await query(`
      SELECT p.id, p.nombre_negocio, p.temperatura, p.estado, p.municipio,
             p.ahorro_estimado_eur, p.fecha_ultimo_contacto, p.telefono_movil,
             p.email_principal, COALESCE(ps.score_total, 0) as score,
             EXTRACT(DAY FROM NOW() - p.fecha_ultimo_contacto)::int as dias_sin_contacto
      FROM prospects p
      LEFT JOIN prospect_scores ps ON ps.prospect_id = p.id
      WHERE p.estado NOT IN ('cliente','perdido','descartado')
      AND (p.fecha_ultimo_contacto IS NULL OR p.fecha_ultimo_contacto < NOW() - INTERVAL '5 days')
      AND (p.temperatura IN ('caliente','templado') OR COALESCE(ps.score_total,0) >= 50) ${where}
      ORDER BY ps.score_total DESC NULLS LAST, p.ahorro_estimado_eur DESC NULLS LAST
      LIMIT 8
    `, p);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Error' });
  }
}

// ── 6. Predicción de cierres este mes ─────────────────────────────────────
export async function getPrediccionCierres(req: Request, res: Response) {
  try {
    const { where, params } = userFilter(req);
    const p = [...params];
    const result = await query(`
      SELECT p.id, p.nombre_negocio, p.ahorro_estimado_eur, p.municipio,
             p.fecha_vencimiento_contrato, COALESCE(ps.score_total, 0) as score,
             ps.probabilidad_cierre
      FROM prospects p
      LEFT JOIN prospect_scores ps ON ps.prospect_id = p.id
      WHERE p.estado NOT IN ('cliente','perdido','descartado')
      AND COALESCE(ps.probabilidad_cierre, 0) >= 50 ${where}
      ORDER BY ps.probabilidad_cierre DESC NULLS LAST LIMIT 5
    `, p);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Error' });
  }
}

// ── 7. Actividad por hora del día (heatmap) ────────────────────────────────
export async function getActivityHeatmap(req: Request, res: Response) {
  try {
    const result = await query(`
      SELECT EXTRACT(HOUR FROM created_at)::int as hora,
             TO_CHAR(created_at, 'Day') as dia_semana,
             EXTRACT(DOW FROM created_at)::int as dia_num,
             COUNT(*) as total
      FROM contact_history
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY hora, dia_semana, dia_num
      ORDER BY dia_num, hora
    `, []).catch(() => ({ rows: [] }));
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Error' });
  }
}

// ── 8. Informe semanal IA ──────────────────────────────────────────────────
export async function getWeeklyReport(req: Request, res: Response) {
  try {
    const { where, params } = userFilter(req);
    const p = [...params];

    const [nuevos, convertidos, ahorro, actividad] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM prospects WHERE created_at >= NOW()-INTERVAL '7 days' ${where}`, p),
      query(`SELECT COUNT(*) as total, COALESCE(SUM(ahorro_estimado_eur),0) as ahorro
             FROM prospects WHERE estado='cliente' AND fecha_conversion >= NOW()-INTERVAL '7 days' ${where}`, p),
      query(`SELECT COALESCE(SUM(ahorro_estimado_eur),0) as total FROM prospects WHERE estado='cliente' ${where}`, p),
      query(`SELECT tipo, COUNT(*) as total FROM contact_history
             WHERE created_at >= NOW()-INTERVAL '7 days'
             GROUP BY tipo ORDER BY total DESC`, []).catch(() => ({ rows: [] })),
    ]);

    const stats = {
      nuevos_prospectos: parseInt(nuevos.rows[0].total),
      clientes_ganados: parseInt(convertidos.rows[0].total),
      ahorro_nuevo_mes: parseFloat(convertidos.rows[0].ahorro),
      ahorro_total_cartera: parseFloat(ahorro.rows[0].total),
      actividad: actividad.rows,
    };

    let informe = `## Informe semanal — ${new Date().toLocaleDateString('es-ES')}\n\n`;
    informe += `**Nuevos prospectos esta semana:** ${stats.nuevos_prospectos}\n`;
    informe += `**Clientes ganados:** ${stats.clientes_ganados}\n`;
    informe += `**Ahorro nuevo generado:** ${stats.ahorro_nuevo_mes.toFixed(2)}€/mes\n`;
    informe += `**Ahorro total en cartera:** ${stats.ahorro_total_cartera.toFixed(2)}€/mes\n\n`;

    if (env.GEMINI_API_KEY) {
      try {
        // generateEmail is exported and internally uses safeGenerate via the same Gemini client
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(`Eres el asistente de ventas de Somos Sinergia.
Genera un análisis ejecutivo de 3 párrafos en español para este informe semanal de ventas de energía:
${JSON.stringify(stats, null, 2)}
Incluye: puntos fuertes, áreas de mejora y recomendación de acción para la próxima semana.`);
        informe += `\n### Análisis IA\n${result.response.text()}`;
      } catch (e) {
        logger.warn('Gemini weekly report fallido');
      }
    }

    return res.json({ success: true, data: { stats, informe_markdown: informe } });
  } catch (err) {
    logger.error('Error informe semanal:', err);
    return res.status(500).json({ error: 'Error generando informe' });
  }
}

// ── 9. Exportar Excel ──────────────────────────────────────────────────────
export async function exportExcel(req: Request, res: Response) {
  try {
    const ExcelJS = require('exceljs');
    const { where, params } = userFilter(req);
    const p = [...params];

    const prospects = await query(`
      SELECT p.nombre_negocio, p.nombre_contacto, p.email_principal, p.telefono_movil,
             p.municipio, p.provincia, p.estado, p.temperatura, p.comercializadora_actual,
             p.tarifa_actual, p.consumo_anual_kwh, p.gasto_mensual_estimado_eur,
             p.ahorro_estimado_eur, p.ahorro_porcentaje, p.cups,
             p.fecha_ultimo_contacto, p.fecha_vencimiento_contrato,
             COALESCE(ps.score_total, 0) as score_ia,
             u.nombre as comercial
      FROM prospects p
      LEFT JOIN prospect_scores ps ON ps.prospect_id = p.id
      LEFT JOIN users u ON u.id = p.asignado_a
      WHERE 1=1 ${where}
      ORDER BY p.created_at DESC
    `, p);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'CRM Energía — Somos Sinergia';
    wb.created = new Date();

    const ws = wb.addWorksheet('Prospectos', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    ws.columns = [
      { header: 'Negocio', key: 'nombre_negocio', width: 30 },
      { header: 'Contacto', key: 'nombre_contacto', width: 20 },
      { header: 'Email', key: 'email_principal', width: 28 },
      { header: 'Teléfono', key: 'telefono_movil', width: 15 },
      { header: 'Municipio', key: 'municipio', width: 18 },
      { header: 'Provincia', key: 'provincia', width: 15 },
      { header: 'Estado', key: 'estado', width: 14 },
      { header: 'Temperatura', key: 'temperatura', width: 13 },
      { header: 'Comercializadora', key: 'comercializadora_actual', width: 18 },
      { header: 'Tarifa', key: 'tarifa_actual', width: 10 },
      { header: 'Consumo anual kWh', key: 'consumo_anual_kwh', width: 18 },
      { header: 'Gasto mes €', key: 'gasto_mensual_estimado_eur', width: 14 },
      { header: 'Ahorro mes €', key: 'ahorro_estimado_eur', width: 14 },
      { header: 'Ahorro %', key: 'ahorro_porcentaje', width: 10 },
      { header: 'CUPS', key: 'cups', width: 24 },
      { header: 'Último contacto', key: 'fecha_ultimo_contacto', width: 16 },
      { header: 'Vencimiento', key: 'fecha_vencimiento_contrato', width: 14 },
      { header: 'Score IA', key: 'score_ia', width: 10 },
      { header: 'Comercial', key: 'comercial', width: 18 },
    ];

    // Estilo cabecera
    ws.getRow(1).eachCell((cell: any) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ws.getRow(1).height = 22;

    prospects.rows.forEach((row: any) => {
      const r = ws.addRow(row);
      // Color por temperatura
      const tempColors: Record<string, string> = { caliente: 'FFFEE2E2', templado: 'FFFEF9C3', frio: 'FFF0F9FF' };
      const bgColor = tempColors[row.temperatura] || 'FFFFFFFF';
      r.eachCell((cell: any) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      });
    });

    // Hoja de resumen KPIs
    const wsKPI = wb.addWorksheet('Resumen KPIs');
    wsKPI.addRow(['Métrica', 'Valor']);
    wsKPI.addRow(['Total prospectos', prospects.rows.length]);
    wsKPI.addRow(['Clientes activos', prospects.rows.filter((r: any) => r.estado === 'cliente').length]);
    wsKPI.addRow(['Ahorro potencial mes €', prospects.rows.reduce((s: number, r: any) => s + parseFloat(r.ahorro_estimado_eur || 0), 0).toFixed(2)]);
    wsKPI.addRow(['Generado', new Date().toLocaleString('es-ES')]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="crm-energia-${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err: any) {
    logger.error('Error exportando Excel:', err);
    return res.status(500).json({ error: 'Error generando Excel' });
  }
}

// ── 10. Exportar PDF (informe ejecutivo) ──────────────────────────────────
export async function exportPDF(req: Request, res: Response) {
  try {
    const { where, params } = userFilter(req);
    const p = [...params];

    const [kpis, topProspectos] = await Promise.all([
      query(`SELECT COUNT(*) FILTER (WHERE estado NOT IN ('cliente','perdido','descartado')) as pipeline,
                    COUNT(*) FILTER (WHERE estado='cliente') as clientes,
                    COALESCE(SUM(ahorro_estimado_eur) FILTER (WHERE estado='cliente'),0) as ahorro_mes
             FROM prospects ${where ? `WHERE ${where.replace('AND ', '')}` : ''}`, params),
      query(`SELECT nombre_negocio, estado, temperatura, ahorro_estimado_eur, municipio,
                    COALESCE(ps.score_total,0) as score
             FROM prospects p LEFT JOIN prospect_scores ps ON ps.prospect_id = p.id
             WHERE estado NOT IN ('perdido','descartado') ${where}
             ORDER BY ps.score_total DESC NULLS LAST LIMIT 10`, p),
    ]);

    const k = kpis.rows[0];
    const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; padding: 40px; }
  .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 32px; border-radius: 12px; margin-bottom: 32px; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .header p { font-size: 14px; opacity: 0.8; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; }
  .kpi .value { font-size: 32px; font-weight: 700; color: #4f46e5; }
  .kpi .label { font-size: 12px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px; }
  th { background: #4f46e5; color: white; padding: 10px 12px; text-align: left; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
  .badge-caliente { background: #fef2f2; color: #dc2626; }
  .badge-templado { background: #fefce8; color: #ca8a04; }
  .badge-frio { background: #eff6ff; color: #2563eb; }
  .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Informe CRM Energia</h1>
    <p>Somos Sinergia · Generado el ${fecha}</p>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="value">${k.pipeline}</div><div class="label">Pipeline Activo</div></div>
    <div class="kpi"><div class="value">${k.clientes}</div><div class="label">Clientes Activos</div></div>
    <div class="kpi"><div class="value">${parseFloat(k.ahorro_mes).toFixed(0)}€</div><div class="label">Ahorro/mes Generado</div></div>
  </div>

  <h2>Top Prospectos por Score IA</h2>
  <table>
    <thead><tr><th>Negocio</th><th>Municipio</th><th>Estado</th><th>Temperatura</th><th>Ahorro €/mes</th><th>Score IA</th></tr></thead>
    <tbody>
      ${topProspectos.rows.map((r: any) => `
        <tr>
          <td><strong>${r.nombre_negocio}</strong></td>
          <td>${r.municipio || '-'}</td>
          <td>${r.estado}</td>
          <td><span class="badge badge-${r.temperatura}">${r.temperatura}</span></td>
          <td>${r.ahorro_estimado_eur ? parseFloat(r.ahorro_estimado_eur).toFixed(2) + '€' : '-'}</td>
          <td><strong>${r.score}/100</strong></td>
        </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">CRM Energía · Somos Sinergia · ${fecha}</div>
</body>
</html>`;

    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }, printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="informe-crm-${Date.now()}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    logger.error('Error exportando PDF:', err);
    return res.status(500).json({ error: 'Error generando PDF' });
  }
}
