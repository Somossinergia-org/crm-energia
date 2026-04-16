import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLightningBolt,
  HiOutlineClipboard,
  HiOutlineBriefcase,
  HiOutlineExclamationCircle,
  HiSparkles,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

interface Props {
  prospectId: string;
  temperatura?: string;
  onCallAction?: () => void;
  onEmailAction?: (email: string) => void;
}

interface SalesPitch {
  apertura: string;
  propuesta_valor: string;
  cuerpo_pitch: string;
  cierre: string;
  puntos_clave: string[];
  tiempos_estimados: {
    apertura_seg: number;
    propuesta_seg: number;
    cierre_seg: number;
  };
}

interface SalesStrategy {
  temperatura: string;
  sector: string;
  estrategia: string;
  puntos_fuertes: string[];
  puntos_debiles_prospect: string[];
  mejor_hora_contacto: string;
  duracion_estimada_min: number;
  siguiente_contacto_dias: number;
}

interface SalesAction {
  tipo: 'llamar_ahora' | 'enviar_email' | 'cambiar_temperatura' | 'esperar' | 'ofertar';
  urgencia: 'alta' | 'media' | 'baja';
  accion: string;
  razon: string;
  tiempo_estimado_min: number;
}

interface ObjectionResponse {
  objecion: string;
  respuesta_inmediata: string;
  contraargumentos: string[];
  pruebas_efectivas: string[];
  siguiente_paso: string;
}

interface SalesPanelData {
  prospect_id: string;
  prospect: {
    nombre_negocio: string;
    nombre_contacto: string;
    categoria: string;
    temperatura: string;
    estado: string;
    ahorro_estimado_eur: number;
    dias_sin_contacto: number;
  };
  commercial_name: string;
  pitch: SalesPitch;
  strategy: SalesStrategy;
  action_suggested: SalesAction;
  historial_resumen: Array<{ tipo: string; descripcion: string; fecha: string }>;
  generated_at: string;
}

const urgencyColors = {
  alta: 'bg-red-50 border-red-200 text-red-700',
  media: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  baja: 'bg-green-50 border-green-200 text-green-700',
};

const urgencyIconColor = {
  alta: 'text-red-500',
  media: 'text-yellow-500',
  baja: 'text-green-500',
};

const tempBadgeColor = {
  caliente: 'bg-red-100 text-red-800',
  tibio: 'bg-orange-100 text-orange-800',
  templado: 'bg-orange-100 text-orange-800',
  frio: 'bg-blue-100 text-blue-800',
};

export default function SalesAgentPanel({
  prospectId,
  temperatura,
  onCallAction,
  onEmailAction,
}: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pitch' | 'strategy' | 'action'>('pitch');
  const [objectionInput, setObjectionInput] = useState('');
  const [showObjectionPanel, setShowObjectionPanel] = useState(false);
  const [objectionResponse, setObjectionResponse] = useState<ObjectionResponse | null>(null);
  const [isHandlingObjection, setIsHandlingObjection] = useState(false);

  // Obtener panel completo
  const { data, isLoading, isError, error } = useQuery<{ data: SalesPanelData }>({
    queryKey: ['sales-panel', prospectId],
    queryFn: () => api.get(`/sales/panel/${prospectId}`).then((r) => r.data),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Manejar objeción
  const objectiveMutation = useMutation({
    mutationFn: (objecion: string) =>
      api.post(`/sales/objection/${prospectId}`, { objecion }).then((r) => r.data),
    onSuccess: (response) => {
      setObjectionResponse(response.respuesta);
      setIsHandlingObjection(false);
    },
  });

  // Refrescar datos
  const refreshMutation = useMutation({
    mutationFn: () => queryClient.invalidateQueries({ queryKey: ['sales-panel', prospectId] }),
  });

  const handleObjectionSubmit = async () => {
    if (!objectionInput.trim()) return;
    setIsHandlingObjection(true);
    await objectiveMutation.mutateAsync(objectionInput.trim());
  };

  const panel = data?.data;

  if (isError) {
    const errorMsg = (error as any)?.response?.data?.error || 'Error cargando panel de ventas';
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-2">
          <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        <p className="mt-2 text-sm text-gray-600">Cargando asesor de ventas...</p>
      </div>
    );
  }

  if (!panel) return null;

  const { pitch, strategy, action_suggested } = panel;
  const totalPitchTime = pitch.tiempos_estimados.apertura_seg +
    pitch.tiempos_estimados.propuesta_seg +
    pitch.tiempos_estimados.cierre_seg;

  return (
    <div className="space-y-4">
      {/* ─── Header con info del prospecto ─────────────────────────────────── */}
      <div className="card p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{panel.prospect.nombre_negocio}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {panel.prospect.nombre_contacto && `Contacto: ${panel.prospect.nombre_contacto}`}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tempBadgeColor[temperatura as keyof typeof tempBadgeColor] || tempBadgeColor.frio}`}>
                {temperatura?.toUpperCase() || 'FRÍO'}
              </span>
              {panel.prospect.ahorro_estimado_eur > 0 && (
                <span className="text-sm font-semibold text-green-700">
                  💰 {panel.prospect.ahorro_estimado_eur}€/mes
                </span>
              )}
              <span className="text-xs text-gray-500">
                Sin contacto: {panel.prospect.dias_sin_contacto} días
              </span>
            </div>
          </div>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
            title="Refrescar"
          >
            <HiOutlineRefresh className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* ─── Action Suggested Alert ───────────────────────────────────────── */}
      <div className={`p-4 border rounded-lg ${urgencyColors[action_suggested.urgencia]}`}>
        <div className="flex items-start gap-3">
          <HiOutlineLightningBolt className={`w-5 h-5 shrink-0 mt-0.5 ${urgencyIconColor[action_suggested.urgencia]}`} />
          <div className="flex-1">
            <p className="font-semibold text-sm">{action_suggested.accion}</p>
            <p className="text-sm mt-1 opacity-75">{action_suggested.razon}</p>
            <p className="text-xs mt-2 opacity-60">
              ⏱️ {action_suggested.tiempo_estimado_min} min
            </p>
          </div>
          {action_suggested.tipo === 'llamar_ahora' && onCallAction && (
            <button
              onClick={onCallAction}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors shrink-0"
            >
              <HiOutlinePhone className="w-4 h-4" />
            </button>
          )}
          {action_suggested.tipo === 'enviar_email' && onEmailAction && (
            <button
              onClick={() => onEmailAction(prospectId)}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shrink-0"
            >
              <HiOutlineMail className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────── */}
      <div className="card border-b">
        <div className="flex gap-2 p-4">
          <button
            onClick={() => setActiveTab('pitch')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'pitch'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <HiOutlineClipboard className="inline w-4 h-4 mr-2" />
            Guión
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'strategy'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <HiOutlineBriefcase className="inline w-4 h-4 mr-2" />
            Estrategia
          </button>
        </div>
      </div>

      {/* ─── Pitch Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'pitch' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="space-y-4">
              {/* Apertura */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  1️⃣ Apertura ({pitch.tiempos_estimados.apertura_seg}s)
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-lg italic">
                  "{pitch.apertura}"
                </p>
              </div>

              {/* Propuesta de valor */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  2️⃣ Propuesta de Valor ({pitch.tiempos_estimados.propuesta_seg}s)
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-lg italic">
                  "{pitch.propuesta_valor}"
                </p>
              </div>

              {/* Cuerpo */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  3️⃣ Cuerpo del Pitch ({pitch.tiempos_estimados.cierre_seg}s)
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-lg italic">
                  "{pitch.cuerpo_pitch}"
                </p>
              </div>

              {/* Cierre */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">4️⃣ Cierre</h4>
                <p className="text-sm text-gray-700 leading-relaxed p-3 bg-indigo-50 rounded-lg italic font-semibold text-indigo-900">
                  "{pitch.cierre}"
                </p>
              </div>

              {/* Puntos clave */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 Puntos Clave</h4>
                <ul className="space-y-2">
                  {pitch.puntos_clave.map((punto, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <HiOutlineCheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{punto}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total time */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  ⏱️ Tiempo total estimado: {totalPitchTime} segundos ({Math.ceil(totalPitchTime / 60)} min)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Strategy Tab ────────────────────────────────────────────────── */}
      {activeTab === 'strategy' && (
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            {/* Estrategia */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Estrategia</h4>
              <p className="text-sm text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-lg">
                {strategy.estrategia}
              </p>
            </div>

            {/* Puntos fuertes */}
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2">✅ Nuestros Puntos Fuertes</h4>
              <ul className="space-y-2">
                {strategy.puntos_fuertes.map((punto, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold">+</span>
                    <span>{punto}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Puntos débiles del prospect */}
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2">⚠️ Objeciones Esperadas</h4>
              <ul className="space-y-2">
                {strategy.puntos_debiles_prospect.map((punto, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 font-bold">!</span>
                    <span>{punto}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 font-semibold">MEJOR HORA</p>
                <p className="text-sm font-bold text-blue-900">{strategy.mejor_hora_contacto}</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-600 font-semibold">SIGUIENTE CONTACTO</p>
                <p className="text-sm font-bold text-purple-900">{strategy.siguiente_contacto_dias} días</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Objection Handler ───────────────────────────────────────────── */}
      <div className="card p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <HiSparkles className="w-4 h-4 text-yellow-500" />
          Gestor de Objeciones
        </h4>

        {!showObjectionPanel ? (
          <button
            onClick={() => setShowObjectionPanel(true)}
            className="w-full px-4 py-2 bg-amber-100 text-amber-900 rounded-lg text-sm font-semibold hover:bg-amber-200 transition-colors"
          >
            📝 Manejar una objeción
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={objectionInput}
              onChange={(e) => setObjectionInput(e.target.value)}
              placeholder="Ej: 'Me va bien con mi proveedor actual'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleObjectionSubmit}
                disabled={!objectionInput.trim() || isHandlingObjection}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isHandlingObjection ? 'Procesando...' : 'Obtener respuesta'}
              </button>
              <button
                onClick={() => {
                  setShowObjectionPanel(false);
                  setObjectionInput('');
                  setObjectionResponse(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>

            {/* Respuesta a la objeción */}
            {objectionResponse && (
              <div className="mt-4 space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1">RESPUESTA INMEDIATA:</p>
                  <p className="text-sm text-amber-900 font-semibold italic">
                    "{objectionResponse.respuesta_inmediata}"
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1">CONTRAARGUMENTOS:</p>
                  <ul className="space-y-1">
                    {objectionResponse.contraargumentos.map((arg, idx) => (
                      <li key={idx} className="text-sm text-amber-800">
                        • {arg}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1">PRUEBAS EFECTIVAS:</p>
                  <ul className="space-y-1">
                    {objectionResponse.pruebas_efectivas.map((prueba, idx) => (
                      <li key={idx} className="text-sm text-amber-800">
                        ✓ {prueba}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-2 bg-white border border-amber-200 rounded">
                  <p className="text-xs font-semibold text-amber-600">SIGUIENTE PASO:</p>
                  <p className="text-sm text-amber-900 mt-1">{objectionResponse.siguiente_paso}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
