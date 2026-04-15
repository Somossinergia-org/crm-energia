import React from 'react';

interface TrendProps {
  value: number;
  label: string;
}

interface KPICardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: TrendProps;
}

const COLOR_MAP: Record<KPICardProps['color'], { bg: string; iconBg: string; iconText: string; trendPos: string; trendNeg: string }> = {
  blue:   { bg: 'bg-blue-50',   iconBg: 'bg-blue-500',   iconText: 'text-white', trendPos: 'bg-blue-100 text-blue-700',   trendNeg: 'bg-red-100 text-red-700' },
  green:  { bg: 'bg-green-50',  iconBg: 'bg-green-500',  iconText: 'text-white', trendPos: 'bg-green-100 text-green-700', trendNeg: 'bg-red-100 text-red-700' },
  purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-500', iconText: 'text-white', trendPos: 'bg-purple-100 text-purple-700', trendNeg: 'bg-red-100 text-red-700' },
  orange: { bg: 'bg-orange-50', iconBg: 'bg-orange-500', iconText: 'text-white', trendPos: 'bg-orange-100 text-orange-700', trendNeg: 'bg-red-100 text-red-700' },
  red:    { bg: 'bg-red-50',    iconBg: 'bg-red-500',    iconText: 'text-white', trendPos: 'bg-green-100 text-green-700', trendNeg: 'bg-red-100 text-red-700' },
};

export default function KPICard({ label, value, subvalue, icon: Icon, color, trend }: KPICardProps) {
  const c = COLOR_MAP[color];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className={`${c.iconBg} p-3 rounded-lg shrink-0`}>
        <Icon className={`w-6 h-6 ${c.iconText}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-900 leading-tight truncate">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            {subvalue && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{subvalue}</p>
            )}
          </div>
          {trend && (
            <span
              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                trend.value >= 0 ? c.trendPos : c.trendNeg
              }`}
            >
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
