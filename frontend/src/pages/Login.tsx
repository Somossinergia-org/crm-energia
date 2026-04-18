import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { HiOutlineLightningBolt, HiOutlineUserCircle, HiOutlineBriefcase } from 'react-icons/hi';

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

  const quickLogin = (email: string, password: string) => {
    loginMutation.mutate({ email, password });
  };

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

          {/* Acceso rapido */}
          <div className="mt-6">
            <p className="text-xs text-gray-400 text-center mb-3">— Acceso rapido —</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => quickLogin('admin@sinergia.es', 'admin123')}
                disabled={loginMutation.isPending}
                className="flex items-center gap-2 p-3 rounded-xl border-2 border-primary-100 bg-primary-50 hover:bg-primary-100 hover:border-primary-300 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <HiOutlineUserCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-primary-700">Admin</p>
                  <p className="text-xs text-gray-500">admin@sinergia.es</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('juan@sinergia.es', 'comercial123')}
                disabled={loginMutation.isPending}
                className="flex items-center gap-2 p-3 rounded-xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <HiOutlineBriefcase className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-emerald-700">Comercial</p>
                  <p className="text-xs text-gray-500">juan@sinergia.es</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
