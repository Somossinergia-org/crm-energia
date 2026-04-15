import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface PrediccionProspect {
  id: string;
  nombre_negocio: string;
  probabilidad: number;
  ahorro_estimado_eur: number | null;
}

interface PrediccionResponse {
  data: PrediccionProspect[];
}

function ProbBar({ prob }: { prob: number }) {
  const color =
    prob >= 70
      ? 'bg-green-500'
      : prob >= 50
      ? 'bg-amber-500'
      : 'bg-red-500';

  const textColor =
    prob >= 70
      ? 'text-green-700'
      : prob >= 50
      ? 'text-amber-700'
      : 'text-red-700';

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(prob, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-9 text-right ${textColor}`}>
        {prob}%
      </span>
    </div>
  );
}

export default function PrediccionCierres() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<PrediccionResponse>({
    queryKey: ['analytics-prediccion-cierres'],
    queryFn: () => api.get('/analytics/prediccion-cierres').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const prospectos: PrediccionProspect[] = (data?.data ?? [])
    .filter((p) => p.probabilidad >= 50)
    .slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">🔮 Predicción de cierres</h2>
        <p className="text-xs text-gray-500 mt-0.5">Prospectos con mayor probabilidad de cierre</p>
      </div>

      <div className="px-5 py-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : prospectos.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">
              No hay predicciones suficientes. Calcula scores primero.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {prospectos.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/pipeline/${p.id}`)}
                className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">
                      {p.nombre_negocio}
                    </p>
                    <ProbBar prob={p.probabilidad} />
                  </div>
                  {p.ahorro_estimado_eur != null && (
                    <div className="shrink-0 text-right">
                      <span className="text-xs text-gray-400 block">Ahorro</span>
                      <span className="text-sm font-semibold text-green-700">
                        {p.ahorro_estimado_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €/mes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
