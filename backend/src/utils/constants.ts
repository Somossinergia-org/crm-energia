// Roles del sistema
export const ROLES = {
  ADMIN: 'admin',
  COMERCIAL: 'comercial',
  SUPERVISOR: 'supervisor',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Estados del prospecto
export const PROSPECT_STATES = [
  'pendiente',
  'llamado',
  'contactado',
  'interesado',
  'oferta_enviada',
  'negociacion',
  'contrato_firmado',
  'rechazado',
  'volver_llamar',
  'perdido',
] as const;

export type ProspectState = (typeof PROSPECT_STATES)[number];

// Prioridades
export const PRIORITIES = ['alta', 'media', 'baja'] as const;
export type Priority = (typeof PRIORITIES)[number];

// Temperaturas
export const TEMPERATURES = ['frio', 'tibio', 'caliente'] as const;
export type Temperature = (typeof TEMPERATURES)[number];

// Tarifas eléctricas
export const TARIFAS = ['2.0TD', '3.0TD', '3.1TD', '6.1TD', '6.2TD'] as const;
export type Tarifa = (typeof TARIFAS)[number];

// Categorías de negocio
export const CATEGORIAS = [
  'restaurante', 'taller', 'peluqueria', 'hotel',
  'supermercado', 'farmacia', 'dental', 'gym',
  'bar', 'cafeteria', 'panaderia', 'ferreteria',
  'tienda_ropa', 'lavanderia', 'oficina',
  'academia', 'autoescuela', 'barberia', 'clinica_salud',
  'estetica_spa', 'fisioterapia', 'floristeria', 'gestoria',
  'hamburgueseria', 'informatica', 'inmobiliaria', 'optica',
  'pizzeria', 'seguros', 'veterinaria', 'deporte',
  'electrodomesticos', 'otro',
] as const;

// Tipos de contacto
export const CONTACT_TYPES = [
  'llamada', 'visita_presencial', 'whatsapp',
  'email_enviado', 'email_recibido', 'nota_interna',
  'cambio_estado', 'oferta_enviada', 'contrato',
] as const;

// Resultados de contacto
export const CONTACT_RESULTS = [
  'positivo', 'neutro', 'negativo', 'no_contesto', 'buzon',
] as const;

// Fuentes de prospectos
export const SOURCES = [
  'manual', 'csv_importado', 'google_places', 'referido',
] as const;
