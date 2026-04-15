import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import {
  HiOutlineUser,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineCog,
  HiOutlineCamera,
  HiOutlineSave,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineExclamation,
  HiOutlineMail,
  HiOutlineRefresh,
  HiOutlineLink,
} from 'react-icons/hi';

type TabId = 'perfil' | 'empresa' | 'usuarios' | 'aplicacion' | 'integraciones';

interface ProfileForm {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  firma_email: string;
  foto_url: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface EmpresaForm {
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  logo_url: string;
  texto_legal: string;
}

interface UserRow {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  role: 'admin' | 'comercial' | 'supervisor';
  activo: boolean;
  foto_url: string | null;
}

interface NewUserForm {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  role: 'admin' | 'comercial' | 'supervisor';
}

interface AppPrefs {
  notificaciones: boolean;
  modoOscuro: boolean;
  idioma: string;
  timezone: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  comercial: 'Comercial',
  supervisor: 'Supervisor',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  comercial: 'bg-blue-100 text-blue-800',
  supervisor: 'bg-amber-100 text-amber-800',
};

const TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Bogota',
  'America/Mexico_City',
  'America/Buenos_Aires',
];

function Avatar({
  name,
  fotoUrl,
  size = 'md',
}: {
  name: string;
  fotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-20 h-20 text-2xl' };
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initial}
    </div>
  );
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {type === 'success' ? (
        <HiOutlineCheck className="w-5 h-5 flex-shrink-0" />
      ) : (
        <HiOutlineExclamation className="w-5 h-5 flex-shrink-0" />
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100">
        <HiOutlineX className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Configuracion() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('perfil');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const isAdmin = user?.role === 'admin';

  const tabs: { id: TabId; label: string; icon: typeof HiOutlineUser; adminOnly?: boolean }[] = [
    { id: 'perfil', label: 'Mi perfil', icon: HiOutlineUser },
    { id: 'empresa', label: 'Empresa', icon: HiOutlineOfficeBuilding, adminOnly: true },
    { id: 'usuarios', label: 'Usuarios', icon: HiOutlineUsers, adminOnly: true },
    { id: 'aplicacion', label: 'Aplicacion', icon: HiOutlineCog },
    { id: 'integraciones', label: 'Integraciones', icon: HiOutlineLink },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona tu cuenta y preferencias del sistema</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex gap-0 overflow-x-auto">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'perfil' && (
            <TabPerfil user={user} setUser={setUser} showToast={showToast} />
          )}
          {activeTab === 'empresa' && isAdmin && (
            <TabEmpresa showToast={showToast} />
          )}
          {activeTab === 'usuarios' && isAdmin && (
            <TabUsuarios showToast={showToast} />
          )}
          {activeTab === 'aplicacion' && (
            <TabAplicacion showToast={showToast} />
          )}
          {activeTab === 'integraciones' && (
            <TabIntegraciones showToast={showToast} />
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function TabPerfil({
  user,
  setUser,
  showToast,
}: {
  user: import('../services/auth.service').User | null;
  setUser: (u: import('../services/auth.service').User) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState<ProfileForm>({
    nombre: user?.nombre ?? '',
    apellidos: user?.apellidos ?? '',
    telefono: user?.telefono ?? '',
    email: user?.email ?? '',
    firma_email: (user as (typeof user & { firma_email?: string }) | null)?.firma_email ?? '',
    foto_url: user?.foto_url ?? '',
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<{ success: boolean; data: ProfileForm & { firma_email?: string } }>('/users/profile')
      .then((res) => {
        const d = res.data.data;
        setForm({
          nombre: d.nombre ?? '',
          apellidos: d.apellidos ?? '',
          telefono: d.telefono ?? '',
          email: d.email ?? '',
          firma_email: d.firma_email ?? '',
          foto_url: d.foto_url ?? '',
        });
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await api.put<{ success: boolean; data: import('../services/auth.service').User }>('/users/profile', {
        nombre: form.nombre,
        apellidos: form.apellidos,
        telefono: form.telefono,
        firma_email: form.firma_email,
        foto_url: form.foto_url,
      });
      if (res.data.success && res.data.data) {
        setUser(res.data.data);
      }
      showToast('Perfil actualizado correctamente');
    } catch {
      showToast('Error al guardar el perfil', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast('Completa todos los campos', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Las contraseñas nuevas no coinciden', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    setLoadingPassword(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast('Contraseña cambiada correctamente');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al cambiar la contraseña';
      showToast(msg, 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
  const readonlyClass =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed';

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar name={form.nombre} fotoUrl={form.foto_url} size="lg" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow hover:bg-indigo-700 transition-colors"
            title="Cambiar foto"
          >
            <HiOutlineCamera className="w-4 h-4" />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {form.nombre} {form.apellidos}
          </p>
          <p className="text-sm text-gray-500">{form.email}</p>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              ROLE_COLORS[user?.role ?? 'comercial']
            }`}
          >
            {ROLE_LABELS[user?.role ?? 'comercial']}
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Información personal</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input
              type="text"
              value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} readOnly className={readonlyClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL foto de perfil</label>
            <input
              type="url"
              value={form.foto_url}
              onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Firma de email</label>
        <textarea
          value={form.firma_email}
          onChange={(e) => setForm({ ...form, firma_email: e.target.value })}
          rows={5}
          placeholder="Escribe tu firma de email aquí..."
          className={`${inputClass} resize-y`}
        />
        {form.firma_email && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Vista previa
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-line">
              {form.firma_email}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveProfile}
          disabled={loadingProfile}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <HiOutlineSave className="w-4 h-4" />
          {loadingProfile ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineLockClosed className="w-5 h-5 text-gray-500" />
          Cambiar contraseña
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleChangePassword}
            disabled={loadingPassword}
            className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <HiOutlineLockClosed className="w-4 h-4" />
            {loadingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabEmpresa({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const STORAGE_KEY = 'crm-empresa-config';

  const [form, setForm] = useState<EmpresaForm>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as EmpresaForm;
    } catch {}
    return {
      nombre: '',
      cif: '',
      direccion: '',
      telefono: '',
      email: '',
      logo_url: '',
      texto_legal: '',
    };
  });
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        showToast('Datos de empresa guardados');
      } catch {
        showToast('Error al guardar', 'error');
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Datos de la empresa</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre empresa</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CIF / NIF</label>
            <input
              type="text"
              value={form.cif}
              onChange={(e) => setForm({ ...form, cif: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email corporativo</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo (URL)</label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
              {form.logo_url && (
                <img
                  src={form.logo_url}
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded border border-gray-200 bg-gray-50 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texto legal para propuestas PDF
        </label>
        <textarea
          value={form.texto_legal}
          onChange={(e) => setForm({ ...form, texto_legal: e.target.value })}
          rows={6}
          placeholder="Introduce el texto legal que aparecerá al pie de las propuestas..."
          className={`${inputClass} resize-y`}
        />
        <p className="text-xs text-gray-400 mt-1">
          Este texto se incluirá en el pie de página de los PDFs generados.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <HiOutlineSave className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

function TabUsuarios({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    role: 'comercial',
  });
  const [savingNew, setSavingNew] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: UserRow[] }>('/users');
      setUsers(res.data.data ?? []);
    } catch {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.nombre || !newUser.email || !newUser.password) {
      showToast('Completa nombre, email y contraseña', 'error');
      return;
    }
    setSavingNew(true);
    try {
      await api.post('/users', newUser);
      showToast('Usuario creado correctamente');
      setShowModal(false);
      setNewUser({ nombre: '', apellidos: '', email: '', password: '', role: 'comercial' });
      await fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al crear el usuario';
      showToast(msg, 'error');
    } finally {
      setSavingNew(false);
    }
  };

  const handleToggleActivo = async (u: UserRow) => {
    setTogglingId(u.id);
    try {
      await api.put(`/users/${u.id}`, { activo: !u.activo });
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, activo: !x.activo } : x))
      );
      showToast(`Usuario ${!u.activo ? 'activado' : 'desactivado'}`);
    } catch {
      showToast('Error al actualizar el usuario', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Usuarios del sistema</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No hay usuarios
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.nombre} fotoUrl={u.foto_url} size="sm" />
                        <span className="font-medium text-gray-900">
                          {u.nombre} {u.apellidos}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActivo(u)}
                        disabled={togglingId === u.id}
                        title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                          u.activo ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            u.activo ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Nuevo usuario</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={newUser.nombre}
                    onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={newUser.apellidos}
                    onChange={(e) => setNewUser({ ...newUser, apellidos: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <HiOutlineEyeOff className="w-4 h-4" />
                    ) : (
                      <HiOutlineEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value as NewUserForm['role'] })
                  }
                  className={inputClass}
                >
                  <option value="comercial">Comercial</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={savingNew}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <HiOutlinePlus className="w-4 h-4" />
                {savingNew ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabAplicacion({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const PREFS_KEY = 'crm-app-prefs';

  const [prefs, setPrefs] = useState<AppPrefs>(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) return JSON.parse(stored) as AppPrefs;
    } catch {}
    return {
      notificaciones: false,
      modoOscuro: false,
      idioma: 'es',
      timezone: 'Europe/Madrid',
    };
  });

  const savePrefs = (updated: AppPrefs) => {
    setPrefs(updated);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleClearCache = () => {
    const keysToKeep = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key === 'crm-auth' || key.startsWith('token'))) {
        keysToKeep.add(key);
      }
    }
    const preserved: Record<string, string> = {};
    keysToKeep.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v !== null) preserved[k] = v;
    });
    localStorage.clear();
    Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));
    showToast('Caché local limpiada correctamente');
  };

  const toggleClass = (active: boolean) =>
    `relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      active ? 'bg-indigo-600' : 'bg-gray-200'
    }`;

  const thumbClass = (active: boolean) =>
    `pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
      active ? 'translate-x-5' : 'translate-x-0'
    }`;

  const inputClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Preferencias</h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Notificaciones push</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Recibe alertas del sistema en el navegador
              </p>
            </div>
            <button
              onClick={() => savePrefs({ ...prefs, notificaciones: !prefs.notificaciones })}
              className={toggleClass(prefs.notificaciones)}
            >
              <span className={thumbClass(prefs.notificaciones)} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Modo oscuro</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Activa el tema oscuro en la interfaz
              </p>
            </div>
            <button
              onClick={() => savePrefs({ ...prefs, modoOscuro: !prefs.modoOscuro })}
              className={toggleClass(prefs.modoOscuro)}
            >
              <span className={thumbClass(prefs.modoOscuro)} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Localización</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
            <select
              value={prefs.idioma}
              onChange={(e) => savePrefs({ ...prefs, idioma: e.target.value })}
              className={`${inputClass} w-full`}
            >
              <option value="es">Español</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
            <select
              value={prefs.timezone}
              onChange={(e) => savePrefs({ ...prefs, timezone: e.target.value })}
              className={`${inputClass} w-full`}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Mantenimiento</h2>
        <p className="text-sm text-gray-500 mb-4">
          Limpia los datos almacenados en el navegador sin cerrar tu sesion.
        </p>
        <button
          onClick={handleClearCache}
          className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <HiOutlineTrash className="w-4 h-4" />
          Limpiar cache local
        </button>
      </div>
    </div>
  );
}

// ─── Interfaces Gmail ─────────────────────────────────────────────────────────

interface GmailAccount {
  id: string;
  email: string;
  activo: boolean;
  ultima_sincronizacion: string | null;
}

interface GmailAccountsResponse {
  success: boolean;
  data: GmailAccount[];
}

interface GmailAuthResponse {
  success: boolean;
  data: { url: string };
}

function TabIntegraciones({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get<GmailAccountsResponse>('/gmail/accounts');
      setAccounts(res.data.data ?? []);
    } catch {
      // API may not exist yet or no accounts — treat as empty
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnect = async () => {
    try {
      const res = await api.get<GmailAuthResponse>('/gmail/auth');
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch {
      showToast('No se pudo iniciar la autenticacion con Gmail', 'error');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/gmail/sync');
      showToast('Sincronizacion completada');
      await fetchAccounts();
    } catch {
      showToast('Error al sincronizar', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!window.confirm('Desconectar esta cuenta de Gmail? Se dejaran de sincronizar los emails.')) return;
    setDisconnectingId(accountId);
    try {
      await api.delete(`/gmail/accounts/${accountId}`);
      showToast('Cuenta desconectada');
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch {
      showToast('Error al desconectar la cuenta', 'error');
    } finally {
      setDisconnectingId(null);
    }
  };

  const formatSyncDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Nunca';
    const d = new Date(dateStr);
    return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Integraciones</h2>
        <p className="text-sm text-gray-500">Conecta servicios externos para potenciar el CRM</p>
      </div>

      {/* Gmail Section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-200">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <HiOutlineMail className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Gmail</p>
            <p className="text-xs text-gray-500">Sincroniza emails con prospectos automaticamente</p>
          </div>
          <div className="flex items-center gap-2">
            {accounts.length > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                <HiOutlineRefresh className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>
            )}
            <button
              onClick={handleConnect}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <HiOutlinePlus className="w-3.5 h-3.5" />
              Conectar cuenta
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          {loadingAccounts ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-5 h-5 rounded-full border-2 border-red-500 border-t-transparent" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <HiOutlineMail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500 mb-1">No hay cuentas de Gmail conectadas</p>
              <p className="text-xs text-gray-400 mb-4">
                Conecta tu cuenta para sincronizar emails con los prospectos del CRM.
              </p>
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                <HiOutlineMail className="w-4 h-4" />
                Conectar Gmail
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-red-600">
                        {account.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{account.email}</p>
                      <p className="text-xs text-gray-400">
                        Ultima sync: {formatSyncDate(account.ultima_sincronizacion)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        account.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {account.activo ? 'Activa' : 'Inactiva'}
                    </span>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      disabled={disconnectingId === account.id}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {disconnectingId === account.id ? 'Desconectando...' : 'Desconectar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
