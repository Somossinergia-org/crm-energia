import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { serviciosApi, SERVICIOS_CONFIG, SERVICIO_ESTADOS } from '../services/servicios.service';
import {
  HiOutlineCollection,
  HiOutlineSearch,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

export default function Servicios() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{ servicio?: string; estado?: string; search?: string; page: number; limit: number }>({
    page: 1,
    limit: 50,
  });
  const [search, setSearch] = useState('');

  const { data: allData, isLoading } = useQuery({
    queryKey: ['servicios-all', filters],
    queryFn: () => serviciosApi.getAll(filters),
  });

  const { data: globalStatsData } = useQuery({
    queryKey: ['servicios-global-stats'],
    queryFn: () => serviciosApi.getGlobalStats(),
  });

  const { data: byTypeData } = useQuery({
    queryKey: ['servicios-by-type'],
    queryFn: () => serviciosApi.getStats(),
  });

  const servicios = allData?.data || [];
  const pagination = allData?.pagination;
  const globalStats = globalStatsData?.data;
  const byType = byTypeData?.data || [];

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value === '') {
      setFilters((f) => ({ ...f, search: undefined, page: 1 }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
        <p className="text-sm text-gray-500">Vista global de todos los servicios de tus prospectos y clientes</p>
      </div>

      {/* Global KPIs */}
      {globalStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{globalStats.total_negocios}</p>
            <p className="text-xs text-gray-500">Negocios</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{globalStats.total_servicios}</p>
            <p className="text-xs text-gray-500">Servicios total</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-green-700">{globalStats.contratados}</p>
            <p className="text-xs text-gray-500">Contratados</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{globalStats.en_proceso}</p>
            <p className="text-xs text-gray-500">En proceso</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-green-700">{Number(globalStats.facturacion_mensual).toLocaleString('es-ES', { maximumFractionDigits: 0 })} EUR</p>
            <p className="text-xs text-gray-500">Facturacion/mes</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-blue-700">{Number(globalStats.ahorro_total).toLocaleString('es-ES', { maximumFractionDigits: 0 })} EUR</p>
            <p className="text-xs text-gray-500">Ahorro generado</p>
          </div>
        </div>
      )}

      {/* By type cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {SERVICIOS_CONFIG.map((cfg) => {
          const stat = byType.find((s: any) => s.servicio === cfg.id);
          const total = stat ? Number(stat.total) : 0;
          const contratados = stat ? Number(stat.contratados) : 0;
          const isActive = filters.servicio === cfg.id;

          return (
            <button
              key={cfg.id}
              onClick={() => setFilters((f) => ({ ...f, servicio: f.servicio === cfg.id ? undefined : cfg.id, page: 1 }))}
              className={`rounded-lg p-2.5 border text-center transition-all ${
                isActive
                  ? `${cfg.bg} border-current ${cfg.color} ring-2 ring-current/20`
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{cfg.icon}</span>
              <p className={`text-xs font-medium mt-1 ${isActive ? cfg.color : 'text-gray-700'}`}>{cfg.label}</p>
              <p className="text-lg font-bold text-gray-900">{total}</p>
              {contratados > 0 && (
                <p className="text-xs text-green-600">{contratados} contratados</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por nombre de negocio..."
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
            value={filters.estado || ''}
            onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value || undefined, page: 1 }))}
            className="input-field w-auto"
          >
            <option value="">Todos los estados</option>
            {SERVICIO_ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : servicios.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineCollection className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Sin servicios</h3>
          <p className="text-sm text-gray-500">Anade servicios desde la ficha de cada prospecto.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Negocio</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Servicio</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Proveedor</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Gasto</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Ofertado</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Ahorro</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s: any) => {
                const cfg = SERVICIOS_CONFIG.find((c) => c.id === s.servicio);
                const estadoCfg = SERVICIO_ESTADOS.find((e) => e.value === s.estado);
                const isClient = s.prospect_estado === 'contrato_firmado';

                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(isClient ? `/clientes/${s.prospect_id}` : `/pipeline/${s.prospect_id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-gray-900">{s.nombre_negocio}</p>
                      <p className="text-xs text-gray-500">
                        {s.municipio}{s.provincia && s.municipio !== s.provincia ? `, ${s.provincia}` : ''}
                      </p>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${cfg?.color || 'text-gray-700'}`}>
                        <span>{cfg?.icon}</span>
                        <span className="font-medium">{cfg?.label || s.servicio}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${estadoCfg?.bg} ${estadoCfg?.color}`}>
                        {estadoCfg?.label || s.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-700">{s.proveedor_actual || '-'}</td>
                    <td className="py-2.5 px-4 text-right text-gray-700">
                      {s.gasto_actual_eur ? `${Number(s.gasto_actual_eur).toFixed(0)} EUR` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-700">
                      {s.precio_ofertado_eur ? `${Number(s.precio_ofertado_eur).toFixed(0)} EUR` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {s.ahorro_estimado_eur ? (
                        <span className="text-green-600 font-medium flex items-center justify-end gap-0.5">
                          <HiOutlineTrendingUp className="w-3 h-3" />
                          {Number(s.ahorro_estimado_eur).toFixed(0)} EUR
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-xs">
                      {s.fecha_vencimiento ? (
                        <span className={new Date(s.fecha_vencimiento) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(s.fecha_vencimiento).toLocaleDateString('es-ES')}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} servicios)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={pagination.page <= 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
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
