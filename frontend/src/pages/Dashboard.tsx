import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import BriefingWidget from '../components/BriefingWidget';
import RadarOportunidades from '../components/RadarOportunidades';
import PrediccionCierres from '../components/PrediccionCierres';
import {
  HiOutlineUsers,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineEye,
  HiOutlineChat,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { prospectsApi } from '../services/prospects.service';
import { contactsApi, visitsApi } from '../services/contacts.service';
import { serviciosApi, SERVICIOS_CONFIG } from '../services/servicios.service';
import { ESTADO_CONFIG, ProspectState } from '../types/prospect';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ayer';
  if (diffD < 7) return `Hace ${diffD} dias`;
  if (diffD < 30) return `Hace ${Math.floor(diffD / 7)} sem`;
  return `Hace ${Math.floor(diffD / 30)} meses`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const TIPO_ICONS: Record<string, typeof HiOutlinePhone> = {
  llamada: HiOutlinePhone,
  email: HiOutlineMail,
  visita: HiOutlineLocationMarker,
  whatsapp: HiOutlineChat,
  nota: HiOutlineDocumentText,
};

// Map ESTADO_CONFIG Tailwind classes to hex colors for Recharts
const ESTADO_HEX_COLORS: Record<string, string> = {
  pendiente: '#374151',
  llamado: '#1d4ed8',
  contactado: '#0e7490',
  interesado: '#a16207',
  oferta_enviada: '#c2410c',
  negociacion: '#7e22ce',
  contrato_firmado: '#15803d',
  rechazado: '#b91c1c',
  volver_llamar: '#b45309',
  perdido: '#334155',
};

// Pie chart colors for services
const SERVICIO_PIE_COLORS: Record<string, string> = {
  energia: '#f59e0b',
  telecomunicaciones: '#3b82f6',
  alarmas: '#ef4444',
  seguros: '#22c55e',
  agentes_ia: '#a855f7',
  web: '#06b6d4',
  crm: '#6366f1',
  aplicaciones: '#ec4899',
};

// Custom label renderer for the bar chart
const renderBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value) return null;
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      fill="#374151"
      fontSize={12}
      fontWeight={600}
      dominantBaseline="central"
    >
      {value}
    </text>
  );
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['prospect-stats'],
    queryFn: () => prospectsApi.getStats(),
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['contacts-recent'],
    queryFn: () => contactsApi.getRecent(10),
  });

  const { data: todayContactsData, isLoading: todayContactsLoading } = useQuery({
    queryKey: ['contacts-today'],
    queryFn: () => contactsApi.getToday(),
  });

  const { data: todayVisitsData, isLoading: todayVisitsLoading } = useQuery({
    queryKey: ['visits-today'],
    queryFn: () => visitsApi.getToday(),
  });

  const { data: serviciosStatsData, isLoading: serviciosStatsLoading } = useQuery({
    queryKey: ['servicios-stats'],
    queryFn: () => serviciosApi.getStats(),
  });

  const stats = statsData?.data;
  const recentContacts = recentData?.data ?? [];
  const todayContacts = todayContactsData?.data;
  const todayVisits = todayVisitsData?.data ?? [];
  const serviciosStats = serviciosStatsData?.data ?? [];

  const byStatus: { estado: string; count: number }[] = stats?.byStatus || [];

  const contractCount = byStatus.find(
    (s: { estado: string; count: number }) => s.estado === 'contrato_firmado'
  )?.count ?? 0;

  const pipelineCount = stats
    ? Number(stats.total) - contractCount - (byStatus.find((s: { estado: string; count: number }) => s.estado === 'rechazado')?.count ?? 0) - (byStatus.find((s: { estado: string; count: number }) => s.estado === 'perdido')?.count ?? 0)
    : 0;

  // Prepare bar chart data
  const barChartData = byStatus.map((stage: { estado: string; count: number }) => {
    const config = ESTADO_CONFIG[stage.estado as ProspectState];
    return {
      name: config?.label ?? stage.estado,
      count: Number(stage.count),
      fill: ESTADO_HEX_COLORS[stage.estado] ?? '#6b7280',
    };
  });

  // Prepare pie chart data
  const pieChartData = serviciosStats
    .filter((s: { servicio: string; total: number }) => Number(s.total) > 0)
    .map((s: { servicio: string; total: number; contratados: number }) => {
      const config = SERVICIOS_CONFIG.find((c) => c.id === s.servicio);
      return {
        name: config?.label ?? s.servicio,
        value: Number(s.total),
        contratados: Number(s.contratados),
        color: SERVICIO_PIE_COLORS[s.servicio] ?? '#6b7280',
      };
    });

  const kpis = [
    {
      name: 'Pipeline activo',
      value: stats ? pipelineCount : '-',
      icon: HiOutlineUsers,
      color: 'bg-blue-500',
      loading: statsLoading,
      href: '/pipeline',
    },
    {
      name: 'Clientes',
      value: contractCount,
      icon: HiOutlineDocumentText,
      color: 'bg-green-500',
      loading: statsLoading,
      href: '/clientes',
    },
    {
      name: 'Actividades hoy',
      value: todayContacts?.total ?? '-',
      icon: HiOutlinePhone,
      color: 'bg-amber-500',
      loading: todayContactsLoading,
    },
    {
      name: 'Visitas hoy',
      value: todayVisits.length,
      icon: HiOutlineCalendar,
      color: 'bg-purple-500',
      loading: todayVisitsLoading,
      href: '/agenda',
    },
  ];

  // Custom tooltip for bar chart
  const BarTooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.count} prospectos</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Total: {data.value}</p>
          <p className="text-sm text-green-600">Contratados: {data.contratados}</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend for pie chart
  const PieLegendContent = ({ payload }: any) => {
    if (!payload) return null;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {payload.map((entry: any, index: number) => (
          <li key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  const handleExportExcel = () => {
    window.open('/api/analytics/export/excel', '_blank');
  };

  const handleExportPDF = () => {
    window.open('/api/analytics/export/pdf', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Saludo + exportaciones */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Buenos dias, {user?.nombre}
          </h1>
          <p className="text-gray-500 mt-1">
            Aqui tienes el resumen de hoy
          </p>
        </div>
        <div className="flex gap-2 shrink-0 mt-1">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* Briefing IA */}
      <div className="mb-6">
        <BriefingWidget />
      </div>

      {/* Radar + Predicción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RadarOportunidades />
        <PrediccionCierres />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          return (
            <div
              key={kpi.name}
              className={`card flex items-center gap-4 ${kpi.href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
              onClick={() => kpi.href && navigate(kpi.href)}
            >
              <div className={`${kpi.color} p-3 rounded-lg`}>
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                {kpi.loading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                )}
                <p className="text-sm text-gray-500">{kpi.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts: Bar + Pie side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embudo de ventas - Recharts BarChart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineTrendingUp className="w-5 h-5 text-primary-600" />
            Embudo de ventas
          </h2>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : barChartData.length ? (
            <ResponsiveContainer width="100%" height={barChartData.length * 44 + 20}>
              <BarChart
                data={barChartData}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 13, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  barSize={28}
                  label={renderBarLabel}
                >
                  {barChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Sin datos de prospectos</p>
          )}
        </div>

        {/* Servicios por tipo - Recharts PieChart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />
            Servicios por tipo
          </h2>
          {serviciosStatsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : pieChartData.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {pieChartData.map((entry: { color: string }, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
                <Legend content={<PieLegendContent />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Sin datos de servicios</p>
          )}
        </div>
      </div>

      {/* Actividad reciente + Visitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad reciente */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineClock className="w-5 h-5 text-primary-600" />
            Actividad reciente
          </h2>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : recentContacts.length ? (
            <div className="space-y-1">
              {recentContacts.map((item) => {
                const Icon = TIPO_ICONS[item.tipo] ?? HiOutlineEye;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.prospect_id ? (
                        <Link
                          to={`/pipeline/${item.prospect_id}`}
                          className="text-sm font-medium text-primary-700 hover:underline"
                        >
                          {item.prospect_nombre ?? 'Prospecto'}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">
                          {item.prospect_nombre ?? 'Prospecto'}
                        </p>
                      )}
                      {item.nota && (
                        <p className="text-xs text-gray-500 truncate">{item.nota}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {item.resultado && (
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                          {item.resultado}
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Sin actividad reciente</p>
          )}
        </div>

        {/* Visitas de hoy */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineCalendar className="w-5 h-5 text-primary-600" />
              Visitas de hoy
            </h2>
            <button
              onClick={() => navigate('/agenda')}
              className="btn-secondary text-sm"
            >
              Ver agenda
            </button>
          </div>
          {todayVisitsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : todayVisits.length ? (
            <div className="grid grid-cols-1 gap-3">
              {todayVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="border border-gray-200 rounded-lg p-3 flex items-start gap-3"
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: visit.color || '#6366f1' }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{visit.titulo}</p>
                    <p className="text-xs text-gray-500">
                      {formatTime(visit.fecha_inicio)} - {formatTime(visit.fecha_fin)}
                    </p>
                    {visit.prospect_nombre && (
                      <p className="text-xs text-primary-600 truncate mt-0.5">
                        {visit.prospect_nombre}
                      </p>
                    )}
                    {visit.direccion && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{visit.direccion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No hay visitas programadas para hoy</p>
          )}
        </div>
      </div>
    </div>
  );
}
