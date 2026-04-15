import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prospectsApi } from '../services/prospects.service';
import { contactsApi } from '../services/contacts.service';
import { serviciosApi, SERVICIOS_CONFIG } from '../services/servicios.service';
import { CATEGORIAS } from '../types/prospect';
import ContactTimeline from '../components/prospects/ContactTimeline';
import QuickLogModal from '../components/prospects/QuickLogModal';
import ProspectServiciosPanel from '../components/prospects/ProspectServiciosPanel';
import DocumentsPanel from '../components/prospects/DocumentsPanel';
import { toast } from 'react-toastify';
import {
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlineLocationMarker,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCurrencyEuro,
  HiOutlineDocumentText,
  HiOutlineExclamation,
} from 'react-icons/hi';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showQuickLog, setShowQuickLog] = useState(false);

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

  const { data: serviciosData } = useQuery({
    queryKey: ['servicios', id],
    queryFn: () => serviciosApi.getByProspect(id!),
    enabled: !!id,
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const client = prospectData?.data;
  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Cliente no encontrado</p>
        <button onClick={() => navigate('/clientes')} className="btn-primary mt-4">Volver</button>
      </div>
    );
  }

  const entries = contactsData?.data || [];
  const servicios = serviciosData?.data || [];
  const contratados = servicios.filter((s: any) => s.estado === 'contratado');
  const facturacionMensual = contratados.reduce((sum: number, s: any) => sum + (Number(s.precio_ofertado_eur) || 0), 0);
  const ahorroTotal = contratados.reduce((sum: number, s: any) => sum + (Number(s.ahorro_estimado_eur) || 0), 0);

  const proximaRenovacion = contratados
    .filter((s: any) => s.fecha_vencimiento)
    .sort((a: any, b: any) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0];

  const formatCategoria = (cat: string) => CATEGORIAS.find((c) => c.value === cat)?.label || cat;

  const callPhone = (phone: string) => { if (phone) window.open(`tel:${phone}`); };
  const openWhatsApp = (phone: string) => {
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      const full = clean.startsWith('34') ? clean : `34${clean}`;
      window.open(`https://wa.me/${full}`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clientes')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Cliente</span>
            <h1 className="text-2xl font-bold text-gray-900 truncate">{client.nombre_negocio}</h1>
            {client.rating_google && client.rating_google > 0 && (
              <span className="inline-flex items-center gap-0.5 text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <HiOutlineStar className="w-4 h-4 fill-amber-400 text-amber-400" />
                {client.rating_google}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formatCategoria(client.categoria)}
            {client.municipio && ` · ${client.municipio}`}
            {client.provincia && client.provincia !== client.municipio && `, ${client.provincia}`}
            {client.fecha_conversion && ` · Cliente desde ${new Date(client.fecha_conversion).toLocaleDateString('es-ES')}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate(`/pipeline/${client.id}`)} className="btn-secondary text-sm">
            Ver ficha completa
          </button>
          <button onClick={() => setShowQuickLog(true)} className="btn-primary">
            + Registrar actividad
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Resumen financiero */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineCurrencyEuro className="w-4 h-4 text-green-500" />
              Resumen financiero
            </h3>
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{facturacionMensual.toFixed(0)} EUR</p>
                <p className="text-xs text-green-600">Facturacion mensual</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-700">{contratados.length}</p>
                  <p className="text-xs text-blue-600">Servicios activos</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-700">{ahorroTotal.toFixed(0)} EUR</p>
                  <p className="text-xs text-amber-600">Ahorro/mes</p>
                </div>
              </div>
              {proximaRenovacion && (
                <div className={`rounded-lg p-2 text-center ${new Date(proximaRenovacion.fecha_vencimiento) < new Date() ? 'bg-red-50' : 'bg-purple-50'}`}>
                  <div className="flex items-center justify-center gap-1">
                    {new Date(proximaRenovacion.fecha_vencimiento) < new Date() && (
                      <HiOutlineExclamation className="w-4 h-4 text-red-500" />
                    )}
                    <p className={`text-sm font-medium ${new Date(proximaRenovacion.fecha_vencimiento) < new Date() ? 'text-red-700' : 'text-purple-700'}`}>
                      {new Date(proximaRenovacion.fecha_vencimiento) < new Date() ? 'VENCIDO' : 'Proxima renovacion'}
                    </p>
                  </div>
                  <p className={`text-xs ${new Date(proximaRenovacion.fecha_vencimiento) < new Date() ? 'text-red-600' : 'text-purple-600'}`}>
                    {SERVICIOS_CONFIG.find(c => c.id === proximaRenovacion.servicio)?.icon}{' '}
                    {new Date(proximaRenovacion.fecha_vencimiento).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Servicios contratados */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Servicios contratados ({contratados.length})</h3>
            {contratados.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">Sin servicios contratados</p>
            ) : (
              <div className="space-y-2">
                {contratados.map((s: any) => {
                  const cfg = SERVICIOS_CONFIG.find(c => c.id === s.servicio);
                  return (
                    <div key={s.id} className={`rounded-lg p-2.5 ${cfg?.bg || 'bg-gray-50'} border border-gray-200/50`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <span>{cfg?.icon}</span>
                          <span className={cfg?.color}>{cfg?.label}</span>
                        </span>
                        {s.precio_ofertado_eur && (
                          <span className="text-xs font-medium text-gray-700">{Number(s.precio_ofertado_eur).toFixed(0)} EUR/mes</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                        {s.proveedor_actual && <span>Prov: {s.proveedor_actual}</span>}
                        {s.fecha_vencimiento && (
                          <span className={new Date(s.fecha_vencimiento) < new Date() ? 'text-red-600 font-medium' : ''}>
                            Vence: {new Date(s.fecha_vencimiento).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gestionar servicios */}
          <ProspectServiciosPanel prospectId={id!} />

          {/* Documentos */}
          <DocumentsPanel prospectId={id!} />

          {/* Contacto */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineUser className="w-4 h-4 text-gray-400" />
              Contacto
            </h3>
            <div className="space-y-2.5 text-sm">
              {client.nombre_contacto && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Persona</span>
                  <span className="text-gray-900 font-medium">{client.nombre_contacto}</span>
                </div>
              )}
              {client.telefono_movil && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Movil</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono text-xs">{client.telefono_movil}</span>
                    <button onClick={() => callPhone(client.telefono_movil)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                      <HiOutlinePhone className="w-4 h-4" />
                    </button>
                    <button onClick={() => openWhatsApp(client.telefono_movil)} className="p-1 text-green-500 hover:bg-green-50 rounded">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              {client.email_principal && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Email</span>
                  <a href={`mailto:${client.email_principal}`} className="text-primary-600 hover:underline text-xs truncate max-w-[60%]">
                    {client.email_principal}
                  </a>
                </div>
              )}
              {client.direccion_completa && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Direccion</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-right text-xs max-w-[55%]">{client.direccion_completa}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(client.direccion_completa + ', ' + client.municipio)}&travelmode=driving`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <HiOutlineLocationMarker className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          {client.notas_internas && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <HiOutlineDocumentText className="w-4 h-4 text-gray-400" />
                Notas
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.notas_internas}</p>
            </div>
          )}
        </div>

        {/* Right column: timeline */}
        <div className="lg:col-span-2">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <HiOutlineClock className="w-4 h-4 text-gray-400" />
                Historial de actividad ({entries.length})
              </h3>
              <button onClick={() => setShowQuickLog(true)} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                + Registrar
              </button>
            </div>
            <ContactTimeline entries={entries} />
          </div>
        </div>
      </div>

      {showQuickLog && (
        <QuickLogModal
          prospect={client}
          onSave={(data) => logMutation.mutate(data)}
          onClose={() => setShowQuickLog(false)}
        />
      )}
    </div>
  );
}
