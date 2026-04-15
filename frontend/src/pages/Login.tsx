import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { HiOutlineLightningBolt } from 'react-icons/hi';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <HiOutlineLightningBolt className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">CRM Energia</h1>
          <p className="text-primary-200 mt-1">Somos Sinergia</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Iniciar sesion
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="tu@sinergia.es"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input-field"
                placeholder="Tu contrasena"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full py-2.5"
            >
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-2">Credenciales de prueba:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Admin:</strong> admin@sinergia.es / admin123</p>
              <p><strong>Comercial:</strong> juan@sinergia.es / comercial123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
