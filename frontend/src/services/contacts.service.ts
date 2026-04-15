import api from './api';

export interface ContactEntry {
  id: string;
  prospect_id: string;
  user_id: string | null;
  tipo: string;
  resultado: string;
  nota: string;
  duracion_minutos: number | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  proxima_accion: string;
  fecha_proxima_accion: string | null;
  adjuntos: string[];
  created_at: string;
  user_nombre?: string;
  prospect_nombre?: string;
}

export interface Visit {
  id: string;
  prospect_id: string;
  user_id: string;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_minutos: number;
  estado: string;
  resultado: string | null;
  notas_resultado: string;
  direccion: string;
  coordenadas_lat: number | null;
  coordenadas_lng: number | null;
  orden_ruta: number;
  color: string;
  prospect_nombre?: string;
  prospect_telefono?: string;
  prospect_direccion?: string;
}

export const contactsApi = {
  getByProspect: async (prospectId: string): Promise<{ success: boolean; data: ContactEntry[] }> => {
    const response = await api.get(`/contacts/prospect/${prospectId}`);
    return response.data;
  },

  getRecent: async (limit = 20): Promise<{ success: boolean; data: ContactEntry[] }> => {
    const response = await api.get(`/contacts/recent?limit=${limit}`);
    return response.data;
  },

  getToday: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/contacts/today');
    return response.data;
  },

  create: async (data: {
    prospect_id: string;
    tipo: string;
    resultado?: string;
    nota?: string;
    duracion_minutos?: number;
    estado_nuevo?: string;
    proxima_accion?: string;
    fecha_proxima_accion?: string;
  }): Promise<{ success: boolean; data: ContactEntry }> => {
    const response = await api.post('/contacts', data);
    return response.data;
  },
};

export const visitsApi = {
  getAll: async (start: string, end: string): Promise<{ success: boolean; data: Visit[] }> => {
    const response = await api.get(`/visits?start=${start}&end=${end}`);
    return response.data;
  },

  getToday: async (): Promise<{ success: boolean; data: Visit[] }> => {
    const response = await api.get('/visits/today');
    return response.data;
  },

  create: async (data: {
    prospect_id: string;
    titulo: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin: string;
    duracion_minutos?: number;
    direccion?: string;
    coordenadas_lat?: number;
    coordenadas_lng?: number;
    color?: string;
  }): Promise<{ success: boolean; data: Visit }> => {
    const response = await api.post('/visits', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Visit>): Promise<{ success: boolean; data: Visit }> => {
    const response = await api.put(`/visits/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/visits/${id}`);
  },
};
