import { ContactEntry } from '../../services/contacts.service';
import { ESTADO_CONFIG, ProspectState } from '../../types/prospect';

interface Props {
  entries: ContactEntry[];
}

const TIPO_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  llamada:          { label: 'Llamada',           icon: '📞', color: 'border-blue-400' },
  visita_presencial:{ label: 'Visita presencial', icon: '🏢', color: 'border-green-400' },
  whatsapp:         { label: 'WhatsApp',          icon: '💬', color: 'border-green-500' },
  email_enviado:    { label: 'Email enviado',     icon: '📧', color: 'border-purple-400' },
  email_recibido:   { label: 'Email recibido',    icon: '📩', color: 'border-purple-300' },
  nota_interna:     { label: 'Nota interna',      icon: '📝', color: 'border-gray-400' },
  cambio_estado:    { label: 'Cambio de estado',  icon: '🔄', color: 'border-amber-400' },
  oferta_enviada:   { label: 'Oferta enviada',    icon: '📄', color: 'border-orange-400' },
  contrato:         { label: 'Contrato',          icon: '✅', color: 'border-green-600' },
};

const RESULTADO_CONFIG: Record<string, { label: string; color: string }> = {
  positivo:    { label: 'Positivo',     color: 'text-green-600 bg-green-50' },
  neutro:      { label: 'Neutro',       color: 'text-gray-600 bg-gray-50' },
  negativo:    { label: 'Negativo',     color: 'text-red-600 bg-red-50' },
  no_contesto: { label: 'No contesto',  color: 'text-amber-600 bg-amber-50' },
  buzon:       { label: 'Buzon',        color: 'text-gray-500 bg-gray-50' },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Hace ${diffD}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function ContactTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No hay actividad registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => {
        const tipoCfg = TIPO_CONFIG[entry.tipo] || TIPO_CONFIG.nota_interna;
        const resultadoCfg = RESULTADO_CONFIG[entry.resultado] || RESULTADO_CONFIG.neutro;

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Línea vertical + icono */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 ${tipoCfg.color} bg-white flex items-center justify-center text-sm flex-shrink-0`}>
                {tipoCfg.icon}
              </div>
              {i < entries.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 my-1" />
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{tipoCfg.label}</span>
                  {entry.user_nombre && (
                    <span className="text-xs text-gray-400 ml-2">por {entry.user_nombre}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${resultadoCfg.color}`}>
                    {resultadoCfg.label}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(entry.created_at)}</span>
                </div>
              </div>

              {/* Cambio de estado */}
              {entry.tipo === 'cambio_estado' && entry.estado_anterior && entry.estado_nuevo && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_CONFIG[entry.estado_anterior as ProspectState]?.bg || 'bg-gray-100'} ${ESTADO_CONFIG[entry.estado_anterior as ProspectState]?.color || ''}`}>
                    {ESTADO_CONFIG[entry.estado_anterior as ProspectState]?.label || entry.estado_anterior}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_CONFIG[entry.estado_nuevo as ProspectState]?.bg || 'bg-gray-100'} ${ESTADO_CONFIG[entry.estado_nuevo as ProspectState]?.color || ''}`}>
                    {ESTADO_CONFIG[entry.estado_nuevo as ProspectState]?.label || entry.estado_nuevo}
                  </span>
                </div>
              )}

              {/* Nota */}
              {entry.nota && (
                <p className="text-sm text-gray-600 mt-1">{entry.nota}</p>
              )}

              {/* Duración */}
              {entry.duracion_minutos && (
                <span className="text-xs text-gray-400 mt-1 inline-block">
                  Duracion: {entry.duracion_minutos} min
                </span>
              )}

              {/* Próxima acción */}
              {entry.proxima_accion && (
                <div className="mt-1.5 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                  Proxima accion: {entry.proxima_accion}
                  {entry.fecha_proxima_accion && (
                    <span className="ml-1 font-medium">
                      ({new Date(entry.fecha_proxima_accion).toLocaleDateString('es-ES')})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
