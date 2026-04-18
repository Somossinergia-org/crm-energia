import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../stores/authStore';

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/protected']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
}

const mockUser = {
  id: '1',
  email: 'admin@test.com',
  nombre: 'Admin',
  apellidos: 'User',
  role: 'admin' as const,
  foto_url: null,
  telefono: '123456789',
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('renders children when authenticated', () => {
    useAuthStore.getState().setAuth(mockUser, 'token');

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user has matching role', () => {
    useAuthStore.getState().setAuth(mockUser, 'token');

    renderWithRouter(
      <ProtectedRoute roles={['admin']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects when user lacks required role', () => {
    useAuthStore.getState().setAuth({ ...mockUser, role: 'comercial' }, 'token');

    renderWithRouter(
      <ProtectedRoute roles={['admin']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('allows any of multiple roles', () => {
    useAuthStore.getState().setAuth({ ...mockUser, role: 'supervisor' }, 'token');

    renderWithRouter(
      <ProtectedRoute roles={['admin', 'supervisor']}>
        <div>Restricted Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Restricted Content')).toBeInTheDocument();
  });
});
