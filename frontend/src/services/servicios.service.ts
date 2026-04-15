import api from './api';

export interface ProspectServicio {
  id: string;
  prospect_id: string;
  servicio: string;
  estado: string;
  proveedor_actual: string;
  gasto_actual_eur: number | null;
  precio_ofertado_eur: number | null;
  ahorro_estimado_eur: number | null;
  fecha_contratacion: string | null;
  fecha_vencimiento: string | null;
  datos: Record<string, any>;
  notas: string;
  created_at: string;
}

export type ServicioTipo = 'energia' | 'telecomunicaciones' | 'alarmas' | 'seguros' | 'agentes_ia' | 'web' | 'crm' | 'aplicaciones';

export interface ServicioConfig {
  id: ServicioTipo;
  label: string;
  icon: string;
  color: string;
  bg: string;
  campos: { key: string; label: string; type: string; placeholder?: string; options?: string[] }[];
}

export const SERVICIOS_CONFIG: ServicioConfig[] = [
  {
    id: 'energia',
    label: 'Energia',
    icon: '⚡',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    campos: [
      { key: 'comercializadora', label: 'Comercializadora', type: 'text', placeholder: 'Iberdrola, Endesa...' },
      { key: 'tarifa', label: 'Tarifa', type: 'select', options: ['2.0TD', '3.0TD', '3.1TD', '6.1TD'] },
      { key: 'potencia_kw', label: 'Potencia (kW)', type: 'number' },
      { key: 'consumo_kwh', label: 'Consumo anual (kWh)', type: 'number' },
    ],
  },
  {
    id: 'telecomunicaciones',
    label: 'Telecomunicaciones',
    icon: '📡',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    campos: [
      { key: 'operador', label: 'Operador actual', type: 'text', placeholder: 'Movistar, Vodafone, Orange...' },
      { key: 'tipo_servicio', label: 'Tipo', type: 'select', options: ['Fibra', 'Movil', 'Fibra + Movil', 'Centralita', 'SIP Trunk'] },
      { key: 'velocidad_mb', label: 'Velocidad fibra (Mb)', type: 'select', options: ['100', '300', '600', '1000'] },
      { key: 'num_lineas', label: 'Lineas moviles', type: 'number' },
      { key: 'num_fijos', label: 'Lineas fijas', type: 'number' },
    ],
  },
  {
    id: 'alarmas',
    label: 'Alarmas',
    icon: '🔒',
    color: 'text-red-700',
    bg: 'bg-red-50',
    campos: [
      { key: 'proveedor', label: 'Proveedor actual', type: 'text', placeholder: 'Securitas, Prosegur, Tyco...' },
      { key: 'tipo_sistema', label: 'Tipo', type: 'select', options: ['Alarma basica', 'Alarma + Camaras', 'CCTV', 'Control accesos', 'Anti-incendios'] },
      { key: 'num_camaras', label: 'Camaras', type: 'number' },
      { key: 'detectores', label: 'Detectores', type: 'number' },
      { key: 'conexion_cra', label: 'CRA', type: 'select', options: ['Si', 'No'] },
    ],
  },
  {
    id: 'seguros',
    label: 'Seguros',
    icon: '🛡️',
    color: 'text-green-700',
    bg: 'bg-green-50',
    campos: [
      { key: 'aseguradora', label: 'Aseguradora actual', type: 'text', placeholder: 'Mapfre, AXA, Zurich...' },
      { key: 'tipo_seguro', label: 'Tipo', type: 'select', options: ['Multirriesgo local', 'Responsabilidad civil', 'Vehiculos', 'Salud empleados', 'Vida', 'Cyber'] },
      { key: 'coberturas', label: 'Coberturas principales', type: 'text' },
      { key: 'fecha_renovacion', label: 'Fecha renovacion', type: 'date' },
    ],
  },
  {
    id: 'agentes_ia',
    label: 'Agentes IA',
    icon: '🤖',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    campos: [
      { key: 'tipo_agente', label: 'Tipo', type: 'select', options: ['Chatbot web', 'Asistente telefono', 'Automatizacion tareas', 'Atencion al cliente', 'Ventas automatizadas', 'Gestion citas'] },
      { key: 'plataforma', label: 'Plataforma actual', type: 'text', placeholder: 'Ninguna, ChatGPT, otro...' },
      { key: 'idiomas', label: 'Idiomas necesarios', type: 'select', options: ['Espanol', 'Espanol + Ingles', 'Multiidioma'] },
      { key: 'volumen_consultas', label: 'Consultas/mes estimadas', type: 'number' },
      { key: 'integraciones', label: 'Integraciones', type: 'text', placeholder: 'WhatsApp, web, telefono...' },
    ],
  },
  {
    id: 'web',
    label: 'Pagina Web',
    icon: '🌐',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    campos: [
      { key: 'tiene_web', label: 'Tiene web?', type: 'select', options: ['Si', 'No', 'Desactualizada'] },
      { key: 'url_actual', label: 'URL actual', type: 'text', placeholder: 'www.ejemplo.es' },
      { key: 'tipo_web', label: 'Tipo necesario', type: 'select', options: ['Corporativa', 'E-commerce', 'Landing page', 'Blog', 'Reservas online', 'Carta digital'] },
      { key: 'hosting', label: 'Hosting', type: 'select', options: ['Incluido', 'Propio', 'Por definir'] },
      { key: 'dominio', label: 'Dominio', type: 'text' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: '📊',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    campos: [
      { key: 'usa_crm', label: 'Usa CRM?', type: 'select', options: ['No', 'Excel/hojas', 'CRM basico', 'CRM avanzado'] },
      { key: 'crm_actual', label: 'CRM actual', type: 'text', placeholder: 'Ninguno, Excel, HubSpot...' },
      { key: 'num_usuarios', label: 'Usuarios', type: 'number' },
      { key: 'necesidades', label: 'Necesidades', type: 'select', options: ['Gestion clientes', 'Facturacion', 'Agenda', 'Marketing', 'Completo'] },
    ],
  },
  {
    id: 'aplicaciones',
    label: 'Aplicaciones',
    icon: '📱',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    campos: [
      { key: 'tipo_app', label: 'Tipo', type: 'select', options: ['App movil', 'App web', 'PWA', 'Intranet', 'Gestion interna', 'App clientes'] },
      { key: 'plataforma', label: 'Plataforma', type: 'select', options: ['iOS', 'Android', 'Ambas', 'Web'] },
      { key: 'funcionalidades', label: 'Funcionalidades clave', type: 'text', placeholder: 'Reservas, pedidos, fidelizacion...' },
      { key: 'usuarios_estimados', label: 'Usuarios estimados', type: 'number' },
    ],
  },
];

export const SERVICIO_ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'text-gray-600', bg: 'bg-gray-100' },
  { value: 'interesado', label: 'Interesado', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  { value: 'oferta_enviada', label: 'Oferta enviada', color: 'text-orange-700', bg: 'bg-orange-100' },
  { value: 'negociando', label: 'Negociando', color: 'text-purple-700', bg: 'bg-purple-100' },
  { value: 'contratado', label: 'Contratado', color: 'text-green-700', bg: 'bg-green-100' },
  { value: 'rechazado', label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100' },
  { value: 'no_interesa', label: 'No interesa', color: 'text-slate-600', bg: 'bg-slate-100' },
];

export const serviciosApi = {
  getByProspect: async (prospectId: string) => (await api.get(`/servicios/prospect/${prospectId}`)).data,
  upsert: async (data: Partial<ProspectServicio>) => (await api.post('/servicios', data)).data,
  update: async (id: string, data: Partial<ProspectServicio>) => (await api.put(`/servicios/${id}`, data)).data,
  delete: async (id: string) => (await api.delete(`/servicios/${id}`)).data,
  getStats: async () => (await api.get('/servicios/stats')).data,
  getAll: async (filters: { servicio?: string; estado?: string; search?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) params.append(key, String(value));
    });
    return (await api.get(`/servicios/all?${params.toString()}`)).data;
  },
  getGlobalStats: async () => (await api.get('/servicios/global-stats')).data,
};
