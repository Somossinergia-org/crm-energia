import { Prospect, ESTADO_CONFIG, TEMPERATURA_CONFIG, ProspectState, CATEGORIAS } from '../../types/prospect';
import { HiOutlinePhone, HiOutlineMail, HiOutlineStar } from 'react-icons/hi';

interface Props {
  prospects: Prospect[];
  onStatusChange: (id: string, estado: string) => void;
  onSelect: (prospect: Prospect) => void;
  onCall: (prospect: Prospect) => void;
  onWhatsApp: (prospect: Prospect) => void;
  onEmail?: (prospect: Prospect) => void;
}

function formatFuente(fuente: string): string {
  if (!fuente) return '-';
  const map: Record<string, string> = {
    csv_importado: 'CSV',
    manual: 'Manual',
    web: 'Web',
    referido: 'Referido',
    google_maps: 'Google Maps',
    puerta_fria: 'Puerta fria',
    llamada_entrante: 'Llamada',
    redes_sociales: 'RRSS',
  };
  return map[fuente] || fuente.replace(/_/g, ' ');
}

function formatCategoria(cat: string): string {
  return CATEGORIAS.find(c => c.value === cat)?.label || cat;
}

function daysSince(dateStr: string | null): string {
  if (!dateStr) return '-';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}m`;
}

function daysUntil(dateStr: string | null): { text: string; urgent: boolean } {
  if (!dateStr) return { text: '-', urgent: false };
  const days = Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d atras`, urgent: true };
  if (days === 0) return { text: 'Hoy', urgent: true };
  if (days === 1) return { text: 'Manana', urgent: false };
  return { text: `${days}d`, urgent: false };
}

export default function ProspectTable({ prospects, onStatusChange, onSelect, onCall, onWhatsApp, onEmail }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-3 pl-4 font-semibold text-gray-600">Negocio</th>
            <th className="pb-3 font-semibold text-gray-600">Contacto</th>
            <th className="pb-3 font-semibold text-gray-600">Estado</th>
            <th className="pb-3 font-semibold text-gray-600 text-center">Temp.</th>
            <th className="pb-3 font-semibold text-gray-600">Categoria</th>
            <th className="pb-3 font-semibold text-gray-600">Municipio</th>
            <th className="pb-3 font-semibold text-gray-600 text-center">Contacto</th>
            <th className="pb-3 font-semibold text-gray-600 text-right">Gasto/mes</th>
            <th className="pb-3 font-semibold text-gray-600 text-right">Ahorro</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((p) => {
            const estadoCfg = ESTADO_CONFIG[p.estado as ProspectState] || ESTADO_CONFIG.pendiente;
            const tempCfg = TEMPERATURA_CONFIG[p.temperatura as keyof typeof TEMPERATURA_CONFIG];
            const proximo = daysUntil(p.fecha_proximo_contacto);

            return (
              <tr
                key={p.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelect(p)}
              >
                {/* Negocio */}
                <td className="py-3 pl-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-1.5">
                        {p.nombre_negocio}
                        {p.rating_google && p.rating_google > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                            <HiOutlineStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {p.rating_google}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.zona_nombre && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: (p.zona_color || '#6366f1') + '20', color: p.zona_color || '#6366f1' }}
                          >
                            {p.zona_nombre}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatFuente(p.fuente)}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Contacto */}
                <td className="py-3">
                  <div className="text-gray-900">{p.nombre_contacto || '-'}</div>
                  {p.telefono_movil && (
                    <div className="text-xs text-gray-500">{p.telefono_movil}</div>
                  )}
                </td>

                {/* Estado */}
                <td className="py-3">
                  <select
                    value={p.estado}
                    onChange={(e) => {
                      e.stopPropagation();
                      onStatusChange(p.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${estadoCfg.bg} ${estadoCfg.color}`}
                  >
                    {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </td>

                {/* Temperatura */}
                <td className="py-3 text-center">
                  <span title={tempCfg?.label || ''} className="text-base">{tempCfg?.icon || ''}</span>
                </td>

                {/* Categoria */}
                <td className="py-3 text-gray-600 text-xs">{formatCategoria(p.categoria)}</td>

                {/* Municipio */}
                <td className="py-3 text-gray-600 text-xs">
                  {p.municipio || '-'}
                  {p.provincia && p.provincia !== p.municipio && (
                    <span className="text-gray-400 block">{p.provincia}</span>
                  )}
                </td>

                {/* Ultimo/Proximo contacto */}
                <td className="py-3 text-center">
                  <div className="text-xs">
                    {p.fecha_ultimo_contacto ? (
                      <span className="text-gray-500" title="Ultimo contacto">{daysSince(p.fecha_ultimo_contacto)}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </div>
                  {p.fecha_proximo_contacto && (
                    <div className={`text-xs font-medium ${proximo.urgent ? 'text-red-600' : 'text-blue-600'}`} title="Proximo contacto">
                      {proximo.text}
                    </div>
                  )}
                </td>

                {/* Gasto */}
                <td className="py-3 text-right font-medium text-gray-900 text-xs">
                  {p.gasto_mensual_estimado_eur ? `${Number(p.gasto_mensual_estimado_eur).toFixed(0)}€` : '-'}
                </td>

                {/* Ahorro */}
                <td className="py-3 text-right">
                  {p.ahorro_estimado_eur ? (
                    <span className="text-green-600 font-medium text-xs">
                      {Number(p.ahorro_estimado_eur).toFixed(0)}€
                      {p.ahorro_porcentaje && <span className="text-gray-400 ml-0.5">({p.ahorro_porcentaje}%)</span>}
                    </span>
                  ) : <span className="text-gray-300 text-xs">-</span>}
                </td>

                {/* Acciones */}
                <td className="py-3 pr-4">
                  <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {p.telefono_movil && (
                      <>
                        <button
                          onClick={() => onCall(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Llamar"
                        >
                          <HiOutlinePhone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onWhatsApp(p)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="WhatsApp"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          </svg>
                        </button>
                      </>
                    )}
                    {p.email_principal && (
                      <button
                        onClick={() => {
                          if (onEmail) onEmail(p);
                          else window.open(`mailto:${p.email_principal}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title={`Email: ${p.email_principal}`}
                      >
                        <HiOutlineMail className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {prospects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron prospectos con los filtros actuales
        </div>
      )}
    </div>
  );
}
