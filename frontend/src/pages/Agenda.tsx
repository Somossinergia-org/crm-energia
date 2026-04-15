import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitsApi, Visit } from '../services/contacts.service';
import { prospectsApi } from '../services/prospects.service';
import { toast } from 'react-toastify';

interface VisitFormData {
  prospect_id: string;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_minutos: number;
  direccion: string;
  color: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function Agenda() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  });
  const [showModal, setShowModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [form, setForm] = useState<VisitFormData>({
    prospect_id: '',
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    duracion_minutos: 60,
    direccion: '',
    color: COLORS[0],
  });

  const { data: visitsData } = useQuery({
    queryKey: ['visits', dateRange],
    queryFn: () => visitsApi.getAll(dateRange.start, dateRange.end),
  });

  const { data: prospectsData } = useQuery({
    queryKey: ['prospects-list'],
    queryFn: () => prospectsApi.getAll({ limit: 200 }),
  });

  const visits = visitsData?.data || [];
  const prospects = prospectsData?.data || [];

  const events = useMemo(() =>
    visits.map((v) => ({
      id: v.id,
      title: v.titulo,
      start: v.fecha_inicio,
      end: v.fecha_fin,
      backgroundColor: v.color || '#3B82F6',
      borderColor: v.color || '#3B82F6',
      extendedProps: v,
    })),
    [visits]
  );

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => visitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visita creada');
      closeModal();
    },
    onError: () => toast.error('Error al crear visita'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Visit> }) => visitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visita actualizada');
      closeModal();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => visitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visita eliminada');
      closeModal();
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingVisit(null);
    setForm({
      prospect_id: '', titulo: '', descripcion: '',
      fecha_inicio: '', fecha_fin: '', duracion_minutos: 60,
      direccion: '', color: COLORS[0],
    });
  };

  const openCreate = (startStr?: string) => {
    const start = startStr || new Date().toISOString().slice(0, 16);
    const endDate = new Date(new Date(start).getTime() + 60 * 60000);
    setForm({
      ...form,
      fecha_inicio: start.slice(0, 16),
      fecha_fin: endDate.toISOString().slice(0, 16),
    });
    setEditingVisit(null);
    setShowModal(true);
  };

  const openEdit = (visit: Visit) => {
    setEditingVisit(visit);
    setForm({
      prospect_id: visit.prospect_id,
      titulo: visit.titulo,
      descripcion: visit.descripcion || '',
      fecha_inicio: visit.fecha_inicio.slice(0, 16),
      fecha_fin: visit.fecha_fin.slice(0, 16),
      duracion_minutos: visit.duracion_minutos || 60,
      direccion: visit.direccion || '',
      color: visit.color || COLORS[0],
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.fecha_inicio || !form.fecha_fin) {
      toast.error('Titulo y fechas son obligatorios');
      return;
    }
    if (editingVisit) {
      updateMutation.mutate({ id: editingVisit.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEventDrop = (info: any) => {
    const visit = info.event.extendedProps as Visit;
    updateMutation.mutate({
      id: visit.id,
      data: {
        fecha_inicio: info.event.start.toISOString(),
        fecha_fin: info.event.end?.toISOString() || new Date(info.event.start.getTime() + 3600000).toISOString(),
      },
    });
  };

  const todayVisits = visits.filter((v) => {
    const today = new Date().toISOString().split('T')[0];
    return v.fecha_inicio.startsWith(today);
  }).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

  const openGoogleMapsRoute = (visitsForRoute: Visit[]) => {
    const addresses = visitsForRoute
      .filter((v) => v.direccion)
      .map((v) => encodeURIComponent(v.direccion));
    if (addresses.length === 0) {
      toast.error('Ninguna visita tiene direccion');
      return;
    }
    if (addresses.length === 1) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${addresses[0]}`, '_blank');
      return;
    }
    const origin = addresses[0];
    const destination = addresses[addresses.length - 1];
    const waypoints = addresses.slice(1, -1).join('|');
    const url = waypoints
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openSingleNavigation = (direccion: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion)}&travelmode=driving`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500">
            {todayVisits.length} visita{todayVisits.length !== 1 ? 's' : ''} hoy
          </p>
        </div>
        <div className="flex items-center gap-2">
          {todayVisits.length > 0 && (
            <button
              onClick={() => openGoogleMapsRoute(todayVisits)}
              className="btn-secondary flex items-center gap-1.5"
              title="Abrir ruta del dia en Google Maps"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Ruta de hoy
            </button>
          )}
          <button onClick={() => openCreate()} className="btn-primary">
            + Nueva visita
          </button>
        </div>
      </div>

      {/* Visitas de hoy */}
      {todayVisits.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Visitas de hoy</h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {todayVisits.map((v) => (
              <div key={v.id} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <button
                  onClick={() => openEdit(v)}
                  className="flex items-center gap-2 text-left"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: v.color || '#3B82F6' }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.titulo}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(v.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(v.fecha_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      {v.prospect_nombre && ` · ${v.prospect_nombre}`}
                    </p>
                  </div>
                </button>
                {v.direccion && (
                  <button
                    onClick={() => openSingleNavigation(v.direccion)}
                    className="ml-1 p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                    title="Navegar con Google Maps"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.71 11.29l-9-9a.996.996 0 00-1.41 0l-9 9a.996.996 0 000 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 000-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="es"
          firstDay={1}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          eventDrop={handleEventDrop}
          eventClick={(info) => openEdit(info.event.extendedProps as Visit)}
          select={(info) => openCreate(info.startStr)}
          datesSet={(dateInfo) => {
            setDateRange({
              start: dateInfo.startStr.split('T')[0],
              end: dateInfo.endStr.split('T')[0],
            });
          }}
          height="auto"
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Dia',
          }}
        />
      </div>

      {/* Modal crear/editar visita */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingVisit ? 'Editar visita' : 'Nueva visita'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Titulo *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="input-field"
                  placeholder="Visita a Bar El Sol"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Prospecto</label>
                <select
                  value={form.prospect_id}
                  onChange={(e) => {
                    const p = prospects.find((p) => p.id === e.target.value);
                    setForm({
                      ...form,
                      prospect_id: e.target.value,
                      titulo: form.titulo || (p ? `Visita - ${p.nombre_negocio}` : ''),
                      direccion: form.direccion || (p?.direccion_completa || ''),
                    });
                  }}
                  className="input-field"
                >
                  <option value="">Sin prospecto</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre_negocio}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Inicio *</label>
                  <input
                    type="datetime-local"
                    value={form.fecha_inicio}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const endDate = new Date(new Date(newStart).getTime() + form.duracion_minutos * 60000);
                      setForm({ ...form, fecha_inicio: newStart, fecha_fin: endDate.toISOString().slice(0, 16) });
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fin *</label>
                  <input
                    type="datetime-local"
                    value={form.fecha_fin}
                    onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Direccion</label>
                <div className="flex gap-2">
                  <input
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    className="input-field flex-1"
                    placeholder="Calle Gran Via 12, Madrid"
                  />
                  {form.direccion && (
                    <button
                      type="button"
                      onClick={() => openSingleNavigation(form.direccion)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium flex items-center gap-1 flex-shrink-0"
                      title="Abrir en Google Maps"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Maps
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Descripcion</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  className="input-field"
                  placeholder="Notas sobre la visita..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <div>
                  {editingVisit && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Eliminar esta visita?')) deleteMutation.mutate(editingVisit.id);
                      }}
                      className="btn-danger"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">
                    {editingVisit ? 'Guardar' : 'Crear visita'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
