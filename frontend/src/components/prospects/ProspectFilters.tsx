import { ProspectFilters as Filters, ESTADO_CONFIG, CATEGORIAS } from '../../types/prospect';
import { Zone } from '../../types/prospect';

interface Props {
  filters: Filters;
  zones: Zone[];
  onChange: (filters: Filters) => void;
  total: number;
}

const FUENTES = [
  { value: 'csv_importado', label: 'CSV importado' },
  { value: 'manual', label: 'Manual' },
  { value: 'web', label: 'Web' },
  { value: 'referido', label: 'Referido' },
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'puerta_fria', label: 'Puerta fria' },
  { value: 'llamada_entrante', label: 'Llamada entrante' },
  { value: 'redes_sociales', label: 'Redes sociales' },
];

const PROVINCIAS = [
  'Alicante', 'Almeria', 'Asturias', 'Barcelona', 'Bizkaia', 'Cadiz', 'Castellon',
  'Cordoba', 'Granada', 'Gipuzkoa', 'Huelva', 'Jaen', 'Madrid', 'Malaga', 'Murcia',
  'Navarra', 'Sevilla', 'Valencia', 'Zaragoza',
];

export default function ProspectFiltersBar({ filters, zones, onChange, total }: Props) {
  const update = (key: string, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  const clearAll = () => {
    onChange({ page: 1, limit: filters.limit, sort_by: filters.sort_by, sort_order: filters.sort_order });
  };

  const hasActiveFilters = filters.estado || filters.prioridad || filters.temperatura ||
    filters.categoria || filters.zona_id || filters.search || filters.provincia || filters.fuente;

  const selectClass = "text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-gray-300 transition-colors";

  return (
    <div className="space-y-3">
      {/* Barra de busqueda */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, contacto, email, telefono..."
            value={filters.search || ''}
            onChange={(e) => update('search', e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap font-medium">{total} resultados</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filters.estado || ''} onChange={(e) => update('estado', e.target.value)} className={selectClass}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        <select value={filters.prioridad || ''} onChange={(e) => update('prioridad', e.target.value)} className={selectClass}>
          <option value="">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>

        <select value={filters.temperatura || ''} onChange={(e) => update('temperatura', e.target.value)} className={selectClass}>
          <option value="">Todas las temperaturas</option>
          <option value="frio">Frio</option>
          <option value="tibio">Tibio</option>
          <option value="caliente">Caliente</option>
        </select>

        <select value={filters.categoria || ''} onChange={(e) => update('categoria', e.target.value)} className={selectClass}>
          <option value="">Todas las categorias</option>
          {CATEGORIAS.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select value={filters.provincia || ''} onChange={(e) => update('provincia', e.target.value)} className={selectClass}>
          <option value="">Todas las provincias</option>
          {PROVINCIAS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select value={filters.zona_id || ''} onChange={(e) => update('zona_id', e.target.value)} className={selectClass}>
          <option value="">Todas las zonas</option>
          {zones.map(z => (
            <option key={z.id} value={z.id}>{z.nombre}</option>
          ))}
        </select>

        <select value={filters.fuente || ''} onChange={(e) => update('fuente', e.target.value)} className={selectClass}>
          <option value="">Todas las fuentes</option>
          {FUENTES.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Ordenacion */}
        <div className="border-l border-gray-200 pl-2 ml-1">
          <select
            value={`${filters.sort_by || 'created_at'}_${filters.sort_order || 'DESC'}`}
            onChange={(e) => {
              const [sort_by, sort_order] = e.target.value.split('_') as [string, 'ASC' | 'DESC'];
              onChange({ ...filters, sort_by, sort_order, page: 1 });
            }}
            className={selectClass}
          >
            <option value="created_at_DESC">Mas recientes</option>
            <option value="created_at_ASC">Mas antiguos</option>
            <option value="nombre_negocio_ASC">Nombre A-Z</option>
            <option value="nombre_negocio_DESC">Nombre Z-A</option>
            <option value="fecha_ultimo_contacto_DESC">Ultimo contacto</option>
            <option value="gasto_mensual_estimado_eur_DESC">Mayor gasto</option>
            <option value="ahorro_estimado_eur_DESC">Mayor ahorro</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
