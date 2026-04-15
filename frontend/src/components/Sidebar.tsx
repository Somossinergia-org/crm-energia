import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineMail,
  HiOutlineInbox,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineLightningBolt,
  HiOutlineMap,
  HiOutlineOfficeBuilding,
  HiOutlineCollection,
} from 'react-icons/hi';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const comercialNav = [
  { name: 'Pipeline', href: '/pipeline', icon: HiOutlineUsers },
  { name: 'Clientes', href: '/clientes', icon: HiOutlineOfficeBuilding },
  { name: 'Servicios', href: '/servicios', icon: HiOutlineCollection },
];

const herramientasNav = [
  { name: 'Agente IA', href: '/agente', icon: HiOutlineLightningBolt },
  { name: 'Mapa', href: '/mapa', icon: HiOutlineMap },
  { name: 'Agenda', href: '/agenda', icon: HiOutlineCalendar },
  { name: 'Inbox', href: '/inbox', icon: HiOutlineInbox },
  { name: 'Emails', href: '/emails', icon: HiOutlineMail },
  { name: 'Calculadora', href: '/calculadora', icon: HiOutlineLightningBolt },
  { name: 'Reportes', href: '/reportes', icon: HiOutlineChartBar },
];

const adminNav = [
  { name: 'Configuracion', href: '/configuracion', icon: HiOutlineCog },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const SectionLabel = ({ children }: { children: string }) => (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{children}</p>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <HiOutlineLightningBolt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Somos Sinergia</h1>
            <p className="text-xs text-gray-500">CRM Comercial</p>
          </div>
        </div>

        {/* Navegacion */}
        <nav className="px-3 py-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {/* Dashboard */}
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            <HiOutlineHome className="w-5 h-5" />
            Dashboard
          </NavLink>

          {/* Comercial */}
          <SectionLabel>Comercial</SectionLabel>
          {comercialNav.map((item) => (
            <NavLink key={item.href} to={item.href} className={linkClass} onClick={onClose}>
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}

          {/* Herramientas */}
          <SectionLabel>Herramientas</SectionLabel>
          {herramientasNav.map((item) => (
            <NavLink key={item.href} to={item.href} className={linkClass} onClick={onClose}>
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}

          {/* Admin */}
          {user?.role === 'admin' && (
            <>
              <SectionLabel>Admin</SectionLabel>
              {adminNav.map((item) => (
                <NavLink key={item.href} to={item.href} className={linkClass} onClick={onClose}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Usuario actual */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">
                {user?.nombre?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.nombre} {user?.apellidos}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
