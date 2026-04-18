import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi, EmailTemplate, EmailAccount, EmailCampaign, EmailSecuencia, EmailStats } from '../services/email.service';
import { toast } from 'react-toastify';
import {
  HiOutlineMail,
  HiOutlineTemplate,
  HiOutlineSpeakerphone,
  HiOutlineCog,
  HiOutlinePaperAirplane,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineChartBar,
} from 'react-icons/hi';

type Tab = 'redactar' | 'historial' | 'plantillas' | 'campanas' | 'secuencias' | 'cuentas';

export default function Email() {
  const [activeTab, setActiveTab] = useState<Tab>('redactar');

  const tabs: { id: Tab; label: string; icon: typeof HiOutlineMail }[] = [
    { id: 'redactar', label: 'Redactar', icon: HiOutlinePaperAirplane },
    { id: 'historial', label: 'Historial', icon: HiOutlineMail },
    { id: 'plantillas', label: 'Plantillas', icon: HiOutlineTemplate },
    { id: 'campanas', label: 'Campanas', icon: HiOutlineSpeakerphone },
    { id: 'secuencias', label: 'Secuencias', icon: HiOutlineRefresh },
    { id: 'cuentas', label: 'Cuentas SMTP', icon: HiOutlineCog },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Email</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'redactar' && <ComposeTab />}
      {activeTab === 'historial' && <HistorialTab />}
      {activeTab === 'plantillas' && <PlantillasTab />}
      {activeTab === 'campanas' && <CampanasTab />}
      {activeTab === 'secuencias' && <SecuenciasTab />}
      {activeTab === 'cuentas' && <CuentasTab />}
    </div>
  );
}

// ══════════ TAB: Redactar ══════════
function ComposeTab() {
  const queryClient = useQueryClient();
  const { data: accountsData } = useQuery({ queryKey: ['email-accounts'], queryFn: emailApi.getAccounts });
  const { data: templatesData } = useQuery({ queryKey: ['email-templates'], queryFn: emailApi.getTemplates });
  const { data: statsData } = useQuery({ queryKey: ['email-stats'], queryFn: emailApi.getStats });

  const accounts: EmailAccount[] = accountsData?.data || [];
  const templates: EmailTemplate[] = templatesData?.data || [];
  const stats: EmailStats = statsData?.data || {};

  const [form, setForm] = useState({
    account_id: '',
    to: '',
    subject: '',
    html: '',
    template_id: '',
  });

  const sendMutation = useMutation({
    mutationFn: () => emailApi.sendEmail(form),
    onSuccess: () => {
      toast.success('Email enviado correctamente');
      setForm({ ...form, to: '', subject: '', html: '', template_id: '' });
      queryClient.invalidateQueries({ queryKey: ['email-history'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al enviar'),
  });

  const handleTemplateChange = async (templateId: string) => {
    setForm({ ...form, template_id: templateId });
    if (templateId) {
      const t = templates.find(t => t.id === templateId);
      if (t) {
        setForm(prev => ({ ...prev, template_id: templateId, subject: t.asunto, html: t.cuerpo_html }));
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats cards */}
      <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Enviados hoy', value: stats.enviados_hoy || 0, color: 'text-blue-600' },
          { label: 'Esta semana', value: stats.enviados_semana || 0, color: 'text-green-600' },
          { label: 'Abiertos', value: stats.total_abiertos || 0, color: 'text-purple-600' },
          { label: 'Clicks', value: stats.total_clicks || 0, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Compose form */}
      <div className="lg:col-span-2 card p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Nuevo email</h3>

        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <HiOutlineCog className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Configura una cuenta SMTP primero</p>
            <p className="text-xs text-gray-400 mt-1">Ve a la pestana &quot;Cuentas SMTP&quot;</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cuenta</label>
                <select
                  value={form.account_id}
                  onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.filter(a => a.activa).map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre} ({a.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Plantilla</label>
                <select
                  value={form.template_id}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">Sin plantilla</option>
                  {templates.filter(t => t.activa).map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Para</label>
              <input
                type="email"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="input-field"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Asunto</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="input-field"
                placeholder="Asunto del email"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Mensaje (HTML)</label>
              <textarea
                value={form.html}
                onChange={(e) => setForm({ ...form, html: e.target.value })}
                className="input-field min-h-[200px] font-mono text-sm"
                placeholder="<p>Escribe tu mensaje aqui...</p>&#10;&#10;Variables disponibles: {{nombre_negocio}}, {{nombre_contacto}}, {{municipio}}, etc."
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Variables:</span>
              {['nombre_negocio', 'nombre_contacto', 'municipio', 'ahorro_estimado', 'fecha'].map(v => (
                <button
                  key={v}
                  onClick={() => setForm({ ...form, html: form.html + `{{${v}}}` })}
                  className="px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => sendMutation.mutate()}
                disabled={!form.account_id || !form.to || !form.subject || !form.html || sendMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <HiOutlinePaperAirplane className="w-4 h-4" />
                {sendMutation.isPending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sidebar: quick info */}
      <div className="card p-4 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <HiOutlineChartBar className="w-4 h-4" />
          Resumen
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total enviados</span>
            <span className="font-medium">{stats.total_enviados || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tasa apertura</span>
            <span className="font-medium text-green-600">
              {Number(stats.total_enviados) > 0 ? Math.round(((Number(stats.total_abiertos) || 0) / Number(stats.total_enviados)) * 100) : 0}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tasa click</span>
            <span className="font-medium text-blue-600">
              {Number(stats.total_enviados) > 0 ? Math.round(((Number(stats.total_clicks) || 0) / Number(stats.total_enviados)) * 100) : 0}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Rebotes</span>
            <span className="font-medium text-red-600">{stats.total_rebotes || 0}</span>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Cuentas activas</h4>
          {accounts.length === 0 ? (
            <p className="text-xs text-gray-400">Sin cuentas configuradas</p>
          ) : (
            accounts.filter(a => a.activa).map(a => (
              <div key={a.id} className="flex justify-between items-center py-1 text-xs">
                <span className="text-gray-700 truncate">{a.email}</span>
                <span className="text-gray-400">{a.envios_hoy}/{a.limite_diario}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════ TAB: Historial ══════════
function HistorialTab() {
  const { data, isLoading } = useQuery({ queryKey: ['email-history'], queryFn: () => emailApi.getHistory(100) });
  const emails = data?.data || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="card">
      {emails.length === 0 ? (
        <div className="text-center py-12">
          <HiOutlineMail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay emails enviados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Para</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prospecto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Asunto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Abierto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Clicks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emails.map((email: any) => (
                <tr key={email.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{email.para_email}</td>
                  <td className="px-4 py-3 text-sm text-primary-600">{email.prospect_nombre || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{email.asunto}</td>
                  <td className="px-4 py-3 text-center">
                    {email.abierto ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <HiOutlineEye className="w-3 h-3" /> {email.num_aperturas}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {email.clicks > 0 ? (
                      <span className="text-blue-600 font-medium">{email.clicks}</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(email.enviado_at).toLocaleString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════ TAB: Plantillas ══════════
function PlantillasTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['email-templates'], queryFn: emailApi.getTemplates });
  const templates: EmailTemplate[] = data?.data || [];
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ nombre: '', asunto: '', cuerpo_html: '', categoria: 'general' });

  const createMutation = useMutation({
    mutationFn: () => emailApi.createTemplate(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla creada');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => emailApi.updateTemplate(editing!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla actualizada');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Plantilla eliminada');
    },
  });

  const resetForm = () => {
    setForm({ nombre: '', asunto: '', cuerpo_html: '', categoria: 'general' });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (t: EmailTemplate) => {
    setEditing(t);
    setForm({ nombre: t.nombre, asunto: t.asunto, cuerpo_html: t.cuerpo_html, categoria: t.categoria });
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{templates.length} plantillas</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-1 text-sm">
          <HiOutlinePlus className="w-4 h-4" /> Nueva plantilla
        </button>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3 border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900">
            {editing ? 'Editar plantilla' : 'Nueva plantilla'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="input-field"
                placeholder="Nombre de la plantilla"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="input-field">
                <option value="general">General</option>
                <option value="primer_contacto">Primer contacto</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="oferta">Oferta</option>
                <option value="cierre">Cierre</option>
                <option value="reactivacion">Reactivacion</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Asunto</label>
            <input
              value={form.asunto}
              onChange={(e) => setForm({ ...form, asunto: e.target.value })}
              className="input-field"
              placeholder="Asunto del email"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cuerpo (HTML)</label>
            <textarea
              value={form.cuerpo_html}
              onChange={(e) => setForm({ ...form, cuerpo_html: e.target.value })}
              className="input-field min-h-[200px] font-mono text-sm"
              placeholder="<p>Hola {{nombre_contacto}},</p>"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span>Variables:</span>
            {['nombre_negocio', 'nombre_contacto', 'municipio', 'categoria', 'comercializadora',
              'gasto_mensual', 'ahorro_estimado', 'ahorro_porcentaje', 'fecha'].map(v => (
              <button
                key={v}
                onClick={() => setForm({ ...form, cuerpo_html: form.cuerpo_html + `{{${v}}}` })}
                className="px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="btn-secondary text-sm">Cancelar</button>
            <button
              onClick={() => editing ? updateMutation.mutate() : createMutation.mutate()}
              disabled={!form.nombre || !form.asunto || !form.cuerpo_html}
              className="btn-primary text-sm"
            >
              {editing ? 'Guardar cambios' : 'Crear plantilla'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <div key={t.id} className="card p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{t.nombre}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.categoria}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(t)} className="p-1 text-gray-400 hover:text-primary-600">
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (window.confirm('Eliminar plantilla?')) deleteMutation.mutate(t.id); }}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 truncate">{t.asunto}</p>
            <p className="text-xs text-gray-400">
              {new Date(t.created_at).toLocaleDateString('es-ES')}
            </p>
          </div>
        ))}
      </div>

      {templates.length === 0 && !showForm && (
        <div className="text-center py-12">
          <HiOutlineTemplate className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay plantillas creadas</p>
          <p className="text-xs text-gray-400 mt-1">Crea plantillas para enviar emails mas rapido</p>
        </div>
      )}
    </div>
  );
}

// ══════════ TAB: Campanas ══════════
function CampanasTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['email-campaigns'], queryFn: emailApi.getCampaigns });
  const { data: templatesData } = useQuery({ queryKey: ['email-templates'], queryFn: emailApi.getTemplates });
  const { data: accountsData } = useQuery({ queryKey: ['email-accounts'], queryFn: emailApi.getAccounts });

  const campaigns: EmailCampaign[] = data?.data || [];
  const templates: EmailTemplate[] = templatesData?.data || [];
  const accounts: EmailAccount[] = accountsData?.data || [];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '', template_id: '', asunto: '',
    filtros: { estado: '', zona_id: '', categoria: '', temperatura: '' },
  });

  const createMutation = useMutation({
    mutationFn: () => emailApi.createCampaign(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campana creada');
      setShowForm(false);
    },
  });

  const launchMutation = useMutation({
    mutationFn: ({ id, account_id }: { id: string; account_id: string }) => emailApi.launchCampaign(id, account_id),
    onSuccess: () => {
      toast.success('Campana lanzada!');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
    onError: () => toast.error('Error al lanzar campana'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campana eliminada');
    },
  });

  const handleLaunch = (campaignId: string) => {
    const activeAccount = accounts.find(a => a.activa);
    if (!activeAccount) {
      toast.error('No hay cuenta SMTP activa');
      return;
    }
    if (window.confirm('Lanzar campana? Los emails se enviaran en segundo plano.')) {
      launchMutation.mutate({ id: campaignId, account_id: activeAccount.id });
    }
  };

  const estadoColor: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-700',
    enviando: 'bg-blue-100 text-blue-700',
    completada: 'bg-green-100 text-green-700',
    pausada: 'bg-yellow-100 text-yellow-700',
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{campaigns.length} campanas</p>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1 text-sm">
          <HiOutlinePlus className="w-4 h-4" /> Nueva campana
        </button>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3 border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900">Nueva campana</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" placeholder="Nombre de la campana" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plantilla</label>
              <select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })} className="input-field">
                <option value="">Seleccionar...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Asunto (override)</label>
              <input value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} className="input-field" placeholder="Opcional" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Filtros de destinatarios</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={form.filtros.estado}
                onChange={(e) => setForm({ ...form, filtros: { ...form.filtros, estado: e.target.value } })}
                className="input-field text-sm"
              >
                <option value="">Cualquier estado</option>
                <option value="nuevo">Nuevo</option>
                <option value="contactado">Contactado</option>
                <option value="interesado">Interesado</option>
                <option value="negociando">Negociando</option>
              </select>
              <select
                value={form.filtros.temperatura}
                onChange={(e) => setForm({ ...form, filtros: { ...form.filtros, temperatura: e.target.value } })}
                className="input-field text-sm"
              >
                <option value="">Cualquier temp.</option>
                <option value="frio">Frio</option>
                <option value="tibio">Tibio</option>
                <option value="caliente">Caliente</option>
              </select>
              <input
                value={form.filtros.categoria}
                onChange={(e) => setForm({ ...form, filtros: { ...form.filtros, categoria: e.target.value } })}
                className="input-field text-sm"
                placeholder="Categoria"
              />
              <input
                value={form.filtros.zona_id}
                onChange={(e) => setForm({ ...form, filtros: { ...form.filtros, zona_id: e.target.value } })}
                className="input-field text-sm"
                placeholder="Zona ID"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.nombre || !form.template_id}
              className="btn-primary text-sm"
            >
              Crear campana
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900">{c.nombre}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor[c.estado] || 'bg-gray-100 text-gray-600'}`}>
                  {c.estado}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Plantilla: {c.template_nombre || '-'} · Destinatarios: {c.total_destinatarios}
              </p>
              {c.estado === 'completada' && (
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="text-green-600">Enviados: {c.enviados}</span>
                  <span className="text-purple-600">Abiertos: {c.abiertos}</span>
                  <span className="text-blue-600">Clicks: {c.clicks}</span>
                  <span className="text-red-600">Rebotes: {c.rebotes}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {c.estado === 'borrador' && (
                <button onClick={() => handleLaunch(c.id)} className="btn-primary text-sm flex items-center gap-1">
                  <HiOutlinePaperAirplane className="w-4 h-4" /> Lanzar
                </button>
              )}
              <button
                onClick={() => { if (window.confirm('Eliminar campana?')) deleteMutation.mutate(c.id); }}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && !showForm && (
        <div className="text-center py-12">
          <HiOutlineSpeakerphone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay campanas creadas</p>
        </div>
      )}
    </div>
  );
}

// ══════════ TAB: Secuencias (Drip) ══════════
function SecuenciasTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['email-secuencias'], queryFn: emailApi.getSecuencias });
  const secuencias: EmailSecuencia[] = data?.data || [];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });

  const createMutation = useMutation({
    mutationFn: () => emailApi.createSecuencia(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-secuencias'] });
      toast.success('Secuencia creada');
      setShowForm(false);
      setForm({ nombre: '', descripcion: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailApi.deleteSecuencia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-secuencias'] });
      toast.success('Secuencia eliminada');
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{secuencias.length} secuencias</p>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1 text-sm">
          <HiOutlinePlus className="w-4 h-4" /> Nueva secuencia
        </button>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3 border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900">Nueva secuencia de emails</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" placeholder="Ej: Seguimiento primer contacto" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descripcion</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-field" rows={2} placeholder="Descripcion de la secuencia" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.nombre} className="btn-primary text-sm">Crear</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {secuencias.map((s) => (
          <div key={s.id} className="card p-4 flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${s.activa ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{s.nombre}</h4>
              <p className="text-xs text-gray-500">
                {s.num_pasos || 0} pasos · {s.inscritos_activos || 0} inscritos activos
              </p>
              {s.descripcion && <p className="text-xs text-gray-400 mt-1">{s.descripcion}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { if (window.confirm('Eliminar secuencia?')) deleteMutation.mutate(s.id); }}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {secuencias.length === 0 && !showForm && (
        <div className="text-center py-12">
          <HiOutlineRefresh className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay secuencias creadas</p>
          <p className="text-xs text-gray-400 mt-1">Las secuencias envian emails automaticos en intervalos definidos</p>
        </div>
      )}
    </div>
  );
}

// ══════════ TAB: Cuentas SMTP ══════════
function CuentasTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['email-accounts'], queryFn: emailApi.getAccounts });
  const accounts: EmailAccount[] = data?.data || [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmailAccount | null>(null);
  const [form, setForm] = useState({
    nombre: '', email: '', smtp_host: 'smtp.gmail.com', smtp_port: 587,
    smtp_user: '', smtp_pass: '', from_name: '', limite_diario: 200,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const createMutation = useMutation({
    mutationFn: () => emailApi.createAccount(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast.success('Cuenta creada');
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al crear cuenta'),
  });

  const updateMutation = useMutation({
    mutationFn: () => emailApi.updateAccount(editing!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast.success('Cuenta actualizada');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast.success('Cuenta eliminada');
    },
  });

  const resetForm = () => {
    setForm({ nombre: '', email: '', smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_user: '', smtp_pass: '', from_name: '', limite_diario: 200 });
    setEditing(null);
    setShowForm(false);
    setTestResult(null);
  };

  const startEdit = (a: EmailAccount) => {
    setEditing(a);
    setForm({
      nombre: a.nombre, email: a.email, smtp_host: a.smtp_host, smtp_port: a.smtp_port,
      smtp_user: a.smtp_user, smtp_pass: '', from_name: a.from_name || '', limite_diario: a.limite_diario,
    });
    setShowForm(true);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await emailApi.testAccount({
        smtp_host: form.smtp_host, smtp_port: form.smtp_port,
        smtp_user: form.smtp_user, smtp_pass: form.smtp_pass,
      });
      setTestResult(result.data.connected);
      toast[result.data.connected ? 'success' : 'error'](
        result.data.connected ? 'Conexion exitosa!' : 'No se pudo conectar'
      );
    } catch {
      setTestResult(false);
      toast.error('Error al probar conexion');
    }
    setTesting(false);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{accounts.length} cuentas configuradas</p>
          <p className="text-xs text-gray-400">Para Gmail: usa una &quot;contrasena de aplicacion&quot; de tu cuenta Google</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-1 text-sm">
          <HiOutlinePlus className="w-4 h-4" /> Nueva cuenta
        </button>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3 border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900">
            {editing ? 'Editar cuenta SMTP' : 'Nueva cuenta SMTP'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" placeholder="Mi cuenta comercial" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="tu-email@gmail.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Servidor SMTP</label>
              <input value={form.smtp_host} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })} className="input-field" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Puerto</label>
              <input type="number" value={form.smtp_port} onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Limite diario</label>
              <input type="number" value={form.limite_diario} onChange={(e) => setForm({ ...form, limite_diario: Number(e.target.value) })} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Usuario SMTP</label>
              <input value={form.smtp_user} onChange={(e) => setForm({ ...form, smtp_user: e.target.value })} className="input-field" placeholder="tu-email@gmail.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contrasena SMTP</label>
              <input type="password" value={form.smtp_pass} onChange={(e) => setForm({ ...form, smtp_pass: e.target.value })} className="input-field" placeholder={editing ? '(dejar vacio para no cambiar)' : 'Contrasena de app'} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre remitente</label>
            <input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} className="input-field" placeholder="Juan Garcia - Somos Sinergia" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={handleTest} disabled={testing || !form.smtp_host || !form.smtp_user || !form.smtp_pass} className="btn-secondary text-sm flex items-center gap-1">
                {testing ? <span className="animate-spin w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full" /> : null}
                Probar conexion
              </button>
              {testResult !== null && (
                <span className={`flex items-center gap-1 text-sm ${testResult ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineX className="w-4 h-4" />}
                  {testResult ? 'Conectado' : 'Error'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={resetForm} className="btn-secondary text-sm">Cancelar</button>
              <button
                onClick={() => editing ? updateMutation.mutate() : createMutation.mutate()}
                disabled={!form.nombre || !form.email || !form.smtp_host || !form.smtp_user || (!editing && !form.smtp_pass)}
                className="btn-primary text-sm"
              >
                {editing ? 'Guardar' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {accounts.map((a) => (
          <div key={a.id} className="card p-4 flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${a.activa ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{a.nombre}</h4>
                <span className="text-xs text-gray-500">{a.email}</span>
              </div>
              <p className="text-xs text-gray-400">
                {a.smtp_host}:{a.smtp_port} · Enviados hoy: {a.envios_hoy}/{a.limite_diario}
                {a.ultimo_envio && ` · Ultimo: ${new Date(a.ultimo_envio).toLocaleString('es-ES')}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(a)} className="p-2 text-gray-400 hover:text-primary-600">
                <HiOutlinePencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => { if (window.confirm('Eliminar cuenta?')) deleteMutation.mutate(a.id); }}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && !showForm && (
        <div className="text-center py-12">
          <HiOutlineCog className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay cuentas SMTP configuradas</p>
          <p className="text-xs text-gray-400 mt-1">Necesitas al menos una cuenta para enviar emails</p>
        </div>
      )}
    </div>
  );
}

// ── Loading helper ──
function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );
}
