import { Prospect, ESTADO_CONFIG, PRIORIDAD_CONFIG, TEMPERATURA_CONFIG, ProspectState, CATEGORIAS } from '../../types/prospect';
import { HiOutlinePhone, HiOutlineMail, HiOutlineStar, HiOutlineClock } from 'react-icons/hi';

interface Props {
  prospects: Prospect[];
  onSelect: (prospect: Prospect) => void;
  onCall: (prospect: Prospect) => void;
  onWhatsApp: (prospect: Prospect) => void;
  onStatusChange: (id: string, estado: string) => void;
}

function daysSince(dateStr: string | null): string {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days}d`;
  if (days < 30) return `Hace ${Math.floor(days / 7)}sem`;
  return `Hace ${Math.floor(days / 30)}m`;
}

function formatCategoria(cat: string): string {
  return CATEGORIAS.find(c => c.value === cat)?.label || cat;
}

export default function ProspectCards({ prospects, onSelect, onCall, onWhatsApp, onStatusChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {prospects.map((p) => {
        const estadoCfg = ESTADO_CONFIG[p.estado as ProspectState] || ESTADO_CONFIG.pendiente;
        const prioridadCfg = PRIORIDAD_CONFIG[p.prioridad as keyof typeof PRIORIDAD_CONFIG] || PRIORIDAD_CONFIG.media;
        const tempCfg = TEMPERATURA_CONFIG[p.temperatura as keyof typeof TEMPERATURA_CONFIG];

        return (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                  {p.nombre_negocio}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {p.nombre_contacto && (
                    <span className="text-sm text-gray-500 truncate">{p.nombre_contacto}</span>
                  )}
                  {p.rating_google && p.rating_google > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 shrink-0">
                      <HiOutlineStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {p.rating_google}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-lg ml-2 shrink-0">{tempCfg?.icon}</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoCfg.bg} ${estadoCfg.color}`}>
                {estadoCfg.label}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prioridadCfg.bg} ${prioridadCfg.color}`}>
                {prioridadCfg.label}
              </span>
              <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">
                {formatCategoria(p.categoria)}
              </span>
            </div>

            {/* Info */}
            <div className="space-y-1.5 text-sm mb-3">
              {p.municipio && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="truncate">{p.municipio}{p.provincia && p.provincia !== p.municipio ? `, ${p.provincia}` : ''}</span>
                </div>
              )}
              {p.telefono_movil && (
                <div className="flex items-center gap-2 text-gray-600">
                  <HiOutlinePhone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                  <span>{p.telefono_movil}</span>
                </div>
              )}
              {p.email_principal && (
                <div className="flex items-center gap-2 text-gray-600">
                  <HiOutlineMail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{p.email_principal}</span>
                </div>
              )}
              {p.fecha_ultimo_contacto && (
                <div className="flex items-center gap-2 text-gray-400">
                  <HiOutlineClock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">{daysSince(p.fecha_ultimo_contacto)}</span>
                  <span className="text-xs">· {p.numero_intentos_contacto} intentos</span>
                </div>
              )}
            </div>

            {/* Financiero */}
            {(p.gasto_mensual_estimado_eur || p.comercializadora_actual) && (
              <div className="bg-gray-50 rounded-lg p-2 mb-3 space-y-1">
                {p.comercializadora_actual && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Comercializadora</span>
                    <span className="text-gray-700">{p.comercializadora_actual}</span>
                  </div>
                )}
                {p.gasto_mensual_estimado_eur && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Gasto/mes</span>
                    <span className="font-semibold text-gray-900">{Number(p.gasto_mensual_estimado_eur).toFixed(0)}€</span>
                  </div>
                )}
                {p.ahorro_estimado_eur && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Ahorro/ano</span>
                    <span className="font-semibold text-green-600">
                      {Number(p.ahorro_estimado_eur).toFixed(0)}€
                      {p.ahorro_porcentaje && ` (${p.ahorro_porcentaje}%)`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Zona */}
            {p.zona_nombre && (
              <div className="mb-3">
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: (p.zona_color || '#6366f1') + '20', color: p.zona_color || '#6366f1' }}
                >
                  {p.zona_nombre}
                </span>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
              {p.telefono_movil && (
                <>
                  <button
                    onClick={() => onCall(p)}
                    className="flex-1 text-xs font-medium text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <HiOutlinePhone className="w-3.5 h-3.5" />
                    Llamar
                  </button>
                  <button
                    onClick={() => onWhatsApp(p)}
                    className="flex-1 text-xs font-medium text-green-600 hover:bg-green-50 py-1.5 rounded-lg transition-colors"
                  >
                    WhatsApp
                  </button>
                </>
              )}
              <select
                value={p.estado}
                onChange={(e) => onStatusChange(p.id, e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 px-1 bg-white"
              >
                {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>
        );
      })}

      {prospects.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          No se encontraron prospectos
        </div>
      )}
    </div>
  );
}
