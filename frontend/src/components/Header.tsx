import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import {
  HiOutlineMenu,
  HiOutlineBell,
  HiOutlineLogout,
  HiOutlineUser,
} from 'react-icons/hi';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Botón menú móvil */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <HiOutlineMenu className="w-6 h-6" />
      </button>

      {/* Barra de búsqueda */}
      <div className="flex-1 max-w-lg mx-4">
        <input
          type="search"
          placeholder="Buscar prospectos, emails..."
          className="input-field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              navigate(`/prospectos?search=${encodeURIComponent(searchQuery.trim())}`);
              setSearchQuery('');
            }
          }}
        />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <HiOutlineBell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
        </button>

        {/* Menu usuario */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">
                {user?.nombre?.charAt(0) || 'U'}
              </span>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium">{user?.nombre}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                <HiOutlineUser className="w-4 h-4" />
                Mi perfil
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => logoutMutation.mutate()}
              >
                <HiOutlineLogout className="w-4 h-4" />
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
