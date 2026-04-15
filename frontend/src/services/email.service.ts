import api from './api';

// ── Types ──
export interface EmailTemplate {
  id: string;
  nombre: string;
  asunto: string;
  cuerpo_html: string;
  cuerpo_texto: string;
  variables: string[];
  categoria: string;
  activa: boolean;
  created_at: string;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  from_name: string;
  firma_html: string;
  activa: boolean;
  ultimo_envio: string | null;
  envios_hoy: number;
  limite_diario: number;
  created_at: string;
}

export interface EmailEnviado {
  id: string;
  account_id: string;
  prospect_id: string | null;
  template_id: string | null;
  campaign_id: string | null;
  de_email: string;
  para_email: string;
  asunto: string;
  cuerpo_html: string;
  estado: string;
  abierto: boolean;
  fecha_apertura: string | null;
  num_aperturas: number;
  clicks: number;
  rebotado: boolean;
  enviado_at: string;
  prospect_nombre?: string;
}

export interface EmailCampaign {
  id: string;
  nombre: string;
  template_id: string | null;
  asunto: string;
  filtros: Record<string, any>;
  estado: string;
  total_destinatarios: number;
  enviados: number;
  abiertos: number;
  clicks: number;
  rebotes: number;
  programado_para: string | null;
  iniciado_at: string | null;
  completado_at: string | null;
  template_nombre?: string;
  created_at: string;
}

export interface EmailSecuencia {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  num_pasos?: number;
  inscritos_activos?: number;
  created_at: string;
}

export interface EmailStats {
  total_enviados: number;
  total_abiertos: number;
  total_clicks: number;
  total_rebotes: number;
  enviados_hoy: number;
  enviados_semana: number;
}

// ── API calls ──
export const emailApi = {
  // Templates
  getTemplates: async () => (await api.get('/email/templates')).data,
  getTemplate: async (id: string) => (await api.get(`/email/templates/${id}`)).data,
  createTemplate: async (data: Partial<EmailTemplate>) => (await api.post('/email/templates', data)).data,
  updateTemplate: async (id: string, data: Partial<EmailTemplate>) => (await api.put(`/email/templates/${id}`, data)).data,
  deleteTemplate: async (id: string) => (await api.delete(`/email/templates/${id}`)).data,
  previewTemplate: async (template_id: string, prospect_id?: string) =>
    (await api.post('/email/templates/preview', { template_id, prospect_id })).data,

  // Accounts
  getAccounts: async () => (await api.get('/email/accounts')).data,
  createAccount: async (data: any) => (await api.post('/email/accounts', data)).data,
  updateAccount: async (id: string, data: any) => (await api.put(`/email/accounts/${id}`, data)).data,
  deleteAccount: async (id: string) => (await api.delete(`/email/accounts/${id}`)).data,
  testAccount: async (data: { smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass: string }) =>
    (await api.post('/email/accounts/test', data)).data,

  // Sending
  sendEmail: async (data: {
    account_id: string; prospect_id?: string; template_id?: string;
    to: string; subject: string; html: string; text?: string;
  }) => (await api.post('/email/send', data)).data,

  sendBulk: async (data: {
    account_id: string; prospect_ids: string[];
    template_id?: string; subject: string; html: string;
  }) => (await api.post('/email/send/bulk', data)).data,

  // History & Stats
  getHistory: async (limit = 50) => (await api.get(`/email/history?limit=${limit}`)).data,
  getStats: async () => (await api.get('/email/stats')).data,
  getByProspect: async (prospectId: string) => (await api.get(`/email/prospect/${prospectId}`)).data,

  // Campaigns
  getCampaigns: async () => (await api.get('/email/campaigns')).data,
  getCampaign: async (id: string) => (await api.get(`/email/campaigns/${id}`)).data,
  createCampaign: async (data: any) => (await api.post('/email/campaigns', data)).data,
  updateCampaign: async (id: string, data: any) => (await api.put(`/email/campaigns/${id}`, data)).data,
  deleteCampaign: async (id: string) => (await api.delete(`/email/campaigns/${id}`)).data,
  launchCampaign: async (id: string, account_id: string) =>
    (await api.post(`/email/campaigns/${id}/launch`, { account_id })).data,

  // Secuencias
  getSecuencias: async () => (await api.get('/email/secuencias')).data,
  getSecuencia: async (id: string) => (await api.get(`/email/secuencias/${id}`)).data,
  createSecuencia: async (data: any) => (await api.post('/email/secuencias', data)).data,
  updateSecuencia: async (id: string, data: any) => (await api.put(`/email/secuencias/${id}`, data)).data,
  deleteSecuencia: async (id: string) => (await api.delete(`/email/secuencias/${id}`)).data,
  addPaso: async (secuenciaId: string, data: any) =>
    (await api.post(`/email/secuencias/${secuenciaId}/pasos`, data)).data,
  deletePaso: async (secuenciaId: string, pasoId: string) =>
    (await api.delete(`/email/secuencias/${secuenciaId}/pasos/${pasoId}`)).data,
  inscribir: async (secuenciaId: string, prospect_ids: string[]) =>
    (await api.post(`/email/secuencias/${secuenciaId}/inscribir`, { prospect_ids })).data,
  desinscribir: async (secuenciaId: string, prospectId: string) =>
    (await api.delete(`/email/secuencias/${secuenciaId}/inscritos/${prospectId}`)).data,
};
