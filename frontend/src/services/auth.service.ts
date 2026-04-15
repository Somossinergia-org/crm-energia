import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  role: 'admin' | 'comercial' | 'supervisor';
  foto_url: string | null;
  telefono: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: User;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<{ success: boolean; data: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};
