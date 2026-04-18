import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface WeeklyReportData {
  fecha: string;
  informe: string;
  stats?: {
    nuevos_prospectos?: number;
    clientes_ganados?: number;
    ahorro_nuevo_eur?: number;
  };
}

interface WeeklyReportResponse {
  data: WeeklyReportData;
}

/** Simple markdown → JSX renderer (no external libraries) */
function renderMarkdown(text: string): JSX.Element[] {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let key = 0;

  for (const line of lines) {
    if (!line.trim()) {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    // ## Heading
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="text-sm font-bold text-gray-900 mt-4 mb-1">
          {line.replace(/^## /, '')}
        </h3>
      );
      continue;
    }

    // # Heading
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={key++} className="text-base font-bold text-gray-900 mt-4 mb-1">
          {line.replace(/^# /, '')}
        </h2>
      );
      continue;
    }

    // Render inline **bold**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });

    elements.push(
      <p key={key++} className="text-sm text-gray-700 leading-relaxed">
        {rendered}
      </p>
    );
  }

  return elements;
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 0 });
}

export default function InformeWidget() {
  const { data, isLoading, refetch, isFetching } = useQuery<WeeklyReportResponse>({
    queryKey: ['analytics-weekly-report'],
    queryFn: () => api.get('/analytics/weekly-report').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const informe = data?.data;

  const formattedDate = informe?.fecha
    ? new Date(informe.fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">📋 Informe semanal</h2>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{formattedDate}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {isFetching ? (
            <span className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full" />
          ) : (
            <span>↻</span>
          )}
          Regenerar
        </button>
      </div>

      {/* Stats rápidos */}
      {informe?.stats && (
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {informe.stats.nuevos_prospectos != null && (
            <div className="px-4 py-3 text-center">
              <p className="text-lg font-bold text-blue-700">{fmt(informe.stats.nuevos_prospectos)}</p>
              <p className="text-xs text-gray-500">Nuevos prospectos</p>
            </div>
          )}
          {informe.stats.clientes_ganados != null && (
            <div className="px-4 py-3 text-center">
              <p className="text-lg font-bold text-green-700">{fmt(informe.stats.clientes_ganados)}</p>
              <p className="text-xs text-gray-500">Clientes ganados</p>
            </div>
          )}
          {informe.stats.ahorro_nuevo_eur != null && (
            <div className="px-4 py-3 text-center">
              <p className="text-lg font-bold text-amber-700">{fmt(informe.stats.ahorro_nuevo_eur)} €</p>
              <p className="text-xs text-gray-500">Ahorro nuevo</p>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Generando informe con IA...</p>
          </div>
        ) : !informe?.informe ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No hay informe disponible. Pulsa &quot;Regenerar&quot;.</p>
          </div>
        ) : (
          <div className="prose-sm max-w-none">
            {renderMarkdown(informe.informe)}
          </div>
        )}
      </div>
    </div>
  );
}
