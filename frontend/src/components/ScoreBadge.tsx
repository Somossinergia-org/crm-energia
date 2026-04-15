import { useState } from 'react';
import api from '../services/api';

interface ScoreBadgeProps {
  score: number | null;
  prospectId: string;
  size?: 'sm' | 'md';
  onScored?: (score: number) => void;
}

function getScoreConfig(score: number): { bg: string; text: string; label: string; fire: boolean } {
  if (score < 30) return { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Sin score', fire: false };
  if (score < 50) return { bg: 'bg-red-100', text: 'text-red-700', label: 'Frio', fire: false };
  if (score < 70) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Templado', fire: false };
  if (score < 85) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Caliente', fire: false };
  return { bg: 'bg-green-200', text: 'text-green-800', label: 'Muy caliente', fire: true };
}

export default function ScoreBadge({ score, prospectId, size = 'md', onScored }: ScoreBadgeProps) {
  const [loading, setLoading] = useState(false);
  const [localScore, setLocalScore] = useState<number | null>(score);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/ai/prospects/${prospectId}/score`);
      const newScore = res.data?.data?.score ?? res.data?.score ?? null;
      if (newScore !== null) {
        setLocalScore(newScore);
        onScored?.(newScore);
      }
    } catch {
      // fail silently — badge just stays null
    } finally {
      setLoading(false);
    }
  };

  if (localScore === null) {
    if (loading) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
          <span className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
          Calculando...
        </span>
      );
    }
    return (
      <button
        onClick={handleCalculate}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs hover:bg-gray-200 transition-colors"
      >
        Calcular
      </button>
    );
  }

  const cfg = getScoreConfig(localScore);

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
        {cfg.fire && <span>🔥</span>}
        {localScore}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.fire && <span>🔥</span>}
      <span>{localScore}</span>
      <span className="font-normal opacity-75">· {cfg.label}</span>
    </span>
  );
}
