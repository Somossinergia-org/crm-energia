import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

const mockUser = {
  id: '1',
  email: 'admin@test.com',
  nombre: 'Admin',
  apellidos: 'User',
  role: 'admin' as const,
  foto_url: null,
  telefono: '123456789',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAuth sets user and token', () => {
    useAuthStore.getState().setAuth(mockUser, 'test-token-123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('admin@test.com');
    expect(state.accessToken).toBe('test-token-123');
  });

  it('setAccessToken updates only the token', () => {
    useAuthStore.getState().setAuth(mockUser, 'old-token');
    useAuthStore.getState().setAccessToken('new-token');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-token');
    expect(state.user?.email).toBe('admin@test.com');
  });

  it('setUser updates only the user', () => {
    useAuthStore.getState().setAuth(mockUser, 'token');
    useAuthStore.getState().setUser({ ...mockUser, nombre: 'Updated' });

    const state = useAuthStore.getState();
    expect(state.user?.nombre).toBe('Updated');
    expect(state.accessToken).toBe('token');
  });

  it('logout clears all state', () => {
    useAuthStore.getState().setAuth(mockUser, 'token');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
