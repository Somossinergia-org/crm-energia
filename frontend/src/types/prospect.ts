export interface Prospect {
  id: string;
  nombre_negocio: string;
  nombre_contacto: string;
  categoria: string;
  subcategoria: string;
  zona_id: string | null;
  codigo_cnae: string;
  telefono_fijo: string;
  telefono_movil: string;
  whatsapp: string;
  email_principal: string;
  email_secundario: string;
  web: string;
  instagram: string;
  facebook: string;
  direccion_completa: string;
  codigo_postal: string;
  municipio: string;
  provincia: string;
  coordenadas_lat: number | null;
  coordenadas_lng: number | null;
  comercializadora_actual: string;
  tarifa_actual: string;
  potencia_p1_kw: number | null;
  potencia_p2_kw: number | null;
  potencia_p3_kw: number | null;
  consumo_anual_kwh: number | null;
  gasto_mensual_estimado_eur: number | null;
  cups: string;
  fecha_vencimiento_contrato: string | null;
  ahorro_estimado_eur: number | null;
  ahorro_porcentaje: number | null;
  estado: ProspectState;
  prioridad: 'alta' | 'media' | 'baja';
  temperatura: 'frio' | 'tibio' | 'caliente';
  asignado_a: string | null;
  fecha_primer_contacto: string | null;
  fecha_ultimo_contacto: string | null;
  fecha_proximo_contacto: string | null;
  numero_intentos_contacto: number;
  num_emails_enviados: number;
  num_emails_abiertos: number;
  num_emails_clicked: number;
  oferta_generada: boolean;
  oferta_url: string;
  oferta_enviada_en: string | null;
  oferta_vista_en: string | null;
  oferta_aceptada_en: string | null;
  precio_ofertado_eur: number | null;
  margen_estimado_eur: number | null;
  fuente: string;
  rating_google: number | null;
  num_reviews_google: number;
  etiquetas: string[];
  notas_internas: string;
  created_at: string;
  updated_at: string;
  fecha_conversion: string | null;
  created_by: string | null;
  // Joins
  zona_nombre?: string;
  zona_color?: string;
  asignado_nombre?: string;
}

export type ProspectState =
  | 'pendiente' | 'llamado' | 'contactado' | 'interesado'
  | 'oferta_enviada' | 'negociacion' | 'contrato_firmado'
  | 'rechazado' | 'volver_llamar' | 'perdido';

export interface ProspectFilters {
  estado?: string;
  prioridad?: string;
  temperatura?: string;
  categoria?: string;
  zona_id?: string;
  asignado_a?: string;
  provincia?: string;
  fuente?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface ProspectsResponse {
  success: boolean;
  data: Prospect[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Zone {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activa: boolean;
}

// Constantes para el UI
export const ESTADO_CONFIG: Record<ProspectState, { label: string; color: string; bg: string }> = {
  pendiente:        { label: 'Pendiente',        color: 'text-gray-700',   bg: 'bg-gray-100' },
  llamado:          { label: 'Llamado',          color: 'text-blue-700',   bg: 'bg-blue-100' },
  contactado:       { label: 'Contactado',       color: 'text-cyan-700',   bg: 'bg-cyan-100' },
  interesado:       { label: 'Interesado',       color: 'text-yellow-700', bg: 'bg-yellow-100' },
  oferta_enviada:   { label: 'Oferta enviada',   color: 'text-orange-700', bg: 'bg-orange-100' },
  negociacion:      { label: 'Negociacion',      color: 'text-purple-700', bg: 'bg-purple-100' },
  contrato_firmado: { label: 'Contrato',         color: 'text-green-700',  bg: 'bg-green-100' },
  rechazado:        { label: 'Rechazado',        color: 'text-red-700',    bg: 'bg-red-100' },
  volver_llamar:    { label: 'Volver a llamar',  color: 'text-amber-700',  bg: 'bg-amber-100' },
  perdido:          { label: 'Perdido',          color: 'text-slate-700',  bg: 'bg-slate-200' },
};

export const PRIORIDAD_CONFIG = {
  alta:  { label: 'Alta',  color: 'text-red-700',    bg: 'bg-red-100' },
  media: { label: 'Media', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  baja:  { label: 'Baja',  color: 'text-green-700',  bg: 'bg-green-100' },
};

export const TEMPERATURA_CONFIG = {
  frio:     { label: 'Frio',     icon: '❄️' },
  tibio:    { label: 'Tibio',    icon: '🌤️' },
  caliente: { label: 'Caliente', icon: '🔥' },
};

export const CATEGORIAS = [
  { value: 'academia', label: 'Academia' },
  { value: 'autoescuela', label: 'Autoescuela' },
  { value: 'bar', label: 'Bar / Tapas' },
  { value: 'barberia', label: 'Barberia' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'clinica_salud', label: 'Clinica / Salud' },
  { value: 'dental', label: 'Clinica dental' },
  { value: 'deporte', label: 'Deporte' },
  { value: 'electrodomesticos', label: 'Electrodomesticos' },
  { value: 'estetica_spa', label: 'Estetica / Spa' },
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'ferreteria', label: 'Ferreteria' },
  { value: 'fisioterapia', label: 'Fisioterapia' },
  { value: 'floristeria', label: 'Floristeria' },
  { value: 'gestoria', label: 'Gestoria' },
  { value: 'gym', label: 'Gimnasio' },
  { value: 'hamburgueseria', label: 'Hamburgueseria' },
  { value: 'hotel', label: 'Hotel / Hostal' },
  { value: 'informatica', label: 'Informatica' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'lavanderia', label: 'Lavanderia' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'optica', label: 'Optica' },
  { value: 'panaderia', label: 'Panaderia' },
  { value: 'peluqueria', label: 'Peluqueria' },
  { value: 'pizzeria', label: 'Pizzeria' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'taller', label: 'Taller mecanico' },
  { value: 'tienda_ropa', label: 'Tienda de ropa' },
  { value: 'veterinaria', label: 'Veterinaria' },
  { value: 'otro', label: 'Otro' },
];

export const ESTADOS: ProspectState[] = [
  'pendiente', 'llamado', 'contactado', 'interesado',
  'oferta_enviada', 'negociacion', 'contrato_firmado',
  'rechazado', 'volver_llamar', 'perdido',
];

export const PIPELINE_STATES: ProspectState[] = [
  'pendiente', 'llamado', 'contactado', 'interesado',
  'oferta_enviada', 'negociacion', 'volver_llamar',
];

export const CLOSED_STATES: ProspectState[] = [
  'contrato_firmado', 'rechazado', 'perdido',
];
