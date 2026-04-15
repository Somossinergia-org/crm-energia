import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ScoreBadge from './ScoreBadge';

interface RadarProspect {
  id: string;
  nombre_negocio: string;
  municipio: string;
  temperatura: 'caliente' | 'templado';
  dias_sin_contacto: number;
  ahorro_estimado_eur: number | null;
  score: number | null;
}

interface RadarResponse {
  data: RadarProspect[];
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="h-5 w-16 bg-gray-200 rounded-full" />
      <div className="h-5 w-5 bg-gray-200 rounded" />
    </div>
  );
}

function TempBadge({ temperatura }: { temperatura: 'caliente' | 'templado' }) {
  if (temperatura === 'caliente') {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        🔥 Caliente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      🌡️ Templado
    </span>
  );
}

export default function RadarOportunidades() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<RadarResponse>({
    queryKey: ['analytics-radar'],
    queryFn: () => api.get('/analytics/radar').then((r) => r.data),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  const prospectos: RadarProspect[] = (data?.data ?? []).slice(0, 8);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">🎯 Radar de oportunidades</h2>
        <p className="text-xs text-gray-500 mt-0.5">Prospectos de alto valor sin contactar</p>
      </div>

      <div className="px-5 py-2">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : prospectos.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">
              ¡Todo al día! No hay oportunidades urgentes pendientes 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {prospectos.map((p) => {
              const avatarColor =
                p.temperatura === 'caliente'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700';
              const diasColor =
                p.dias_sin_contacto > 7
                  ? 'text-red-600'
                  : p.dias_sin_contacto >= 5
                  ? 'text-amber-600'
                  : 'text-gray-500';

              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-3 group"
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor}`}
                  >
                    {p.nombre_negocio.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.nombre_negocio}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{p.municipio}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <TempBadge temperatura={p.temperatura} />
                    <span className={`text-xs font-medium ${diasColor}`}>
                      Hace {p.dias_sin_contacto}d
                    </span>
                    {p.ahorro_estimado_eur != null && (
                      <span className="text-xs font-semibold text-green-700">
                        {p.ahorro_estimado_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €
                      </span>
                    )}
                    <ScoreBadge score={p.score} prospectId={p.id} size="sm" />
                  </div>

                  {/* Navigate button */}
                  <button
                    onClick={() => navigate(`/pipeline/${p.id}`)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Ver prospecto"
                  >
                    →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
