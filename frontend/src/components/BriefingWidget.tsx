import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import ScoreBadge from './ScoreBadge';
import {
  HiOutlineLightningBolt,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineMail,
  HiOutlineCalendar,
  HiOutlineUsers,
} from 'react-icons/hi';

interface BriefingData {
  saludo: string;
  resumen: string;
  stats: {
    pipeline_activo: number;
    visitas_hoy: number;
    emails_pendientes: number;
  };
  alertas: Array<{
    mensaje: string;
    severidad: 'alta' | 'media' | 'baja';
  }>;
  top_prospectos: Array<{
    id: string;
    nombre: string;
    motivo: string;
    score: number | null;
  }>;
}

function AlertIcon({ severidad }: { severidad: string }) {
  if (severidad === 'alta') return <HiOutlineExclamationCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
  if (severidad === 'media') return <HiOutlineInformationCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
  return <HiOutlineCheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
}

function AlertRow({ mensaje, severidad }: { mensaje: string; severidad: string }) {
  const textColor =
    severidad === 'alta' ? 'text-red-700' :
    severidad === 'media' ? 'text-amber-700' :
    'text-green-700';
  const bg =
    severidad === 'alta' ? 'bg-red-50' :
    severidad === 'media' ? 'bg-amber-50' :
    'bg-green-50';

  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${bg}`}>
      <AlertIcon severidad={severidad} />
      <p className={`text-sm ${textColor}`}>{mensaje}</p>
    </div>
  );
}

function SkeletonBriefing() {
  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse">
      <div className="h-20 bg-gradient-to-r from-blue-400 to-indigo-500" />
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-100 rounded-lg" />
          <div className="h-8 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function BriefingWidget() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery<{ data: BriefingData }>({
    queryKey: ['ai-briefing'],
    queryFn: () => api.get('/ai/briefing').then((r) => r.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <SkeletonBriefing />;

  // Graceful error handling
  if (isError) {
    const msg = (error as any)?.response?.data?.error ?? '';
    const isApiKeyMissing =
      msg.toLowerCase().includes('api key') ||
      msg.toLowerCase().includes('gemini') ||
      (error as any)?.response?.status === 503;

    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 flex items-start gap-3">
        <HiOutlineLightningBolt className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-700">Asistente IA no disponible</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isApiKeyMissing
              ? 'Configura tu API key de Gemini en Ajustes para activar la IA'
              : 'No se pudo cargar el briefing diario. Intenta de nuevo más tarde.'}
          </p>
        </div>
      </div>
    );
  }

  const briefing = data?.data;
  if (!briefing) return null;

  const { stats, alertas = [], top_prospectos = [] } = briefing;

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-blue-100">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-start gap-3">
        <HiOutlineLightningBolt className="w-6 h-6 text-yellow-300 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h2 className="text-white font-semibold text-base leading-tight">
            {briefing.saludo || `Buenos días, ${user?.nombre}`} ⚡
          </h2>
          {briefing.resumen && (
            <p className="text-blue-100 text-sm mt-0.5 leading-snug">{briefing.resumen}</p>
          )}
        </div>
      </div>

      <div className="bg-white px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg py-3 px-2 gap-1">
            <HiOutlineUsers className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-blue-700">{stats?.pipeline_activo ?? '-'}</span>
            <span className="text-xs text-blue-600 text-center leading-tight">Pipeline activo</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-purple-50 rounded-lg py-3 px-2 gap-1">
            <HiOutlineCalendar className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold text-purple-700">{stats?.visitas_hoy ?? '-'}</span>
            <span className="text-xs text-purple-600 text-center leading-tight">Visitas hoy</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-amber-50 rounded-lg py-3 px-2 gap-1">
            <HiOutlineMail className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-amber-700">{stats?.emails_pendientes ?? '-'}</span>
            <span className="text-xs text-amber-600 text-center leading-tight">Emails pendientes</span>
          </div>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alertas</p>
            <div className="space-y-1.5">
              {alertas.map((alerta, i) => (
                <AlertRow key={i} mensaje={alerta.mensaje} severidad={alerta.severidad} />
              ))}
            </div>
          </div>
        )}

        {/* Top prospectos */}
        {top_prospectos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top prospectos hoy</p>
            <div className="space-y-1.5">
              {top_prospectos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/pipeline/${p.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">{p.nombre}</p>
                    {p.motivo && (
                      <p className="text-xs text-gray-500 truncate">{p.motivo}</p>
                    )}
                  </div>
                  <div className="ml-3 shrink-0">
                    <ScoreBadge score={p.score} prospectId={p.id} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
