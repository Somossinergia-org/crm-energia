import nodemailer from 'nodemailer';
import { emailAccountsModel, emailsEnviadosModel, emailTrackingModel } from '../models/email.model';
import { decrypt } from '../utils/crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { query } from '../config/database';

// Cache de transporters por account_id
const transporterCache = new Map<string, { transporter: nodemailer.Transporter; expiresAt: number }>();

function getTransporter(account: {
  id: string; smtp_host: string; smtp_port: number;
  smtp_user: string; smtp_pass_encrypted: string;
}): nodemailer.Transporter {
  const cached = transporterCache.get(account.id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.transporter;
  }

  const password = decrypt(account.smtp_pass_encrypted);
  const transporter = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.smtp_port === 465,
    auth: { user: account.smtp_user, pass: password },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    rateDelta: 2000,
    rateLimit: 5,
  });

  transporterCache.set(account.id, {
    transporter,
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 min cache
  });

  return transporter;
}

// Reemplazar variables en plantilla
export function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

// Generar variables de un prospecto
export function getProspectVariables(prospect: any): Record<string, string> {
  return {
    nombre_negocio: prospect.nombre_negocio || '',
    nombre_contacto: prospect.nombre_contacto || '',
    categoria: prospect.categoria || '',
    municipio: prospect.municipio || '',
    provincia: prospect.provincia || '',
    telefono: prospect.telefono_movil || prospect.telefono_fijo || '',
    email: prospect.email_principal || '',
    comercializadora: prospect.comercializadora_actual || '',
    tarifa: prospect.tarifa_actual || '',
    gasto_mensual: prospect.gasto_mensual_estimado_eur ? `${prospect.gasto_mensual_estimado_eur}€` : '',
    consumo_anual: prospect.consumo_anual_kwh ? `${prospect.consumo_anual_kwh} kWh` : '',
    ahorro_estimado: prospect.ahorro_estimado_eur ? `${prospect.ahorro_estimado_eur}€` : '',
    ahorro_porcentaje: prospect.ahorro_porcentaje ? `${prospect.ahorro_porcentaje}%` : '',
    fecha: new Date().toLocaleDateString('es-ES'),
  };
}

// Insertar pixel de tracking en HTML
function insertTrackingPixel(html: string, emailId: string): string {
  const baseUrl = env.FRONTEND_URL.replace(':5173', ':3000');
  const pixel = `<img src="${baseUrl}/api/email/track/open/${emailId}" width="1" height="1" style="display:none" alt="" />`;
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }
  return html + pixel;
}

// Reemplazar links para tracking de clicks
function wrapLinksForTracking(html: string, emailId: string): string {
  const baseUrl = env.FRONTEND_URL.replace(':5173', ':3000');
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      const encoded = encodeURIComponent(url);
      return `href="${baseUrl}/api/email/track/click/${emailId}?url=${encoded}"`;
    }
  );
}

// ── Enviar email individual ──
export async function sendEmail(params: {
  accountId: string;
  prospectId?: string;
  templateId?: string;
  campaignId?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  variables?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
  firma?: string;
}) {
  const account = await emailAccountsModel.getById(params.accountId);
  if (!account) throw new Error('Cuenta de email no encontrada');
  if (!account.activa) throw new Error('Cuenta de email desactivada');
  if (account.envios_hoy >= account.limite_diario) {
    throw new Error(`Limite diario alcanzado (${account.limite_diario} emails)`);
  }

  // Reemplazar variables
  let html = params.variables ? replaceVariables(params.html, params.variables) : params.html;
  const subject = params.variables ? replaceVariables(params.subject, params.variables) : params.subject;
  const text = params.text && params.variables ? replaceVariables(params.text, params.variables) : params.text;

  // Añadir firma
  if (params.firma || account.firma_html) {
    html += `<br/><br/>${params.firma || account.firma_html}`;
  }

  // Guardar registro antes de enviar (para obtener ID de tracking)
  const emailRecord = await emailsEnviadosModel.create({
    account_id: params.accountId,
    prospect_id: params.prospectId,
    template_id: params.templateId,
    campaign_id: params.campaignId,
    de_email: account.email,
    para_email: params.to,
    asunto: subject,
    cuerpo_html: html,
    cuerpo_texto: text,
  });

  // Insertar tracking
  if (params.trackOpens !== false) {
    html = insertTrackingPixel(html, emailRecord.id);
  }
  if (params.trackClicks !== false) {
    html = wrapLinksForTracking(html, emailRecord.id);
  }

  const transporter = getTransporter(account);
  const fromName = account.from_name || account.nombre;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${account.email}>`,
      to: params.to,
      subject,
      html,
      text: text || undefined,
    });

    // Actualizar message_id y contadores
    await query(`UPDATE emails_enviados SET message_id = $1 WHERE id = $2`, [info.messageId, emailRecord.id]);
    await emailAccountsModel.incrementEnvios(params.accountId);

    // Actualizar stats del prospecto
    if (params.prospectId) {
      await query(`UPDATE prospects SET num_emails_enviados = num_emails_enviados + 1, fecha_ultimo_contacto = NOW() WHERE id = $1`, [params.prospectId]);
    }

    logger.info(`Email enviado a ${params.to} (ID: ${emailRecord.id})`);
    return { ...emailRecord, message_id: info.messageId, estado: 'enviado' };
  } catch (error: any) {
    await emailsEnviadosModel.markBounced(emailRecord.id, error.message);
    logger.error(`Error enviando email a ${params.to}: ${error.message}`);
    throw error;
  }
}

// ── Enviar campaña masiva ──
export async function sendCampaign(campaignId: string, accountId: string) {
  const { emailCampaignsModel } = await import('../models/email.model');
  const campaign = await emailCampaignsModel.getById(campaignId);
  if (!campaign) throw new Error('Campaña no encontrada');

  // Obtener destinatarios según filtros
  const filtros = campaign.filtros || {};
  let whereClause = 'WHERE email_principal IS NOT NULL AND email_principal != \'\'';
  const values: any[] = [];
  let paramIdx = 1;

  if (filtros.estado) { whereClause += ` AND estado = $${paramIdx++}`; values.push(filtros.estado); }
  if (filtros.zona_id) { whereClause += ` AND zona_id = $${paramIdx++}`; values.push(filtros.zona_id); }
  if (filtros.categoria) { whereClause += ` AND categoria = $${paramIdx++}`; values.push(filtros.categoria); }
  if (filtros.municipio) { whereClause += ` AND municipio ILIKE $${paramIdx++}`; values.push(`%${filtros.municipio}%`); }
  if (filtros.temperatura) { whereClause += ` AND temperatura = $${paramIdx++}`; values.push(filtros.temperatura); }

  const prospects = (await query(`SELECT * FROM prospects ${whereClause}`, values)).rows;

  await emailCampaignsModel.update(campaignId, {
    estado: 'enviando',
    total_destinatarios: prospects.length,
    iniciado_at: new Date().toISOString(),
  });

  const subject = campaign.asunto || campaign.template_asunto || '';
  const html = campaign.template_html || '';
  let enviados = 0;
  let rebotes = 0;

  for (const prospect of prospects) {
    try {
      const variables = getProspectVariables(prospect);
      await sendEmail({
        accountId,
        prospectId: prospect.id,
        templateId: campaign.template_id,
        campaignId,
        to: prospect.email_principal,
        subject,
        html,
        variables,
      });
      enviados++;
    } catch (err) {
      rebotes++;
      logger.error(`Error en campaña ${campaignId} para ${prospect.email_principal}`);
    }

    // Pequeña pausa entre envíos para no saturar
    await new Promise((r) => setTimeout(r, 1500));
  }

  await emailCampaignsModel.update(campaignId, {
    estado: 'completada',
    enviados,
    rebotes,
    completado_at: new Date().toISOString(),
  });

  return { enviados, rebotes, total: prospects.length };
}

// ── Verificar conexión SMTP ──
export async function testSmtpConnection(config: {
  smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass: string;
}): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465,
    auth: { user: config.smtp_user, pass: config.smtp_pass },
  });
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
