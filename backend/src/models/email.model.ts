import { query } from '../config/database';

// ── Email Templates ──
export const emailTemplatesModel = {
  async getAll() {
    const sql = `SELECT * FROM email_templates ORDER BY created_at DESC`;
    return (await query(sql)).rows;
  },

  async getById(id: string) {
    const sql = `SELECT * FROM email_templates WHERE id = $1`;
    return (await query(sql, [id])).rows[0];
  },

  async create(data: {
    nombre: string; asunto: string; cuerpo_html: string;
    cuerpo_texto?: string; variables?: any; categoria?: string; created_by?: string;
  }) {
    const sql = `INSERT INTO email_templates (nombre, asunto, cuerpo_html, cuerpo_texto, variables, categoria, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    return (await query(sql, [
      data.nombre, data.asunto, data.cuerpo_html, data.cuerpo_texto || '',
      JSON.stringify(data.variables || []), data.categoria || 'general', data.created_by,
    ])).rows[0];
  },

  async update(id: string, data: Partial<{
    nombre: string; asunto: string; cuerpo_html: string;
    cuerpo_texto: string; variables: any; categoria: string; activa: boolean;
  }>) {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${i}`);
        values.push(key === 'variables' ? JSON.stringify(val) : val);
        i++;
      }
    }
    if (!fields.length) return null;
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const sql = `UPDATE email_templates SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    return (await query(sql, values)).rows[0];
  },

  async delete(id: string) {
    return (await query(`DELETE FROM email_templates WHERE id = $1`, [id])).rowCount;
  },
};

// ── Email Accounts (SMTP per user) ──
export const emailAccountsModel = {
  async getByUser(userId: string) {
    const sql = `SELECT id, user_id, nombre, email, smtp_host, smtp_port, smtp_user, from_name, firma_html, activa, ultimo_envio, envios_hoy, limite_diario, created_at
      FROM email_accounts WHERE user_id = $1 ORDER BY created_at DESC`;
    return (await query(sql, [userId])).rows;
  },

  async getById(id: string) {
    const sql = `SELECT * FROM email_accounts WHERE id = $1`;
    return (await query(sql, [id])).rows[0];
  },

  async create(data: {
    user_id: string; nombre: string; email: string; smtp_host: string;
    smtp_port?: number; smtp_user: string; smtp_pass_encrypted: string;
    from_name?: string; firma_html?: string; limite_diario?: number;
  }) {
    const sql = `INSERT INTO email_accounts (user_id, nombre, email, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, from_name, firma_html, limite_diario)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, user_id, nombre, email, smtp_host, smtp_port, smtp_user, from_name, firma_html, activa, limite_diario, created_at`;
    return (await query(sql, [
      data.user_id, data.nombre, data.email, data.smtp_host, data.smtp_port || 587,
      data.smtp_user, data.smtp_pass_encrypted, data.from_name || '', data.firma_html || '',
      data.limite_diario || 200,
    ])).rows[0];
  },

  async update(id: string, data: Partial<{
    nombre: string; email: string; smtp_host: string; smtp_port: number;
    smtp_user: string; smtp_pass_encrypted: string; from_name: string;
    firma_html: string; activa: boolean; limite_diario: number;
  }>) {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${i}`);
        values.push(val);
        i++;
      }
    }
    if (!fields.length) return null;
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const sql = `UPDATE email_accounts SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, user_id, nombre, email, smtp_host, smtp_port, smtp_user, from_name, firma_html, activa, limite_diario, created_at`;
    return (await query(sql, values)).rows[0];
  },

  async delete(id: string) {
    return (await query(`DELETE FROM email_accounts WHERE id = $1`, [id])).rowCount;
  },

  async incrementEnvios(id: string) {
    const sql = `UPDATE email_accounts SET envios_hoy = envios_hoy + 1, ultimo_envio = NOW() WHERE id = $1`;
    return query(sql, [id]);
  },

  async resetDailyCounters() {
    return query(`UPDATE email_accounts SET envios_hoy = 0`);
  },
};

// ── Emails Enviados ──
export const emailsEnviadosModel = {
  async getByProspect(prospectId: string, limit = 50) {
    const sql = `SELECT * FROM emails_enviados WHERE prospect_id = $1 ORDER BY enviado_at DESC LIMIT $2`;
    return (await query(sql, [prospectId, limit])).rows;
  },

  async getByCampaign(campaignId: string) {
    const sql = `SELECT * FROM emails_enviados WHERE campaign_id = $1 ORDER BY enviado_at DESC`;
    return (await query(sql, [campaignId])).rows;
  },

  async getRecent(userId: string, limit = 50) {
    const sql = `SELECT ee.*, p.nombre_negocio as prospect_nombre
      FROM emails_enviados ee
      LEFT JOIN prospects p ON ee.prospect_id = p.id
      LEFT JOIN email_accounts ea ON ee.account_id = ea.id
      WHERE ea.user_id = $1
      ORDER BY ee.enviado_at DESC LIMIT $2`;
    return (await query(sql, [userId, limit])).rows;
  },

  async create(data: {
    account_id?: string; prospect_id?: string; template_id?: string; campaign_id?: string;
    de_email: string; para_email: string; asunto: string; cuerpo_html: string;
    cuerpo_texto?: string; message_id?: string;
  }) {
    const sql = `INSERT INTO emails_enviados (account_id, prospect_id, template_id, campaign_id, de_email, para_email, asunto, cuerpo_html, cuerpo_texto, message_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
    return (await query(sql, [
      data.account_id, data.prospect_id, data.template_id, data.campaign_id,
      data.de_email, data.para_email, data.asunto, data.cuerpo_html,
      data.cuerpo_texto || '', data.message_id || '',
    ])).rows[0];
  },

  async markOpened(id: string) {
    const sql = `UPDATE emails_enviados SET abierto = true, num_aperturas = num_aperturas + 1,
      fecha_apertura = COALESCE(fecha_apertura, NOW()) WHERE id = $1`;
    return query(sql, [id]);
  },

  async incrementClicks(id: string) {
    const sql = `UPDATE emails_enviados SET clicks = clicks + 1 WHERE id = $1`;
    return query(sql, [id]);
  },

  async markBounced(id: string, error: string) {
    const sql = `UPDATE emails_enviados SET rebotado = true, estado = 'rebotado', error_mensaje = $2 WHERE id = $1`;
    return query(sql, [id, error]);
  },

  async getStats(userId: string) {
    const sql = `SELECT
      COUNT(*) as total_enviados,
      COUNT(*) FILTER (WHERE ee.abierto = true) as total_abiertos,
      SUM(ee.clicks) as total_clicks,
      COUNT(*) FILTER (WHERE ee.rebotado = true) as total_rebotes,
      COUNT(*) FILTER (WHERE ee.enviado_at > NOW() - INTERVAL '24 hours') as enviados_hoy,
      COUNT(*) FILTER (WHERE ee.enviado_at > NOW() - INTERVAL '7 days') as enviados_semana
      FROM emails_enviados ee
      LEFT JOIN email_accounts ea ON ee.account_id = ea.id
      WHERE ea.user_id = $1`;
    return (await query(sql, [userId])).rows[0];
  },
};

// ── Email Campaigns ──
export const emailCampaignsModel = {
  async getAll(userId: string) {
    const sql = `SELECT ec.*, et.nombre as template_nombre
      FROM email_campaigns ec
      LEFT JOIN email_templates et ON ec.template_id = et.id
      WHERE ec.created_by = $1
      ORDER BY ec.created_at DESC`;
    return (await query(sql, [userId])).rows;
  },

  async getById(id: string) {
    const sql = `SELECT ec.*, et.nombre as template_nombre, et.asunto as template_asunto, et.cuerpo_html as template_html
      FROM email_campaigns ec
      LEFT JOIN email_templates et ON ec.template_id = et.id
      WHERE ec.id = $1`;
    return (await query(sql, [id])).rows[0];
  },

  async create(data: {
    nombre: string; template_id?: string; asunto?: string;
    filtros?: any; created_by: string;
  }) {
    const sql = `INSERT INTO email_campaigns (nombre, template_id, asunto, filtros, created_by)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    return (await query(sql, [
      data.nombre, data.template_id, data.asunto,
      JSON.stringify(data.filtros || {}), data.created_by,
    ])).rows[0];
  },

  async update(id: string, data: Partial<{
    nombre: string; template_id: string; asunto: string;
    filtros: any; estado: string; total_destinatarios: number;
    enviados: number; abiertos: number; clicks: number; rebotes: number;
    programado_para: string; iniciado_at: string; completado_at: string;
  }>) {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${i}`);
        values.push(key === 'filtros' ? JSON.stringify(val) : val);
        i++;
      }
    }
    if (!fields.length) return null;
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const sql = `UPDATE email_campaigns SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    return (await query(sql, values)).rows[0];
  },

  async delete(id: string) {
    return (await query(`DELETE FROM email_campaigns WHERE id = $1`, [id])).rowCount;
  },
};

// ── Email Tracking ──
export const emailTrackingModel = {
  async create(data: { email_id: string; tipo: string; url?: string; ip?: string; user_agent?: string }) {
    const sql = `INSERT INTO email_tracking (email_id, tipo, url, ip, user_agent) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    return (await query(sql, [data.email_id, data.tipo, data.url || '', data.ip || '', data.user_agent || ''])).rows[0];
  },

  async getByEmail(emailId: string) {
    return (await query(`SELECT * FROM email_tracking WHERE email_id = $1 ORDER BY created_at DESC`, [emailId])).rows;
  },
};

// ── Email Secuencias (Drip) ──
export const emailSecuenciasModel = {
  async getAll(userId: string) {
    const sql = `SELECT es.*,
      (SELECT COUNT(*) FROM email_secuencia_pasos WHERE secuencia_id = es.id) as num_pasos,
      (SELECT COUNT(*) FROM email_secuencia_inscritos WHERE secuencia_id = es.id AND estado = 'activo') as inscritos_activos
      FROM email_secuencias es WHERE es.created_by = $1 ORDER BY es.created_at DESC`;
    return (await query(sql, [userId])).rows;
  },

  async getById(id: string) {
    const sql = `SELECT * FROM email_secuencias WHERE id = $1`;
    return (await query(sql, [id])).rows[0];
  },

  async create(data: { nombre: string; descripcion?: string; created_by: string }) {
    const sql = `INSERT INTO email_secuencias (nombre, descripcion, created_by) VALUES ($1,$2,$3) RETURNING *`;
    return (await query(sql, [data.nombre, data.descripcion || '', data.created_by])).rows[0];
  },

  async update(id: string, data: Partial<{ nombre: string; descripcion: string; activa: boolean }>) {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = $${i}`); values.push(val); i++; }
    }
    if (!fields.length) return null;
    fields.push(`updated_at = NOW()`);
    values.push(id);
    return (await query(`UPDATE email_secuencias SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values)).rows[0];
  },

  async delete(id: string) {
    return (await query(`DELETE FROM email_secuencias WHERE id = $1`, [id])).rowCount;
  },

  // Pasos
  async getPasos(secuenciaId: string) {
    const sql = `SELECT esp.*, et.nombre as template_nombre, et.asunto as template_asunto
      FROM email_secuencia_pasos esp
      LEFT JOIN email_templates et ON esp.template_id = et.id
      WHERE esp.secuencia_id = $1 ORDER BY esp.orden`;
    return (await query(sql, [secuenciaId])).rows;
  },

  async addPaso(data: { secuencia_id: string; orden: number; template_id: string; dias_espera?: number; condicion?: string }) {
    const sql = `INSERT INTO email_secuencia_pasos (secuencia_id, orden, template_id, dias_espera, condicion)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    return (await query(sql, [data.secuencia_id, data.orden, data.template_id, data.dias_espera || 1, data.condicion || 'siempre'])).rows[0];
  },

  async deletePaso(id: string) {
    return (await query(`DELETE FROM email_secuencia_pasos WHERE id = $1`, [id])).rowCount;
  },

  // Inscritos
  async getInscritos(secuenciaId: string) {
    const sql = `SELECT esi.*, p.nombre_negocio, p.email_principal
      FROM email_secuencia_inscritos esi
      LEFT JOIN prospects p ON esi.prospect_id = p.id
      WHERE esi.secuencia_id = $1 ORDER BY esi.inscrito_at DESC`;
    return (await query(sql, [secuenciaId])).rows;
  },

  async inscribir(data: { secuencia_id: string; prospect_id: string; proximo_envio?: string }) {
    const sql = `INSERT INTO email_secuencia_inscritos (secuencia_id, prospect_id, proximo_envio)
      VALUES ($1,$2,$3) ON CONFLICT (secuencia_id, prospect_id) DO NOTHING RETURNING *`;
    return (await query(sql, [data.secuencia_id, data.prospect_id, data.proximo_envio || new Date().toISOString()])).rows[0];
  },

  async desinscribir(secuenciaId: string, prospectId: string) {
    return (await query(`UPDATE email_secuencia_inscritos SET estado = 'cancelado', updated_at = NOW() WHERE secuencia_id = $1 AND prospect_id = $2`, [secuenciaId, prospectId])).rowCount;
  },
};
