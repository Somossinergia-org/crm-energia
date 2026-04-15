import { useState } from 'react';
import { Prospect, ESTADO_CONFIG } from '../../types/prospect';

interface Props {
  prospect: Prospect;
  onSave: (data: {
    prospect_id: string;
    tipo: string;
    resultado: string;
    nota: string;
    duracion_minutos?: number;
    estado_nuevo?: string;
    proxima_accion?: string;
    fecha_proxima_accion?: string;
  }) => void;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { tipo: 'llamada', label: 'Llamada', icon: '📞' },
  { tipo: 'visita_presencial', label: 'Visita', icon: '🏢' },
  { tipo: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { tipo: 'email_enviado', label: 'Email', icon: '📧' },
  { tipo: 'nota_interna', label: 'Nota', icon: '📝' },
  { tipo: 'oferta_enviada', label: 'Oferta', icon: '📄' },
];

export default function QuickLogModal({ prospect, onSave, onClose }: Props) {
  const [tipo, setTipo] = useState('llamada');
  const [resultado, setResultado] = useState('positivo');
  const [nota, setNota] = useState('');
  const [duracion, setDuracion] = useState<number | undefined>();
  const [estadoNuevo, setEstadoNuevo] = useState('');
  const [proximaAccion, setProximaAccion] = useState('');
  const [fechaProxima, setFechaProxima] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      prospect_id: prospect.id,
      tipo,
      resultado,
      nota,
      duracion_minutos: duracion,
      estado_nuevo: estadoNuevo || undefined,
      proxima_accion: proximaAccion || undefined,
      fecha_proxima_accion: fechaProxima || undefined,
    });
  };

  // Acciones rápidas predefinidas
  const quickResults = [
    { resultado: 'no_contesto', label: 'No contesto', estadoNuevo: 'llamado' },
    { resultado: 'positivo', label: 'Interesado', estadoNuevo: 'interesado' },
    { resultado: 'negativo', label: 'Rechazado', estadoNuevo: '' },
    { resultado: 'neutro', label: 'Volver a llamar', estadoNuevo: 'volver_llamar' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Registrar actividad</h2>
            <p className="text-sm text-gray-500">{prospect.nombre_negocio}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de actividad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.tipo}
                  type="button"
                  onClick={() => setTipo(a.tipo)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    tipo === a.tipo
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Acciones rápidas */}
          {tipo === 'llamada' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resultado rapido</label>
              <div className="grid grid-cols-2 gap-2">
                {quickResults.map((qr) => (
                  <button
                    key={qr.label}
                    type="button"
                    onClick={() => {
                      setResultado(qr.resultado);
                      if (qr.estadoNuevo) setEstadoNuevo(qr.estadoNuevo);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      resultado === qr.resultado
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultado */}
          {tipo !== 'llamada' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Resultado</label>
              <select
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                className="input-field"
              >
                <option value="positivo">Positivo</option>
                <option value="neutro">Neutro</option>
                <option value="negativo">Negativo</option>
                <option value="no_contesto">No contesto</option>
                <option value="buzon">Buzon</option>
              </select>
            </div>
          )}

          {/* Nota */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nota</label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              className="input-field"
              placeholder="Que paso en esta interaccion..."
            />
          </div>

          {/* Duración */}
          {(tipo === 'llamada' || tipo === 'visita_presencial') && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Duracion (minutos)</label>
              <input
                type="number"
                value={duracion || ''}
                onChange={(e) => setDuracion(parseInt(e.target.value) || undefined)}
                className="input-field w-32"
                placeholder="5"
              />
            </div>
          )}

          {/* Cambiar estado */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cambiar estado a</label>
            <select
              value={estadoNuevo}
              onChange={(e) => setEstadoNuevo(e.target.value)}
              className="input-field"
            >
              <option value="">No cambiar</option>
              {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* Próxima acción */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Proxima accion</label>
              <input
                value={proximaAccion}
                onChange={(e) => setProximaAccion(e.target.value)}
                className="input-field"
                placeholder="Enviar oferta, llamar..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="datetime-local"
                value={fechaProxima}
                onChange={(e) => setFechaProxima(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
