import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HiOutlineTrendingUp, HiOutlineMail, HiOutlineUsers, HiOutlineLightBulb } from 'react-icons/hi';

interface SalesMetrics {
  periodo: string;
  emails_enviados: number;
  emails_abiertos: number;
  tasa_apertura: number;
  clicks_totales: number;
  tasa_click: number;
  llamadas_realizadas: number;
  oferta_conversion: number;
  tasa_conversion_oferta: number;
  temperatura_progression: Record<string, number>;
}

interface EffectivityByState {
  estado: string;
  total: number;
  conversiones: number;
  tasa_conversion: number;
  dias_promedio: number;
}

interface CommercialStats {
  user_id: string;
  nombre: string;
  prospectos_asignados: number;
  clientes_cerrados: number;
  tasa_cierre: number;
  emails_abiertos: number;
  llamadas_realizadas: number;
  oferta_enviada: number;
  oferta_aceptada: number;
}

interface EmailPerformance {
  total_enviados: number;
  abiertos: number;
  tasa_apertura: number;
  con_clicks: number;
  tasa_click: number;
  rebotados: number;
  aperturas_promedio: number;
  clicks_promedio: number;
}

interface ResponseRateByTemperature {
  [temperatura: string]: {
    total: number;
    respondieron: number;
    tasa_respuesta: number;
    convertidos: number;
    tasa_conversion: number;
  };
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

export default function SalesAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30');

  // Obtener métricas generales
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['sales-metrics', timeRange],
    queryFn: async () => {
      const response = await api.get(`/sales/analytics/metrics?days=${timeRange}`);
      return response.data.data as SalesMetrics;
    },
  });

  // Obtener efectividad por estado
  const { data: effectivityData, isLoading: effectivityLoading } = useQuery({
    queryKey: ['sales-effectivity'],
    queryFn: async () => {
      const response = await api.get('/sales/analytics/effectiveness-by-state');
      return response.data.data as EffectivityByState[];
    },
  });

  // Obtener estadísticas de comerciales
  const { data: commercialStatsData, isLoading: commercialLoading } = useQuery({
    queryKey: ['sales-commercial-stats'],
    queryFn: async () => {
      const response = await api.get('/sales/analytics/commercial-stats');
      return response.data.data as CommercialStats[];
    },
  });

  // Obtener rendimiento de emails
  const { data: emailPerfData, isLoading: emailLoading } = useQuery({
    queryKey: ['sales-email-performance'],
    queryFn: async () => {
      const response = await api.get('/sales/analytics/email-performance');
      return response.data.data as EmailPerformance;
    },
  });

  // Obtener tasa de respuesta por temperatura
  const { data: responseRateData, isLoading: responseLoading } = useQuery({
    queryKey: ['sales-response-rate'],
    queryFn: async () => {
      const response = await api.get('/sales/analytics/response-rate-by-temperature');
      return response.data.data as ResponseRateByTemperature;
    },
  });

  const isLoading =
    metricsLoading ||
    effectivityLoading ||
    commercialLoading ||
    emailLoading ||
    responseLoading;

  // Preparar datos para gráficos
  const temperaturaData = metricsData
    ? Object.entries(metricsData.temperatura_progression).map(([temp, count]) => ({
        name: temp,
        cantidad: count,
      }))
    : [];

  const responseRateChartData = responseRateData
    ? Object.entries(responseRateData).map(([temp, data]) => ({
        temperatura: temp,
        respuesta: data.tasa_respuesta,
        conversion: data.tasa_conversion,
      }))
    : [];

  const commercialChartData = (commercialStatsData || []).map((c) => ({
    nombre: c.nombre,
    cerrados: c.clientes_cerrados,
    tasa_cierre: c.tasa_cierre,
  }));

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Período de Análisis</h2>
          <div className="flex gap-2">
            {['7', '30', '90', '180'].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === days
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {days === '7' && '7 días'}
                {days === '30' && '30 días'}
                {days === '90' && '90 días'}
                {days === '180' && '6 meses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Cargando análisis...</div>
      ) : (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Emails Enviados</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metricsData?.emails_enviados || 0}
                  </p>
                </div>
                <HiOutlineMail className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Tasa de Apertura</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metricsData?.tasa_apertura || 0}%
                  </p>
                </div>
                <HiOutlineTrendingUp className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Llamadas</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metricsData?.llamadas_realizadas || 0}
                  </p>
                </div>
                <HiOutlineUsers className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Tasa Conversión Oferta</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metricsData?.tasa_conversion_oferta || 0}%
                  </p>
                </div>
                <HiOutlineLightBulb className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Gráficos en dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Progresión de temperatura */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Distribución por Temperatura
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={temperaturaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, cantidad }) => `${name}: ${cantidad}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cantidad"
                  >
                    {temperaturaData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Efectividad por estado */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Conversión por Estado
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={effectivityData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="estado"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasa_conversion" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rendimiento por comercial */}
          {commercialStatsData && commercialStatsData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Desempeño por Comercial
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={commercialChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="cerrados" fill="#10b981" name="Clientes Cerrados" />
                  <Bar yAxisId="right" dataKey="tasa_cierre" fill="#f59e0b" name="% Cierre" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tasa de respuesta por temperatura */}
          {responseRateChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Tasa de Respuesta y Conversión por Temperatura
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={responseRateChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="temperatura" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="respuesta"
                    stroke="#3b82f6"
                    name="% Respuesta"
                  />
                  <Line
                    type="monotone"
                    dataKey="conversion"
                    stroke="#ef4444"
                    name="% Conversión"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Email Performance */}
          {emailPerfData && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Rendimiento de Emails (Últimos 30 días)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-gray-600 text-xs font-medium">Enviados</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {emailPerfData.total_enviados}
                  </p>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <p className="text-gray-600 text-xs font-medium">Abiertos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {emailPerfData.abiertos}
                  </p>
                  <p className="text-xs text-gray-500">({emailPerfData.tasa_apertura}%)</p>
                </div>
                <div className="bg-orange-50 rounded p-3">
                  <p className="text-gray-600 text-xs font-medium">Con Clicks</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {emailPerfData.con_clicks}
                  </p>
                  <p className="text-xs text-gray-500">({emailPerfData.tasa_click}%)</p>
                </div>
                <div className="bg-red-50 rounded p-3">
                  <p className="text-gray-600 text-xs font-medium">Rebotados</p>
                  <p className="text-2xl font-bold text-red-600">{emailPerfData.rebotados}</p>
                </div>
              </div>
            </div>
          )}

          {/* Commercial Stats Table */}
          {commercialStatsData && commercialStatsData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Estadísticas Detalladas por Comercial
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700">
                      Asignados
                    </th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700">
                      Cerrados
                    </th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700">
                      % Cierre
                    </th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700">
                      Emails
                    </th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700">
                      Llamadas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commercialStatsData.map((stat) => (
                    <tr key={stat.user_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{stat.nombre}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {stat.prospectos_asignados}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {stat.clientes_cerrados}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-white text-xs font-semibold ${
                            stat.tasa_cierre >= 30
                              ? 'bg-green-500'
                              : stat.tasa_cierre >= 15
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        >
                          {stat.tasa_cierre}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {stat.emails_abiertos}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {stat.llamadas_realizadas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
