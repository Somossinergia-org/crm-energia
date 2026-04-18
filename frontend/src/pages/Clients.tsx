import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { prospectsApi } from '../services/prospects.service';
import { SERVICIOS_CONFIG } from '../services/servicios.service';
import { Prospect, ProspectFilters, CATEGORIAS } from '../types/prospect';
import {
  HiOutlineOfficeBuilding,
  HiOutlineCurrencyEuro,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlineExclamation,
} from 'react-icons/hi';

export default function Clients() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProspectFilters>({ page: 1, limit: 25 });
  const [search, setSearch] = useState('');

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', filters],
    queryFn: () => prospectsApi.getClients(filters),
  });

  const { data: clientStatsData } = useQuery({
    queryKey: ['client-stats'],
    queryFn: () => prospectsApi.getClientStats(),
  });

  const clients = clientsData?.data || [];
  const pagination = clientsData?.pagination;
  const stats = clientStatsData?.data;

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  }, [search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (value === '') {
      setFilters((f) => ({ ...f, search: undefined, page: 1 }));
    }
  }, []);

  const kpis = [
    {
      label: 'Clientes activos',
      value: stats?.total_clientes ?? '-',
      icon: HiOutlineOfficeBuilding,
      color: 'bg-green-500',
    },
    {
      label: 'Servicios contratados',
      value: stats?.total_servicios ?? '-',
      icon: HiOutlineStar,
      color: 'bg-blue-500',
    },
    {
      label: 'Facturacion mensual',
      value: stats ? `${Number(stats.facturacion_mensual).toLocaleString('es-ES', { maximumFractionDigits: 0 })} EUR` : '-',
      icon: HiOutlineCurrencyEuro,
      color: 'bg-amber-500',
    },
    {
      label: 'Renovaciones proximas',
      value: stats ? `${Number(stats.renovaciones_proximas)}` : '-',
      icon: HiOutlineRefresh,
      color: 'bg-purple-500',
      alert: stats && Number(stats.servicios_vencidos) > 0 ? `${stats.servicios_vencidos} vencidos` : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Negocios con al menos un servicio contratado</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card flex items-center gap-4">
            <div className={`${kpi.color} p-3 rounded-lg`}>
              <kpi.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-sm text-gray-500">{kpi.label}</p>
              {kpi.alert && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                  <HiOutlineExclamation className="w-3 h-3" />
                  {kpi.alert}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar clientes..."
              className="input-field pl-9"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Buscar
            </button>
          </div>
          <select
            value={filters.categoria || ''}
            onChange={(e) => setFilters((f) => ({ ...f, categoria: e.target.value || undefined, page: 1 }))}
            className="input-field w-auto"
          >
            <option value="">Todas las categorias</option>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={filters.provincia || ''}
            onChange={(e) => setFilters((f) => ({ ...f, provincia: e.target.value || undefined, page: 1 }))}
            className="input-field w-auto"
          >
            <option value="">Todas las provincias</option>
            {['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Malaga', 'Zaragoza', 'Alicante', 'Murcia', 'Bilbao', 'Granada'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Client List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineOfficeBuilding className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Sin clientes aun</h3>
          <p className="text-sm text-gray-500">
            Cuando un prospecto tenga un servicio con estado &quot;Contratado&quot;, aparecera aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Negocio</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contacto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Ubicacion</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Servicios</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Cliente desde</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client: Prospect) => (
                <ClientRow key={client.id} client={client} onClick={() => navigate(`/clientes/${client.id}`)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} clientes)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              disabled={pagination.page <= 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientRow({ client, onClick }: { client: Prospect; onClick: () => void }) {
  const formatCategoria = (cat: string) =>
    CATEGORIAS.find((c) => c.value === cat)?.label || cat;

  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-gray-900">{client.nombre_negocio}</p>
            <p className="text-xs text-gray-500">{formatCategoria(client.categoria)}</p>
          </div>
          {client.rating_google && client.rating_google > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-0.5">
              <HiOutlineStar className="w-3 h-3 fill-amber-400 text-amber-400" />
              {client.rating_google}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-gray-900">{client.nombre_contacto || '-'}</p>
        {client.telefono_movil && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <HiOutlinePhone className="w-3 h-3" />
            {client.telefono_movil}
          </p>
        )}
      </td>
      <td className="py-3 px-4">
        <p className="text-gray-900">{client.municipio || '-'}</p>
        {client.provincia && client.provincia !== client.municipio && (
          <p className="text-xs text-gray-500">{client.provincia}</p>
        )}
      </td>
      <td className="py-3 px-4">
        <ClientServiceBadges prospectId={client.id} />
      </td>
      <td className="py-3 px-4 text-right">
        {client.fecha_conversion ? (
          <span className="text-gray-600 text-xs">
            {new Date(client.fecha_conversion).toLocaleDateString('es-ES')}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
    </tr>
  );
}

function ClientServiceBadges({ prospectId }: { prospectId: string }) {
  const { data } = useQuery({
    queryKey: ['servicios', prospectId],
    queryFn: () => import('../services/servicios.service').then((m) => m.serviciosApi.getByProspect(prospectId)),
    staleTime: 30000,
  });

  const servicios = data?.data || [];
  const contratados = servicios.filter((s: any) => s.estado === 'contratado');

  if (contratados.length === 0) return <span className="text-xs text-gray-400">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {contratados.map((s: any) => {
        const cfg = SERVICIOS_CONFIG.find((c) => c.id === s.servicio);
        return (
          <span
            key={s.id}
            className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${cfg?.bg || 'bg-gray-100'} ${cfg?.color || 'text-gray-600'}`}
            title={cfg?.label || s.servicio}
          >
            <span>{cfg?.icon}</span>
            <span className="hidden lg:inline">{cfg?.label}</span>
          </span>
        );
      })}
    </div>
  );
}
