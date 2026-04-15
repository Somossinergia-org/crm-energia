import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
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
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Prospect {
  id: string;
  nombre_negocio: string;
  estado: string;
  municipio: string;
  zona_id: string | null;
  ahorro_estimado_eur: number | null;
  gasto_mensual_estimado_eur: number | null;
  created_at: string;
  fecha_conversion: string | null;
  asignado_nombre?: string;
  asignado_a?: string | null;
}

interface Servicio {
  id: string;
  servicio: string;
  estado: string;
  gasto_actual_eur: number | null;
  ahorro_estimado_eur: number | null;
  fecha_contratacion: string | null;
}

interface Visit {
  id: string;
  fecha_inicio: string;
  estado: string;
  resultado: string | null;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PIPELINE_STATES = ['pendiente', 'llamado', 'contactado', 'interesado', 'oferta_enviada', 'negociacion', 'volver_llamar'];
const CLOSED_WIN = ['contrato_firmado'];
const CLOSED_LOST = ['rechazado', 'perdido'];

const FUNNEL_ORDER = [
  { key: 'pendiente',        label: 'Pendiente',       color: '#6b7280' },
  { key: 'llamado',          label: 'Llamado',         color: '#3b82f6' },
  { key: 'contactado',       label: 'Contactado',      color: '#06b6d4' },
  { key: 'interesado',       label: 'Interesado',      color: '#eab308' },
  { key: 'oferta_enviada',   label: 'Oferta enviada',  color: '#f97316' },
  { key: 'negociacion',      label: 'Negociacion',     color: '#a855f7' },
  { key: 'volver_llamar',    label: 'Volver a llamar', color: '#f59e0b' },
  { key: 'contrato_firmado', label: 'Contrato',        color: '#22c55e' },
  { key: 'rechazado',        label: 'Rechazado',       color: '#ef4444' },
  { key: 'perdido',          label: 'Perdido',         color: '#94a3b8' },
];

const SERVICIO_COLORS: Record<string, string> = {
  energia:           '#f59e0b',
  telecomunicaciones:'#3b82f6',
  alarmas:           '#ef4444',
  seguros:           '#22c55e',
  agentes_ia:        '#a855f7',
  web:               '#06b6d4',
  crm:               '#6366f1',
  aplicaciones:      '#ec4899',
};

const SERVICIO_LABELS: Record<string, string> = {
  energia:           'Energia',
  telecomunicaciones:'Telecom',
  alarmas:           'Alarmas',
  seguros:           'Seguros',
  agentes_ia:        'Agentes IA',
  web:               'Web',
  crm:               'CRM',
  aplicaciones:      'Apps',
};

// ─── Demo data (se usa si la API no devuelve datos) ───────────────────────────

function buildDemoData() {
  const now = new Date();
  const prospects: Prospect[] = [];
  const estados = ['pendiente', 'llamado', 'contactado', 'interesado', 'oferta_enviada', 'negociacion', 'contrato_firmado', 'rechazado', 'perdido', 'volver_llamar'];
  const municipios = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Malaga', 'Zaragoza', 'Bilbao', 'Alicante'];
  const nombres = ['Clinica Salud Plus', 'Bar El Rincon', 'Taller Mecanico Norte', 'Gym Power', 'Farmacia Central', 'Hotel Sol', 'Restaurante La Plaza', 'Academia Oxford', 'Peluqueria Style', 'Dental ProSonrisa', 'Optica Vision', 'Supermercado Fresco', 'Ferreteria Gil', 'Gestoria Perez', 'Lavanderia Express'];
  const agentes = ['Ana Garcia', 'Carlos Lopez', 'Maria Ruiz', 'David Martinez'];

  for (let i = 0; i < 87; i++) {
    const estadoIdx = Math.floor(Math.random() * estados.length);
    const estado = estados[estadoIdx];
    const daysAgo = Math.floor(Math.random() * 180);
    const created = new Date(now.getTime() - daysAgo * 86400000);
    const esFirmado = estado === 'contrato_firmado';
    prospects.push({
      id: String(i),
      nombre_negocio: nombres[i % nombres.length] + ' ' + i,
      estado,
      municipio: municipios[Math.floor(Math.random() * municipios.length)],
      zona_id: null,
      ahorro_estimado_eur: esFirmado ? 80 + Math.random() * 400 : Math.random() > 0.5 ? 60 + Math.random() * 300 : null,
      gasto_mensual_estimado_eur: 200 + Math.random() * 800,
      created_at: created.toISOString(),
      fecha_conversion: esFirmado ? new Date(created.getTime() + Math.random() * 30 * 86400000).toISOString() : null,
      asignado_a: String(Math.floor(Math.random() * agentes.length)),
      asignado_nombre: agentes[Math.floor(Math.random() * agentes.length)],
    });
  }

  const servicioTipos = ['energia', 'telecomunicaciones', 'alarmas', 'seguros', 'agentes_ia', 'web', 'crm', 'aplicaciones'];
  const servicios: Servicio[] = Array.from({ length: 60 }, (_, i) => ({
    id: String(i),
    servicio: servicioTipos[Math.floor(Math.random() * servicioTipos.length)],
    estado: Math.random() > 0.3 ? 'contratado' : 'interesado',
    gasto_actual_eur: 200 + Math.random() * 600,
    ahorro_estimado_eur: 40 + Math.random() * 200,
    fecha_contratacion: Math.random() > 0.4 ? new Date(now.getTime() - Math.random() * 90 * 86400000).toISOString() : null,
  }));

  const visits: Visit[] = Array.from({ length: 48 }, (_, i) => ({
    id: String(i),
    fecha_inicio: new Date(now.getTime() - Math.floor(Math.random() * 180) * 86400000).toISOString(),
    estado: 'realizada',
    resultado: Math.random() > 0.4 ? 'positivo' : 'pendiente',
  }));

  return { prospects, servicios, visits };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLast6Months(): { key: string; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('es-ES', { month: 'short', year: '2-digit' }),
    });
  }
  return result;
}

function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />;
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton style={{ height }} className="w-full" />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  // ── Carga de datos ──
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [prosRes, srvRes, visRes] = await Promise.allSettled([
          api.get('/prospects?limit=500'),
          api.get('/servicios/all?limit=500'),
          api.get('/visits?limit=500'),
        ]);

        const pros: Prospect[] = prosRes.status === 'fulfilled' ? (prosRes.value.data?.data ?? []) : [];
        const srv: Servicio[] = srvRes.status === 'fulfilled' ? (srvRes.value.data?.data ?? []) : [];
        const vis: Visit[] = visRes.status === 'fulfilled' ? (visRes.value.data?.data ?? []) : [];

        if (pros.length === 0 && srv.length === 0 && vis.length === 0) {
          const demo = buildDemoData();
          setProspects(demo.prospects);
          setServicios(demo.servicios);
          setVisits(demo.visits);
          setIsDemo(true);
        } else {
          setProspects(pros);
          setServicios(srv);
          setVisits(vis);
          setIsDemo(false);
        }
      } catch {
        const demo = buildDemoData();
        setProspects(demo.prospects);
        setServicios(demo.servicios);
        setVisits(demo.visits);
        setIsDemo(true);
        setError('No se pudo conectar con el servidor. Mostrando datos de demo.');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const activePipeline = prospects.filter(p => PIPELINE_STATES.includes(p.estado)).length;

    const ganados = prospects.filter(p =>
      CLOSED_WIN.includes(p.estado) && p.fecha_conversion && isThisMonth(p.fecha_conversion)
    ).length;

    const total = prospects.length;
    const closed = prospects.filter(p => [...CLOSED_WIN, ...CLOSED_LOST].includes(p.estado)).length;
    const won = prospects.filter(p => CLOSED_WIN.includes(p.estado)).length;
    const tasa = closed > 0 ? Math.round((won / closed) * 100) : 0;

    const ahorroTotal = prospects
      .filter(p => CLOSED_WIN.includes(p.estado) && p.ahorro_estimado_eur)
      .reduce((s, p) => s + (p.ahorro_estimado_eur ?? 0), 0);

    return { activePipeline, ganados, tasa, ahorroTotal, total, won };
  }, [prospects]);

  // ── Embudo de ventas ──
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of prospects) counts[p.estado] = (counts[p.estado] ?? 0) + 1;
    return FUNNEL_ORDER.filter(f => (counts[f.key] ?? 0) > 0).map(f => ({
      ...f,
      total: counts[f.key] ?? 0,
    }));
  }, [prospects]);

  // ── Actividad mensual ──
  const months = useMemo(() => getLast6Months(), []);

  const actividadData = useMemo(() => {
    const visitsByMonth: Record<string, number> = {};
    const contactosByMonth: Record<string, number> = {};

    for (const v of visits) {
      const k = monthKey(v.fecha_inicio);
      visitsByMonth[k] = (visitsByMonth[k] ?? 0) + 1;
    }
    for (const p of prospects) {
      if (p.estado !== 'pendiente') {
        const k = monthKey(p.created_at);
        contactosByMonth[k] = (contactosByMonth[k] ?? 0) + 1;
      }
    }

    return months.map(m => ({
      label: m.label,
      visitas: visitsByMonth[m.key] ?? 0,
      contactos: contactosByMonth[m.key] ?? 0,
    }));
  }, [prospects, visits, months]);

  // ── Top municipios ──
  const topMunicipios = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of prospects) {
      if (p.municipio) counts[p.municipio] = (counts[p.municipio] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([municipio, total]) => ({ municipio, total }));
  }, [prospects]);

  // ── Distribución servicios ──
  const serviciosData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of servicios) {
      if (s.servicio) counts[s.servicio] = (counts[s.servicio] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([servicio, value]) => ({
        servicio,
        label: SERVICIO_LABELS[servicio] ?? servicio,
        value,
        color: SERVICIO_COLORS[servicio] ?? '#94a3b8',
      }));
  }, [servicios]);

  // ── Rendimiento equipo ──
  const equipoData = useMemo(() => {
    const map: Record<string, { nombre: string; total: number; ganados: number; pipeline: number }> = {};
    for (const p of prospects) {
      if (!p.asignado_a || !p.asignado_nombre) continue;
      if (!map[p.asignado_a]) {
        map[p.asignado_a] = { nombre: p.asignado_nombre, total: 0, ganados: 0, pipeline: 0 };
      }
      map[p.asignado_a].total++;
      if (CLOSED_WIN.includes(p.estado)) map[p.asignado_a].ganados++;
      if (PIPELINE_STATES.includes(p.estado)) map[p.asignado_a].pipeline++;
    }
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [prospects]);

  const maxMunicipio = topMunicipios[0]?.total ?? 1;
  const maxEquipo = equipoData[0]?.total ?? 1;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Analisis de rendimiento comercial
              {isDemo && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  Datos de demo
                </span>
              )}
            </p>
          </div>
          {!loading && (
            <span className="text-sm text-gray-400">
              {kpis.total.toLocaleString('es-ES')} prospectos totales
            </span>
          )}
        </div>

        {/* Error no bloqueante */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* ── KPIs ── */}
        {loading ? <KPISkeleton /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon="📊"
              label="Pipeline activo"
              value={fmt(kpis.activePipeline)}
              sub={`${kpis.total} prospectos en total`}
              color="blue"
            />
            <KPICard
              icon="🏆"
              label="Ganados este mes"
              value={fmt(kpis.ganados)}
              sub="contratos firmados"
              color="green"
            />
            <KPICard
              icon="📈"
              label="Tasa de conversion"
              value={`${kpis.tasa}%`}
              sub={`${kpis.won} ganados / ${prospects.filter(p => [...CLOSED_WIN, ...CLOSED_LOST].includes(p.estado)).length} cerrados`}
              color="purple"
            />
            <KPICard
              icon="💰"
              label="Ahorro total generado"
              value={`${fmt(kpis.ahorroTotal)} €`}
              sub="ahorro mensual acumulado"
              color="amber"
            />
          </div>
        )}

        {/* ── Fila 2: Embudo + Actividad mensual ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Embudo de ventas */}
          {loading ? <ChartSkeleton height={280} /> : (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Embudo de ventas</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 12, fill: '#374151' }} width={110} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: number) => [val, 'Prospectos']}
                    contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {funnelData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Actividad mensual */}
          {loading ? <ChartSkeleton height={280} /> : (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Actividad mensual (6 meses)</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={actividadData} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="visitas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Visitas" />
                  <Line type="monotone" dataKey="contactos" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Nuevos contactos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Fila 3: Top municipios + Servicios ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top municipios */}
          {loading ? <ChartSkeleton height={220} /> : (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Top 5 municipios</h2>
              {topMunicipios.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Sin datos de municipios</p>
              ) : (
                <div className="space-y-3">
                  {topMunicipios.map((row, i) => (
                    <div key={row.municipio} className="flex items-center gap-3">
                      <span className="w-5 text-sm font-semibold text-gray-400">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">{row.municipio}</span>
                          <span className="text-sm text-gray-500 ml-2">{row.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${(row.total / maxMunicipio) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Distribución por tipo de servicio */}
          {loading ? <ChartSkeleton height={220} /> : (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Distribucion por servicio</h2>
              {serviciosData.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Sin datos de servicios</p>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={serviciosData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {serviciosData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number, name: string) => [val, name]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {serviciosData.map(s => (
                      <div key={s.servicio} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-sm text-gray-700 flex-1 truncate">{s.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Rendimiento del equipo ── */}
        {!loading && equipoData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Rendimiento del equipo</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Agente</th>
                    <th className="text-center py-2 px-4 text-gray-500 font-medium">Total</th>
                    <th className="text-center py-2 px-4 text-gray-500 font-medium">Ganados</th>
                    <th className="text-center py-2 px-4 text-gray-500 font-medium">Pipeline</th>
                    <th className="text-center py-2 px-4 text-gray-500 font-medium">Conv.%</th>
                    <th className="py-2 pl-4 text-gray-500 font-medium">Actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {equipoData.map(ag => {
                    const tasa = ag.total > 0 ? Math.round((ag.ganados / ag.total) * 100) : 0;
                    return (
                      <tr key={ag.nombre} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {ag.nombre.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 truncate max-w-[120px]">{ag.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700 font-medium">{ag.total}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {ag.ganados}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{ag.pipeline}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-semibold ${tasa >= 50 ? 'text-green-700' : tasa >= 25 ? 'text-amber-700' : 'text-red-600'}`}>
                            {tasa}%
                          </span>
                        </td>
                        <td className="py-3 pl-4 w-32">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${(ag.total / maxEquipo) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loading && <ChartSkeleton height={160} />}

      </div>
    </div>
  );
}

// ─── Sub-componente KPICard ────────────────────────────────────────────────────

type KPIColor = 'blue' | 'green' | 'purple' | 'amber';

const KPI_COLOR_MAP: Record<KPIColor, { bg: string; text: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'text-blue-500' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'text-green-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'text-amber-500' },
};

function KPICard({ icon, label, value, sub, color }: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: KPIColor;
}) {
  const c = KPI_COLOR_MAP[color];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <span className={`text-xl ${c.icon}`}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  );
}
