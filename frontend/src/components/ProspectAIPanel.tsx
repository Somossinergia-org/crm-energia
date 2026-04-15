import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import ScoreBadge from './ScoreBadge';
import {
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineClipboard,
  HiOutlineCheckCircle,
  HiSparkles,
} from 'react-icons/hi';

interface Props {
  prospectId: string;
  prospectNombre: string;
  onUseEmail?: (asunto: string, cuerpoHtml: string) => void;
}

interface ScoreData {
  score: number;
  sub_scores?: {
    email?: number;
    energetico?: number;
    actividad?: number;
  };
  factores?: string[];
}

interface BriefingData {
  briefing: string;
  siguiente_paso?: string;
  motivos_interes?: string[];
  objeciones?: string[];
}

interface EmailData {
  asunto: string;
  cuerpo_html: string;
}

const OBJETIVOS = [
  { value: 'presentacion', label: 'Presentación inicial' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'oferta', label: 'Envío de oferta' },
  { value: 'reactivacion', label: 'Reactivación' },
];

function NoApiKeyMessage() {
  return (
    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <HiOutlineLightningBolt className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800">
        Configura tu API key de Gemini en Ajustes para activar la IA
      </p>
    </div>
  );
}

function isApiKeyError(err: unknown): boolean {
  const msg = (err as any)?.response?.data?.error ?? '';
  return (
    msg.toLowerCase().includes('api key') ||
    msg.toLowerCase().includes('gemini') ||
    (err as any)?.response?.status === 503
  );
}

function ProgressBar({ value, max = 100, color = 'bg-blue-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Score section ───────────────────────────────────────────────────────────
function ScoreSection({ prospectId }: { prospectId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<{ data: ScoreData }>({
    queryKey: ['ai-score', prospectId],
    queryFn: () => api.get(`/ai/prospects/${prospectId}/score`).then((r) => r.data),
    retry: 1,
  });

  const recalcMutation = useMutation({
    mutationFn: () => api.post(`/ai/prospects/${prospectId}/score`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-score', prospectId] }),
  });

  const sub = data?.data?.sub_scores;

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <HiSparkles className="w-4 h-4 text-indigo-500" />
          Score IA
        </h3>
        <button
          onClick={() => recalcMutation.mutate()}
          disabled={recalcMutation.isPending || isLoading}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
        >
          <HiOutlineRefresh className={`w-3.5 h-3.5 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
          Recalcular
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {isError && isApiKeyError(error) && <NoApiKeyMessage />}

      {isError && !isApiKeyError(error) && (
        <p className="text-xs text-gray-400 text-center py-2">No se pudo cargar el score</p>
      )}

      {data?.data && (
        <>
          <div className="flex items-center gap-4">
            <ScoreBadge score={data.data.score} prospectId={prospectId} size="md" />
          </div>

          {sub && (
            <div className="space-y-3">
              {sub.email !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <HiOutlineMail className="w-3.5 h-3.5" /> Engagement email
                    </span>
                    <span className="text-xs font-medium text-gray-700">{sub.email}/100</span>
                  </div>
                  <ProgressBar value={sub.email} color="bg-blue-400" />
                </div>
              )}
              {sub.energetico !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <HiOutlineLightningBolt className="w-3.5 h-3.5" /> Perfil energético
                    </span>
                    <span className="text-xs font-medium text-gray-700">{sub.energetico}/100</span>
                  </div>
                  <ProgressBar value={sub.energetico} color="bg-amber-400" />
                </div>
              )}
              {sub.actividad !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <HiOutlinePhone className="w-3.5 h-3.5" /> Actividad
                    </span>
                    <span className="text-xs font-medium text-gray-700">{sub.actividad}/100</span>
                  </div>
                  <ProgressBar value={sub.actividad} color="bg-green-400" />
                </div>
              )}
            </div>
          )}

          {data.data.factores && data.data.factores.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Factores clave</p>
              <ul className="space-y-1">
                {data.data.factores.map((f, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Briefing de llamada ──────────────────────────────────────────────────────
function CallBriefingSection({ prospectId }: { prospectId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<{ data: BriefingData }>({
    queryKey: ['ai-call-briefing', prospectId],
    queryFn: () => api.get(`/ai/prospects/${prospectId}/briefing`).then((r) => r.data),
    retry: 1,
  });

  const regenMutation = useMutation({
    mutationFn: () => api.post(`/ai/prospects/${prospectId}/briefing`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-call-briefing', prospectId] }),
  });

  const briefingData = data?.data;

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <HiOutlinePhone className="w-4 h-4 text-green-500" />
          Briefing de llamada
        </h3>
        <button
          onClick={() => regenMutation.mutate()}
          disabled={regenMutation.isPending || isLoading}
          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
        >
          <HiOutlineRefresh className={`w-3.5 h-3.5 ${regenMutation.isPending ? 'animate-spin' : ''}`} />
          Regenerar
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full" />
        </div>
      )}

      {isError && isApiKeyError(error) && <NoApiKeyMessage />}

      {isError && !isApiKeyError(error) && (
        <p className="text-xs text-gray-400 text-center py-2">No se pudo cargar el briefing</p>
      )}

      {briefingData && (
        <div className="space-y-3">
          {briefingData.briefing && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{briefingData.briefing}</p>
            </div>
          )}

          {briefingData.siguiente_paso && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">Siguiente paso sugerido</p>
              <p className="text-sm text-blue-800">{briefingData.siguiente_paso}</p>
            </div>
          )}

          {briefingData.motivos_interes && briefingData.motivos_interes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Motivos de interés</p>
              <div className="flex flex-wrap gap-1.5">
                {briefingData.motivos_interes.map((m, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {briefingData.objeciones && briefingData.objeciones.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Objeciones detectadas</p>
              <div className="flex flex-wrap gap-1.5">
                {briefingData.objeciones.map((o, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Email Generator ──────────────────────────────────────────────────────────
function EmailGeneratorSection({
  prospectId,
  prospectNombre: _prospectNombre,
  onUseEmail,
}: {
  prospectId: string;
  prospectNombre: string;
  onUseEmail?: (asunto: string, cuerpoHtml: string) => void;
}) {
  const [objetivo, setObjetivo] = useState('seguimiento');
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/generate-email', { prospect_id: prospectId, objetivo }).then((r) => r.data),
    onSuccess: (res) => {
      setEmailData(res.data ?? res);
      setApiKeyError(false);
    },
    onError: (err) => {
      if (isApiKeyError(err)) setApiKeyError(true);
    },
  });

  const handleCopy = async () => {
    if (!emailData) return;
    const text = `Asunto: ${emailData.asunto}\n\n${emailData.cuerpo_html.replace(/<[^>]+>/g, '')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <HiOutlineMail className="w-4 h-4 text-blue-500" />
        Generar email con IA
      </h3>

      <div className="flex items-center gap-2">
        <select
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          className="input-field text-sm flex-1"
        >
          {OBJETIVOS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="btn-primary text-sm flex items-center gap-1.5 shrink-0"
        >
          {generateMutation.isPending ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generando...
            </>
          ) : (
            <>
              <HiSparkles className="w-4 h-4" />
              Generar
            </>
          )}
        </button>
      </div>

      {apiKeyError && <NoApiKeyMessage />}

      {generateMutation.isError && !apiKeyError && (
        <p className="text-sm text-red-600 text-center">Error al generar el email. Intenta de nuevo.</p>
      )}

      {emailData && (
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Asunto</p>
              <p className="text-sm font-medium text-gray-900">{emailData.asunto}</p>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">Cuerpo</p>
              <div
                className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: emailData.cuerpo_html }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="btn-secondary text-sm flex items-center gap-1.5 flex-1 justify-center"
            >
              {copied ? (
                <>
                  <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                  Copiado
                </>
              ) : (
                <>
                  <HiOutlineClipboard className="w-4 h-4" />
                  Copiar al portapapeles
                </>
              )}
            </button>
            {onUseEmail && (
              <button
                onClick={() => onUseEmail(emailData.asunto, emailData.cuerpo_html)}
                className="btn-primary text-sm flex items-center gap-1.5 flex-1 justify-center"
              >
                <HiOutlineMail className="w-4 h-4" />
                Usar este email
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function ProspectAIPanel({ prospectId, prospectNombre, onUseEmail }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <HiSparkles className="w-5 h-5 text-indigo-500" />
        <h2 className="text-base font-semibold text-gray-900">Asistente IA</h2>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
      </div>

      <ScoreSection prospectId={prospectId} />
      <CallBriefingSection prospectId={prospectId} />
      <EmailGeneratorSection
        prospectId={prospectId}
        prospectNombre={prospectNombre}
        onUseEmail={onUseEmail}
      />
    </div>
  );
}
