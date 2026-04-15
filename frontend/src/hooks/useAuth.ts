import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi, LoginRequest } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.accessToken);
      toast.success(`Bienvenido, ${response.data.user.nombre}`);
      navigate('/');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al iniciar sesion';
      toast.error(message);
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: () => {
      // Cerrar sesión localmente aunque falle el servidor
      logout();
      navigate('/login');
    },
  });
}
