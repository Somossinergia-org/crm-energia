import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { HiOutlineExclamation, HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker, HiOutlineChat, HiOutlineRefresh } from 'react-icons/hi';

interface FollowUpAlert {
  prospect_id: string;
  nombre_negocio: string;
  temperatura: string;
  estado: string;
  dias_sin_contacto: number;
  razon_alerta: string;
  urgencia: 'critica' | 'alta' | 'media' | 'baja';
  accion_recomendada: string;
  fecha_proxima_accion?: string;
}

interface FollowUpStats {
  alertas_totales: number;
  acciones_completadas_hoy: number;
  ofertas_sin_respuesta: number;
  tasa_completion: number;
}

const urgenciaColors = {
  critica: 'bg-red-100 border-red-300 text-red-800',
  alta: 'bg-orange-100 border-orange-300 text-orange-800',
  media: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  baja: 'bg-blue-100 border-blue-300 text-blue-800',
};

const temperaturaColors = {
  caliente: 'bg-red-200 text-red-800',
  tibio: 'bg-orange-200 text-orange-800',
  templado: 'bg-orange-200 text-orange-800',
  frio: 'bg-blue-200 text-blue-800',
  desconocida: 'bg-gray-200 text-gray-800',
};

const tipoAccionIcons = {
  llamada: <HiOutlinePhone className="w-4 h-4" />,
  email_enviado: <HiOutlineMail className="w-4 h-4" />,
  visita_presencial: <HiOutlineLocationMarker className="w-4 h-4" />,
  whatsapp: <HiOutlineChat className="w-4 h-4" />,
};

export default function FollowUpAlerts() {
  const [filtroUrgencia, setFiltroUrgencia] = useState<string | null>(null);
  const [filtroTemperatura, setFiltroTemperatura] = useState<string | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Obtener alertas de follow-up
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['followup-alerts'],
    queryFn: async () => {
      const response = await api.get('/sales/followup/alerts');
      return response.data.data as FollowUpAlert[];
    },
  });

  // Obtener estadísticas de follow-up
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['followup-stats'],
    queryFn: async () => {
      const response = await api.get('/sales/followup/stats');
      return response.data.data as FollowUpStats;
    },
  });

  // Mutation para registrar acción de follow-up
  const logActionMutation = useMutation({
    mutationFn: async ({
      prospectId,
      tipo,
      resultado,
    }: {
      prospectId: string;
      tipo: string;
      resultado: string;
    }) => {
      const response = await api.post(`/sales/followup/action/${prospectId}`, {
        tipo,
        resultado,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followup-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['followup-stats'] });
      setExpandedAlert(null);
    },
  });

  const alerts = alertsData || [];
  const stats = statsData;

  // Filtrar alertas
  let filteredAlerts = alerts;
  if (filtroUrgencia) {
    filteredAlerts = filteredAlerts.filter((a) => a.urgencia === filtroUrgencia);
  }
  if (filtroTemperatura) {
    filteredAlerts = filteredAlerts.filter((a) => a.temperatura === filtroTemperatura);
  }

  const handleLogAction = (prospectId: string, tipo: string, resultado: string) => {
    logActionMutation.mutate({ prospectId, tipo, resultado });
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Alertas Totales</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.alertas_totales || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm font-medium">Ofertas sin Respuesta</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.ofertas_sin_respuesta || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Completadas Hoy</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.acciones_completadas_hoy || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Tasa Completion</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.tasa_completion || 0}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">Filtrar por:</span>

          <div className="flex gap-2">
            {['critica', 'alta', 'media', 'baja'].map((urgencia) => (
              <button
                key={urgencia}
                onClick={() =>
                  setFiltroUrgencia(filtroUrgencia === urgencia ? null : urgencia)
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filtroUrgencia === urgencia
                    ? urgenciaColors[urgencia as keyof typeof urgenciaColors]
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {urgencia.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {['caliente', 'tibio', 'frio'].map((temp) => (
              <button
                key={temp}
                onClick={() =>
                  setFiltroTemperatura(filtroTemperatura === temp ? null : temp)
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filtroTemperatura === temp
                    ? temperaturaColors[temp as keyof typeof temperaturaColors]
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {temp.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetchAlerts()}
            className="ml-auto px-3 py-1 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-all"
          >
            <HiOutlineRefresh className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-3">
        {alertsLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando alertas...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            ✅ No hay alertas de follow-up pendientes
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.prospect_id}
              className={`rounded-lg border-l-4 p-4 cursor-pointer transition-all ${
                urgenciaColors[alert.urgencia as keyof typeof urgenciaColors]
              }`}
              onClick={() =>
                setExpandedAlert(
                  expandedAlert === alert.prospect_id ? null : alert.prospect_id
                )
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {alert.urgencia === 'critica' && (
                      <HiOutlineExclamation className="w-5 h-5" />
                    )}
                    <h3 className="font-bold text-lg">{alert.nombre_negocio}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        temperaturaColors[
                          alert.temperatura as keyof typeof temperaturaColors
                        ]
                      }`}
                    >
                      {alert.temperatura}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{alert.razon_alerta}</p>
                  <p className="text-sm font-medium text-gray-700">
                    Acción: {alert.accion_recomendada}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{alert.dias_sin_contacto} días</p>
                  <p className="text-xs text-gray-600">sin contacto</p>
                </div>
              </div>

              {/* Acciones expandibles */}
              {expandedAlert === alert.prospect_id && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Registrar acción completada:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(tipoAccionIcons).map(([tipo, icon]) => (
                      <button
                        key={tipo}
                        onClick={() => handleLogAction(alert.prospect_id, tipo, 'positivo')}
                        disabled={logActionMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {icon}
                        {tipo === 'email_enviado' && 'Email'}
                        {tipo === 'llamada' && 'Llamada'}
                        {tipo === 'visita_presencial' && 'Visita'}
                        {tipo === 'whatsapp' && 'WhatsApp'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() =>
                        handleLogAction(alert.prospect_id, 'llamada', 'positivo')
                      }
                      disabled={logActionMutation.isPending}
                      className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      ✓ Positivo
                    </button>
                    <button
                      onClick={() =>
                        handleLogAction(alert.prospect_id, 'llamada', 'negativo')
                      }
                      disabled={logActionMutation.isPending}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      ✗ Negativo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
