import api from './api';
import type { Prospect, ProspectFilters, ProspectsResponse, Zone } from '../types/prospect';

export const prospectsApi = {
  getAll: async (filters: ProspectFilters = {}): Promise<ProspectsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.append(key, String(value));
      }
    });
    const response = await api.get(`/prospects?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Prospect }> => {
    const response = await api.get(`/prospects/${id}`);
    return response.data;
  },

  getStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/prospects/stats');
    return response.data;
  },

  create: async (data: Partial<Prospect>): Promise<{ success: boolean; data: Prospect }> => {
    const response = await api.post('/prospects', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Prospect>): Promise<{ success: boolean; data: Prospect }> => {
    const response = await api.put(`/prospects/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, estado: string): Promise<{ success: boolean; data: Prospect }> => {
    const response = await api.patch(`/prospects/${id}/status`, { estado });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/prospects/${id}`);
  },

  duplicate: async (id: string): Promise<{ success: boolean; data: Prospect }> => {
    const response = await api.post(`/prospects/${id}/duplicate`);
    return response.data;
  },

  getClients: async (filters: ProspectFilters = {}): Promise<ProspectsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.append(key, String(value));
      }
    });
    const response = await api.get(`/prospects/clients?${params.toString()}`);
    return response.data;
  },

  getClientStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get('/prospects/clients/stats');
    return response.data;
  },

  importCSV: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/prospects/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const zonesApi = {
  getAll: async (): Promise<{ success: boolean; data: Zone[] }> => {
    const response = await api.get('/zones');
    return response.data;
  },

  create: async (data: { nombre: string; descripcion?: string; color?: string }): Promise<{ success: boolean; data: Zone }> => {
    const response = await api.post('/zones', data);
    return response.data;
  },
};
