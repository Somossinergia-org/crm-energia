import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mutateMock = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useLogin: () => ({ mutate: mutateMock, isPending: false }),
}));

import Login from './Login';
import { useAuthStore } from '../stores/authStore';

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useAuthStore.getState().logout();
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contrase/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('does not submit when required fields are empty', async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('shows validation error on short password', async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contrase/i), '12');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/minimo 6 caracteres/i)).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('calls login mutation with valid data', async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contrase/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(mutateMock).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'password123',
    });
  });

  it('quick-login buttons trigger mutation with preset credentials', async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.click(screen.getByText(/admin@sinergia\.es/i).closest('button')!);
    expect(mutateMock).toHaveBeenCalledWith({
      email: 'admin@sinergia.es',
      password: 'admin123',
    });

    mutateMock.mockClear();

    await user.click(screen.getByText(/juan@sinergia\.es/i).closest('button')!);
    expect(mutateMock).toHaveBeenCalledWith({
      email: 'juan@sinergia.es',
      password: 'comercial123',
    });
  });

  it('redirects to home when already authenticated', () => {
    useAuthStore.getState().setAuth(
      {
        id: '1', email: 'a@b.com', nombre: 'A', apellidos: '', role: 'admin',
        foto_url: null, telefono: '',
      },
      'token'
    );

    renderLogin();
    // When authenticated, Login renders <Navigate /> and form should not be visible
    expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument();
  });
});
