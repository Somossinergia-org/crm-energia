import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prospectsApi, zonesApi } from '../services/prospects.service';
import { contactsApi } from '../services/contacts.service';
import { ESTADO_CONFIG, PRIORIDAD_CONFIG, TEMPERATURA_CONFIG, CATEGORIAS, Prospect } from '../types/prospect';
import { useAuthStore } from '../stores/authStore';
import ContactTimeline from '../components/prospects/ContactTimeline';
import QuickLogModal from '../components/prospects/QuickLogModal';
import ProspectModal from '../components/prospects/ProspectModal';
import ProspectServiciosPanel from '../components/prospects/ProspectServiciosPanel';
import DocumentsPanel from '../components/prospects/DocumentsPanel';
import { toast } from 'react-toastify';
import {
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlineGlobe,
  HiOutlineLocationMarker,
  HiOutlineLightningBolt,
  HiOutlineClipboardList,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

function formatFuente(fuente: string): string {
  if (!fuente) return '-';
  const map: Record<string, string> = {
    csv_importado: 'Importacion CSV',
    manual: 'Creacion manual',
    web: 'Formulario web',
    referido: 'Referido',
    google_maps: 'Google Maps',
    puerta_fria: 'Puerta fria',
    llamada_entrante: 'Llamada entrante',
    redes_sociales: 'Redes sociales',
  };
  return map[fuente] || fuente.replace(/_/g, ' ');
}

function formatCategoria(cat: string): string {
  return CATEGORIAS.find(c => c.value === cat)?.label || cat;
}

export default function ProspectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: prospectData, isLoading } = useQuery({
    queryKey: ['prospect', id],
    queryFn: () => prospectsApi.getById(id!),
    enabled: !!id,
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsApi.getByProspect(id!),
    enabled: !!id,
  });

  const { data: zonesData } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zonesApi.getAll(),
  });

  const zones = zonesData?.data || [];

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Prospect>) => prospectsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect', id] });
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      setShowEditModal(false);
      toast.success('Prospecto actualizado');
    },
    onError: () => toast.error('Error al actualizar prospecto'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => prospectsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      toast.success('Prospecto eliminado');
      navigate('/pipeline');
    },
    onError: () => toast.error('Error al eliminar prospecto'),
  });

  const handleDelete = () => {
    if (window.confirm('Estas seguro de que quieres eliminar este prospecto? Esta accion no se puede deshacer.')) {
      deleteMutation.mutate();
    }
  };

  const logMutation = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', id] });
      queryClient.invalidateQueries({ queryKey: ['prospect', id] });
      toast.success('Actividad registrada');
      setShowQuickLog(false);
    },
    onError: () => toast.error('Error al registrar actividad'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ estado }: { estado: string }) => prospectsApi.updateStatus(id!, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect', id] });
      toast.success('Estado actualizado');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const prospect = prospectData?.data;
  if (!prospect) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Prospecto no encontrado</p>
        <button onClick={() => navigate('/pipeline')} className="btn-primary mt-4">Volver</button>
      </div>
    );
  }

  const entries = contactsData?.data || [];
  const estadoCfg = ESTADO_CONFIG[prospect.estado];
  const prioridadCfg = PRIORIDAD_CONFIG[prospect.prioridad];
  const tempCfg = TEMPERATURA_CONFIG[prospect.temperatura];

  const callPhone = (phone: string) => {
    if (phone) window.open(`tel:${phone}`);
  };

  const openWhatsApp = (phone: string) => {
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      const full = clean.startsWith('34') ? clean : `34${clean}`;
      window.open(`https://wa.me/${full}`, '_blank');
    }
  };

  const hasEnergyData = prospect.comercializadora_actual || prospect.tarifa_actual ||
    prospect.gasto_mensual_estimado_eur || prospect.consumo_anual_kwh || prospect.cups;

  const hasSocialMedia = prospect.instagram || prospect.facebook || prospect.web;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/pipeline')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{prospect.nombre_negocio}</h1>
            {prospect.rating_google && prospect.rating_google > 0 && (
              <span className="inline-flex items-center gap-0.5 text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                <HiOutlineStar className="w-4 h-4 fill-amber-400 text-amber-400" />
                {prospect.rating_google}
                {prospect.num_reviews_google > 0 && (
                  <span className="text-amber-400 text-xs">({prospect.num_reviews_google})</span>
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formatCategoria(prospect.categoria)}
            {prospect.municipio && ` · ${prospect.municipio}`}
            {prospect.provincia && prospect.provincia !== prospect.municipio && `, ${prospect.provincia}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {user?.role === 'admin' && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-secondary"
          >
            Editar
          </button>
          <button onClick={() => setShowQuickLog(true)} className="btn-primary">
            + Registrar actividad
          </button>
        </div>
      </div>

      {/* Banner si es cliente */}
      {prospect.estado === 'contrato_firmado' && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-green-800">
            Este negocio es un <strong>cliente activo</strong> con servicios contratados.
          </p>
          <button
            onClick={() => navigate(`/clientes/${prospect.id}`)}
            className="text-sm font-medium text-green-700 hover:text-green-900 underline"
          >
            Ver ficha de cliente
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda: info del prospecto */}
        <div className="lg:col-span-1 space-y-4">
          {/* Estado y badges */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoCfg.bg} ${estadoCfg.color}`}>
                {estadoCfg.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${prioridadCfg.bg} ${prioridadCfg.color}`}>
                {prioridadCfg.label}
              </span>
              <span className="text-sm">{tempCfg.icon} {tempCfg.label}</span>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Cambiar estado</label>
              <select
                value={prospect.estado}
                onChange={(e) => statusMutation.mutate({ estado: e.target.value })}
                className="input-field text-sm"
              >
                {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contacto */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineUser className="w-4 h-4 text-gray-400" />
              Contacto
            </h3>
            <div className="space-y-2.5 text-sm">
              {prospect.nombre_contacto && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Persona</span>
                  <span className="text-gray-900 font-medium">{prospect.nombre_contacto}</span>
                </div>
              )}
              {prospect.telefono_movil && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Movil</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono text-xs">{prospect.telefono_movil}</span>
                    <button onClick={() => callPhone(prospect.telefono_movil)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded" title="Llamar">
                      <HiOutlinePhone className="w-4 h-4" />
                    </button>
                    <button onClick={() => openWhatsApp(prospect.telefono_movil)} className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded" title="WhatsApp">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              {prospect.telefono_fijo && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Fijo</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono text-xs">{prospect.telefono_fijo}</span>
                    <button onClick={() => callPhone(prospect.telefono_fijo)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded">
                      <HiOutlinePhone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {prospect.email_principal && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Email</span>
                  <a href={`mailto:${prospect.email_principal}`} className="text-primary-600 hover:underline text-xs truncate max-w-[60%]">
                    {prospect.email_principal}
                  </a>
                </div>
              )}
              {prospect.email_secundario && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Email 2</span>
                  <a href={`mailto:${prospect.email_secundario}`} className="text-primary-600 hover:underline text-xs truncate max-w-[60%]">
                    {prospect.email_secundario}
                  </a>
                </div>
              )}
              {prospect.direccion_completa && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Direccion</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-right text-xs max-w-[55%]">{prospect.direccion_completa}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(prospect.direccion_completa + ', ' + prospect.municipio)}&travelmode=driving`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Navegar con Google Maps"
                    >
                      <HiOutlineLocationMarker className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Web y Redes sociales */}
          {hasSocialMedia && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <HiOutlineGlobe className="w-4 h-4 text-gray-400" />
                Web y redes
              </h3>
              <div className="space-y-2 text-sm">
                {prospect.web && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Web</span>
                    <a href={prospect.web.startsWith('http') ? prospect.web : `https://${prospect.web}`} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate max-w-[60%] text-xs">
                      {prospect.web.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {prospect.instagram && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Instagram</span>
                    <a href={`https://instagram.com/${prospect.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline text-xs">
                      @{prospect.instagram.replace('@', '')}
                    </a>
                  </div>
                )}
                {prospect.facebook && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Facebook</span>
                    <a href={prospect.facebook.startsWith('http') ? prospect.facebook : `https://facebook.com/${prospect.facebook}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[60%] text-xs">
                      {prospect.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Datos energeticos */}
          {hasEnergyData ? (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <HiOutlineLightningBolt className="w-4 h-4 text-amber-500" />
                Datos energeticos
              </h3>
              <div className="space-y-2 text-sm">
                {prospect.comercializadora_actual && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Comercializadora</span>
                    <span className="text-gray-900">{prospect.comercializadora_actual}</span>
                  </div>
                )}
                {prospect.tarifa_actual && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tarifa</span>
                    <span className="text-gray-900">{prospect.tarifa_actual}</span>
                  </div>
                )}
                {prospect.gasto_mensual_estimado_eur && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gasto mensual</span>
                    <span className="text-gray-900 font-medium">{Number(prospect.gasto_mensual_estimado_eur).toFixed(0)} EUR/mes</span>
                  </div>
                )}
                {prospect.consumo_anual_kwh && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Consumo anual</span>
                    <span className="text-gray-900">{Number(prospect.consumo_anual_kwh).toLocaleString()} kWh</span>
                  </div>
                )}
                {(prospect.potencia_p1_kw || prospect.potencia_p2_kw) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Potencias</span>
                    <span className="text-gray-900 text-xs">
                      P1: {prospect.potencia_p1_kw || '-'} kW
                      {prospect.potencia_p2_kw && ` · P2: ${prospect.potencia_p2_kw} kW`}
                      {prospect.potencia_p3_kw && ` · P3: ${prospect.potencia_p3_kw} kW`}
                    </span>
                  </div>
                )}
                {prospect.cups && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">CUPS</span>
                    <span className="text-gray-900 text-xs font-mono">{prospect.cups}</span>
                  </div>
                )}
                {prospect.fecha_vencimiento_contrato && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vencimiento</span>
                    <span className="text-gray-900">
                      {new Date(prospect.fecha_vencimiento_contrato).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}
                {prospect.ahorro_estimado_eur && (
                  <div className="flex justify-between bg-green-50 -mx-4 px-4 py-2 rounded">
                    <span className="text-green-700 font-medium flex items-center gap-1">
                      <HiOutlineTrendingUp className="w-4 h-4" />
                      Ahorro estimado
                    </span>
                    <span className="text-green-700 font-bold">
                      {Number(prospect.ahorro_estimado_eur).toFixed(0)} EUR/ano
                      {prospect.ahorro_porcentaje && ` (${prospect.ahorro_porcentaje}%)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <HiOutlineLightningBolt className="w-4 h-4 text-gray-400" />
                Datos energeticos
              </h3>
              <p className="text-xs text-gray-400 text-center py-3">
                Sin datos energeticos. Edita el prospecto para anadir comercializadora, tarifa, consumo, etc.
              </p>
            </div>
          )}

          {/* Servicios */}
          <ProspectServiciosPanel prospectId={prospect.id} />

          {/* Documentos */}
          <DocumentsPanel prospectId={prospect.id} />

          {/* Seguimiento */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineClipboardList className="w-4 h-4 text-gray-400" />
              Seguimiento
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Intentos contacto</span>
                <span className="text-gray-900 font-medium">{prospect.numero_intentos_contacto}</span>
              </div>
              {prospect.fecha_primer_contacto && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Primer contacto</span>
                  <span className="text-gray-900">
                    {new Date(prospect.fecha_primer_contacto).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              {prospect.fecha_ultimo_contacto && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ultimo contacto</span>
                  <span className="text-gray-900">
                    {new Date(prospect.fecha_ultimo_contacto).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              {prospect.fecha_proximo_contacto && (
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                    Proximo contacto
                  </span>
                  <span className={`font-medium ${new Date(prospect.fecha_proximo_contacto) < new Date() ? 'text-red-600' : 'text-blue-600'}`}>
                    {new Date(prospect.fecha_proximo_contacto).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              {prospect.asignado_nombre && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Asignado a</span>
                  <span className="text-gray-900">{prospect.asignado_nombre}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Fuente</span>
                <span className="text-gray-900">{formatFuente(prospect.fuente)}</span>
              </div>
              {prospect.num_emails_enviados > 0 && (
                <div className="flex justify-between bg-blue-50 -mx-4 px-4 py-1.5 rounded">
                  <span className="text-blue-700 text-xs">Emails</span>
                  <span className="text-blue-700 text-xs">
                    {prospect.num_emails_enviados} enviados · {prospect.num_emails_abiertos} abiertos · {prospect.num_emails_clicked} clicks
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs pt-1">
                <span className="text-gray-400">Creado</span>
                <span className="text-gray-400">{new Date(prospect.created_at).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          {/* Notas internas */}
          {prospect.notas_internas ? (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <HiOutlineDocumentText className="w-4 h-4 text-gray-400" />
                Notas internas
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{prospect.notas_internas}</p>
            </div>
          ) : null}

          {/* Etiquetas */}
          {prospect.etiquetas && prospect.etiquetas.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Etiquetas</h3>
              <div className="flex flex-wrap gap-1.5">
                {prospect.etiquetas.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: timeline de actividad */}
        <div className="lg:col-span-2">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <HiOutlineClock className="w-4 h-4 text-gray-400" />
                Historial de actividad ({entries.length})
              </h3>
              <button
                onClick={() => setShowQuickLog(true)}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                + Registrar
              </button>
            </div>
            <ContactTimeline entries={entries} />
          </div>
        </div>
      </div>

      {/* Modal de registro rapido */}
      {showQuickLog && (
        <QuickLogModal
          prospect={prospect}
          onSave={(data) => logMutation.mutate(data)}
          onClose={() => setShowQuickLog(false)}
        />
      )}

      {/* Modal de edicion */}
      {showEditModal && (
        <ProspectModal
          prospect={prospect}
          zones={zones}
          onSave={(data) => updateMutation.mutate(data)}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
