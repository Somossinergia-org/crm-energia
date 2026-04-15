import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  serviciosApi,
  SERVICIOS_CONFIG,
  SERVICIO_ESTADOS,
  ServicioTipo,
  ProspectServicio,
} from '../../services/servicios.service';
import { toast } from 'react-toastify';

interface Props {
  prospectId: string;
}

export default function ProspectServiciosPanel({ prospectId }: Props) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: serviciosData } = useQuery({
    queryKey: ['servicios', prospectId],
    queryFn: () => serviciosApi.getByProspect(prospectId),
  });

  const servicios: ProspectServicio[] = serviciosData?.data || [];

  const upsertMutation = useMutation({
    mutationFn: (data: any) => serviciosApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios', prospectId] });
      toast.success('Servicio guardado');
      setShowAdd(false);
      setEditingId(null);
      setFormData({});
    },
    onError: () => toast.error('Error al guardar servicio'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => serviciosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios', prospectId] });
      toast.success('Servicio actualizado');
      setEditingId(null);
      setFormData({});
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviciosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios', prospectId] });
      toast.success('Servicio eliminado');
    },
  });

  const serviciosActivos = servicios.map((s) => s.servicio);
  const serviciosDisponibles = SERVICIOS_CONFIG.filter(
    (cfg) => !serviciosActivos.includes(cfg.id)
  );

  const handleAddServicio = (tipo: ServicioTipo) => {
    setFormData({
      prospect_id: prospectId,
      servicio: tipo,
      estado: 'pendiente',
      proveedor_actual: '',
      gasto_actual_eur: null,
      precio_ofertado_eur: null,
      ahorro_estimado_eur: null,
      datos: {},
      notas: '',
    });
    setShowAdd(false);
    setEditingId('new');
  };

  const handleEdit = (servicio: ProspectServicio) => {
    setFormData({
      ...servicio,
      datos: servicio.datos || {},
    });
    setEditingId(servicio.id);
    setExpanded(servicio.id);
  };

  const handleSave = () => {
    if (editingId === 'new') {
      upsertMutation.mutate(formData);
    } else if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Eliminar este servicio?')) {
      deleteMutation.mutate(id);
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateDatos = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      datos: { ...(prev.datos || {}), [key]: value },
    }));
  };

  const getConfig = (tipo: string) =>
    SERVICIOS_CONFIG.find((c) => c.id === tipo);

  const getEstado = (estado: string) =>
    SERVICIO_ESTADOS.find((e) => e.value === estado) || SERVICIO_ESTADOS[0];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Servicios ({servicios.length})
        </h3>
        {serviciosDisponibles.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              + Anadir
            </button>
            {showAdd && (
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-52">
                {serviciosDisponibles.map((cfg) => (
                  <button
                    key={cfg.id}
                    onClick={() => handleAddServicio(cfg.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {servicios.length === 0 && editingId !== 'new' && (
        <p className="text-xs text-gray-400 text-center py-4">
          Sin servicios registrados. Anade energia, teleco, alarmas, seguros...
        </p>
      )}

      <div className="space-y-2">
        {/* Existing services */}
        {servicios.map((servicio) => {
          const cfg = getConfig(servicio.servicio);
          const estadoCfg = getEstado(servicio.estado);
          const isExpanded = expanded === servicio.id;
          const isEditing = editingId === servicio.id;

          if (!cfg) return null;

          return (
            <div
              key={servicio.id}
              className={`border rounded-lg overflow-hidden ${cfg.bg} border-gray-200`}
            >
              {/* Header */}
              <button
                onClick={() => {
                  if (!isEditing) setExpanded(isExpanded ? null : servicio.id);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg.icon}</span>
                  <span className={`text-sm font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${estadoCfg.bg} ${estadoCfg.color}`}
                  >
                    {estadoCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {servicio.gasto_actual_eur && (
                    <span className="text-xs text-gray-500">
                      {Number(servicio.gasto_actual_eur).toFixed(0)} EUR/mes
                    </span>
                  )}
                  {servicio.ahorro_estimado_eur && (
                    <span className="text-xs text-green-600 font-medium">
                      -{Number(servicio.ahorro_estimado_eur).toFixed(0)} EUR
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-200/50">
                  {isEditing ? (
                    <ServiceForm
                      config={cfg}
                      formData={formData}
                      updateField={updateField}
                      updateDatos={updateDatos}
                      onSave={handleSave}
                      onCancel={() => {
                        setEditingId(null);
                        setFormData({});
                      }}
                      saving={updateMutation.isPending}
                    />
                  ) : (
                    <div className="pt-2 space-y-2">
                      {/* Common fields */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        {servicio.proveedor_actual && (
                          <>
                            <span className="text-gray-500">Proveedor actual</span>
                            <span className="text-gray-800">{servicio.proveedor_actual}</span>
                          </>
                        )}
                        {servicio.gasto_actual_eur != null && (
                          <>
                            <span className="text-gray-500">Gasto actual</span>
                            <span className="text-gray-800">{Number(servicio.gasto_actual_eur).toFixed(2)} EUR/mes</span>
                          </>
                        )}
                        {servicio.precio_ofertado_eur != null && (
                          <>
                            <span className="text-gray-500">Precio ofertado</span>
                            <span className="text-gray-800">{Number(servicio.precio_ofertado_eur).toFixed(2)} EUR/mes</span>
                          </>
                        )}
                        {servicio.ahorro_estimado_eur != null && (
                          <>
                            <span className="text-gray-500">Ahorro estimado</span>
                            <span className="text-green-700 font-medium">{Number(servicio.ahorro_estimado_eur).toFixed(2)} EUR/mes</span>
                          </>
                        )}
                        {servicio.fecha_contratacion && (
                          <>
                            <span className="text-gray-500">Contratacion</span>
                            <span className="text-gray-800">{new Date(servicio.fecha_contratacion).toLocaleDateString('es-ES')}</span>
                          </>
                        )}
                        {servicio.fecha_vencimiento && (
                          <>
                            <span className="text-gray-500">Vencimiento</span>
                            <span className="text-gray-800">{new Date(servicio.fecha_vencimiento).toLocaleDateString('es-ES')}</span>
                          </>
                        )}
                      </div>

                      {/* Service-specific datos */}
                      {servicio.datos && Object.keys(servicio.datos).length > 0 && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1 border-t border-gray-200/50">
                          {cfg.campos.map((campo) => {
                            const val = servicio.datos[campo.key];
                            if (!val) return null;
                            return (
                              <div key={campo.key} className="contents">
                                <span className="text-gray-500">{campo.label}</span>
                                <span className="text-gray-800">{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {servicio.notas && (
                        <p className="text-xs text-gray-600 pt-1 border-t border-gray-200/50 italic">
                          {servicio.notas}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleEdit(servicio)}
                          className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(servicio.id)}
                          className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* New service form */}
        {editingId === 'new' && formData.servicio && (
          <div className={`border rounded-lg overflow-hidden ${getConfig(formData.servicio)?.bg || 'bg-gray-50'} border-gray-200`}>
            <div className="px-3 py-2.5 flex items-center gap-2">
              <span className="text-lg">{getConfig(formData.servicio)?.icon}</span>
              <span className={`text-sm font-medium ${getConfig(formData.servicio)?.color}`}>
                Nuevo: {getConfig(formData.servicio)?.label}
              </span>
            </div>
            <div className="px-3 pb-3 border-t border-gray-200/50">
              <ServiceForm
                config={getConfig(formData.servicio)!}
                formData={formData}
                updateField={updateField}
                updateDatos={updateDatos}
                onSave={handleSave}
                onCancel={() => {
                  setEditingId(null);
                  setFormData({});
                }}
                saving={upsertMutation.isPending}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Service Form (shared between add/edit) ─── */

interface ServiceFormProps {
  config: (typeof SERVICIOS_CONFIG)[number];
  formData: Record<string, any>;
  updateField: (key: string, value: any) => void;
  updateDatos: (key: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function ServiceForm({
  config,
  formData,
  updateField,
  updateDatos,
  onSave,
  onCancel,
  saving,
}: ServiceFormProps) {
  const inputClass =
    'w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white';

  return (
    <div className="pt-2 space-y-3">
      {/* Estado */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Estado</label>
        <select
          value={formData.estado || 'pendiente'}
          onChange={(e) => updateField('estado', e.target.value)}
          className={inputClass}
        >
          {SERVICIO_ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      {/* Common fields row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Proveedor actual</label>
          <input
            type="text"
            value={formData.proveedor_actual || ''}
            onChange={(e) => updateField('proveedor_actual', e.target.value)}
            className={inputClass}
            placeholder="Proveedor..."
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Gasto actual (EUR/mes)</label>
          <input
            type="number"
            value={formData.gasto_actual_eur ?? ''}
            onChange={(e) =>
              updateField('gasto_actual_eur', e.target.value ? Number(e.target.value) : null)
            }
            className={inputClass}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Precio ofertado (EUR/mes)</label>
          <input
            type="number"
            value={formData.precio_ofertado_eur ?? ''}
            onChange={(e) =>
              updateField('precio_ofertado_eur', e.target.value ? Number(e.target.value) : null)
            }
            className={inputClass}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ahorro estimado (EUR/mes)</label>
          <input
            type="number"
            value={formData.ahorro_estimado_eur ?? ''}
            onChange={(e) =>
              updateField('ahorro_estimado_eur', e.target.value ? Number(e.target.value) : null)
            }
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha contratacion</label>
          <input
            type="date"
            value={formData.fecha_contratacion || ''}
            onChange={(e) => updateField('fecha_contratacion', e.target.value || null)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha vencimiento</label>
          <input
            type="date"
            value={formData.fecha_vencimiento || ''}
            onChange={(e) => updateField('fecha_vencimiento', e.target.value || null)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Service-specific campos */}
      <div className="border-t border-gray-200/50 pt-2">
        <p className="text-xs font-medium text-gray-600 mb-2">Datos especificos</p>
        <div className="grid grid-cols-2 gap-2">
          {config.campos.map((campo) => (
            <div key={campo.key}>
              <label className="block text-xs text-gray-500 mb-1">{campo.label}</label>
              {campo.type === 'select' && campo.options ? (
                <select
                  value={formData.datos?.[campo.key] || ''}
                  onChange={(e) => updateDatos(campo.key, e.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  {campo.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : campo.type === 'date' ? (
                <input
                  type="date"
                  value={formData.datos?.[campo.key] || ''}
                  onChange={(e) => updateDatos(campo.key, e.target.value)}
                  className={inputClass}
                />
              ) : (
                <input
                  type={campo.type === 'number' ? 'number' : 'text'}
                  value={formData.datos?.[campo.key] || ''}
                  onChange={(e) => updateDatos(campo.key, e.target.value)}
                  className={inputClass}
                  placeholder={campo.placeholder || ''}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Notas</label>
        <textarea
          value={formData.notas || ''}
          onChange={(e) => updateField('notas', e.target.value)}
          className={`${inputClass} resize-none`}
          rows={2}
          placeholder="Observaciones sobre este servicio..."
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
