import { Request, Response, NextFunction } from 'express';
import {
  emailTemplatesModel,
  emailAccountsModel,
  emailsEnviadosModel,
  emailCampaignsModel,
  emailTrackingModel,
  emailSecuenciasModel,
} from '../models/email.model';
import { sendEmail, sendCampaign, testSmtpConnection, replaceVariables, getProspectVariables } from '../services/email.service';
import { encrypt } from '../utils/crypto';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ══════════ Templates ══════════
export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await emailTemplatesModel.getAll();
    res.json({ data: templates });
  } catch (e) { next(e); }
};

export const getTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await emailTemplatesModel.getById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json({ data: t });
  } catch (e) { next(e); }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const t = await emailTemplatesModel.create({ ...req.body, created_by: userId });
    res.status(201).json({ data: t });
  } catch (e) { next(e); }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await emailTemplatesModel.update(req.params.id, req.body);
    if (!t) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json({ data: t });
  } catch (e) { next(e); }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await emailTemplatesModel.delete(req.params.id);
    res.json({ message: 'Plantilla eliminada' });
  } catch (e) { next(e); }
};

// Preview template with variables
export const previewTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { template_id, prospect_id } = req.body;
    const template = await emailTemplatesModel.getById(template_id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });

    let variables: Record<string, string> = {};
    if (prospect_id) {
      const prospect = (await query(`SELECT * FROM prospects WHERE id = $1`, [prospect_id])).rows[0];
      if (prospect) variables = getProspectVariables(prospect);
    }

    const html = replaceVariables(template.cuerpo_html, variables);
    const asunto = replaceVariables(template.asunto, variables);
    res.json({ data: { asunto, html } });
  } catch (e) { next(e); }
};

// ══════════ Accounts ══════════
export const getAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const accounts = await emailAccountsModel.getByUser(userId);
    res.json({ data: accounts });
  } catch (e) { next(e); }
};

export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { smtp_pass, ...rest } = req.body;
    const smtp_pass_encrypted = encrypt(smtp_pass);
    const account = await emailAccountsModel.create({ ...rest, user_id: userId, smtp_pass_encrypted });
    res.status(201).json({ data: account });
  } catch (e) { next(e); }
};

export const updateAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { smtp_pass, ...rest } = req.body;
    const updateData: any = { ...rest };
    if (smtp_pass) updateData.smtp_pass_encrypted = encrypt(smtp_pass);
    const account = await emailAccountsModel.update(req.params.id, updateData);
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json({ data: account });
  } catch (e) { next(e); }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await emailAccountsModel.delete(req.params.id);
    res.json({ message: 'Cuenta eliminada' });
  } catch (e) { next(e); }
};

export const testAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass } = req.body;
    const ok = await testSmtpConnection({ smtp_host, smtp_port, smtp_user, smtp_pass });
    res.json({ data: { connected: ok } });
  } catch (e) { next(e); }
};

// ══════════ Send Email ══════════
export const sendSingleEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { account_id, prospect_id, template_id, to, subject, html, text } = req.body;

    let finalHtml = html;
    let finalSubject = subject;

    // Si hay template, cargar y rellenar variables
    if (template_id && prospect_id) {
      const template = await emailTemplatesModel.getById(template_id);
      const prospect = (await query(`SELECT * FROM prospects WHERE id = $1`, [prospect_id])).rows[0];
      if (template && prospect) {
        const vars = getProspectVariables(prospect);
        finalHtml = finalHtml || replaceVariables(template.cuerpo_html, vars);
        finalSubject = finalSubject || replaceVariables(template.asunto, vars);
      }
    }

    const result = await sendEmail({
      accountId: account_id,
      prospectId: prospect_id,
      templateId: template_id,
      to,
      subject: finalSubject,
      html: finalHtml,
      text,
    });
    res.json({ data: result });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Send email to multiple prospects
export const sendBulkEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { account_id, prospect_ids, template_id, subject, html } = req.body;
    const template = template_id ? await emailTemplatesModel.getById(template_id) : null;
    const results: { prospect_id: string; ok: boolean; error?: string }[] = [];

    for (const prospectId of prospect_ids) {
      const prospect = (await query(`SELECT * FROM prospects WHERE id = $1`, [prospectId])).rows[0];
      if (!prospect?.email_principal) {
        results.push({ prospect_id: prospectId, ok: false, error: 'Sin email' });
        continue;
      }

      try {
        const vars = getProspectVariables(prospect);
        await sendEmail({
          accountId: account_id,
          prospectId,
          templateId: template_id,
          to: prospect.email_principal,
          subject: replaceVariables(subject || template?.asunto || '', vars),
          html: replaceVariables(html || template?.cuerpo_html || '', vars),
          variables: vars,
        });
        results.push({ prospect_id: prospectId, ok: true });
      } catch (err: any) {
        results.push({ prospect_id: prospectId, ok: false, error: err.message });
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    res.json({ data: { results, total: results.length, enviados: results.filter(r => r.ok).length } });
  } catch (e) { next(e); }
};

// ══════════ Email History ══════════
export const getEmailHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const emails = await emailsEnviadosModel.getRecent(userId, Number(req.query.limit) || 50);
    res.json({ data: emails });
  } catch (e) { next(e); }
};

export const getEmailsByProspect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emails = await emailsEnviadosModel.getByProspect(req.params.prospectId);
    res.json({ data: emails });
  } catch (e) { next(e); }
};

export const getEmailStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const stats = await emailsEnviadosModel.getStats(userId);
    res.json({ data: stats });
  } catch (e) { next(e); }
};

// ══════════ Campaigns ══════════
export const getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const campaigns = await emailCampaignsModel.getAll(userId);
    res.json({ data: campaigns });
  } catch (e) { next(e); }
};

export const getCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = await emailCampaignsModel.getById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Campaña no encontrada' });
    res.json({ data: c });
  } catch (e) { next(e); }
};

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const c = await emailCampaignsModel.create({ ...req.body, created_by: userId });
    res.status(201).json({ data: c });
  } catch (e) { next(e); }
};

export const updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const c = await emailCampaignsModel.update(req.params.id, req.body);
    if (!c) return res.status(404).json({ error: 'Campaña no encontrada' });
    res.json({ data: c });
  } catch (e) { next(e); }
};

export const deleteCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await emailCampaignsModel.delete(req.params.id);
    res.json({ message: 'Campaña eliminada' });
  } catch (e) { next(e); }
};

export const launchCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { account_id } = req.body;
    // Lanzar en background
    sendCampaign(req.params.id, account_id).catch(err => {
      logger.error(`Error campaña ${req.params.id}: ${err.message}`);
    });
    res.json({ message: 'Campaña lanzada. Se procesará en segundo plano.' });
  } catch (e) { next(e); }
};

// ══════════ Tracking (public endpoints, no auth) ══════════
export const trackOpen = async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    await emailsEnviadosModel.markOpened(emailId);
    await emailTrackingModel.create({
      email_id: emailId,
      tipo: 'apertura',
      ip: req.ip || '',
      user_agent: req.headers['user-agent'] || '',
    });
  } catch (e) {
    logger.error(`Error tracking open: ${e}`);
  }
  // Devolver pixel transparente 1x1
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache' });
  res.send(pixel);
};

export const trackClick = async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const url = req.query.url as string;
    await emailsEnviadosModel.incrementClicks(emailId);
    await emailTrackingModel.create({
      email_id: emailId,
      tipo: 'click',
      url,
      ip: req.ip || '',
      user_agent: req.headers['user-agent'] || '',
    });
    if (url) return res.redirect(url);
  } catch (e) {
    logger.error(`Error tracking click: ${e}`);
  }
  res.status(404).send('Not found');
};

// ══════════ Secuencias (Drip) ══════════
export const getSecuencias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const secuencias = await emailSecuenciasModel.getAll(userId);
    res.json({ data: secuencias });
  } catch (e) { next(e); }
};

export const getSecuencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const s = await emailSecuenciasModel.getById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Secuencia no encontrada' });
    const pasos = await emailSecuenciasModel.getPasos(req.params.id);
    const inscritos = await emailSecuenciasModel.getInscritos(req.params.id);
    res.json({ data: { ...s, pasos, inscritos } });
  } catch (e) { next(e); }
};

export const createSecuencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const s = await emailSecuenciasModel.create({ ...req.body, created_by: userId });
    res.status(201).json({ data: s });
  } catch (e) { next(e); }
};

export const updateSecuencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const s = await emailSecuenciasModel.update(req.params.id, req.body);
    if (!s) return res.status(404).json({ error: 'Secuencia no encontrada' });
    res.json({ data: s });
  } catch (e) { next(e); }
};

export const deleteSecuencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await emailSecuenciasModel.delete(req.params.id);
    res.json({ message: 'Secuencia eliminada' });
  } catch (e) { next(e); }
};

export const addPasoSecuencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paso = await emailSecuenciasModel.addPaso({ ...req.body, secuencia_id: req.params.id });
    res.status(201).json({ data: paso });
  } catch (e) { next(e); }
};

export const deletePasoSecuencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await emailSecuenciasModel.deletePaso(req.params.pasoId);
    res.json({ message: 'Paso eliminado' });
  } catch (e) { next(e); }
};

export const inscribirProspecto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prospect_ids } = req.body;
    const results = [];
    for (const pid of prospect_ids) {
      const r = await emailSecuenciasModel.inscribir({ secuencia_id: req.params.id, prospect_id: pid });
      results.push(r);
    }
    res.json({ data: results });
  } catch (e) { next(e); }
};

export const desinscribirProspecto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await emailSecuenciasModel.desinscribir(req.params.id, req.params.prospectId);
    res.json({ message: 'Prospecto desinscrito' });
  } catch (e) { next(e); }
};
