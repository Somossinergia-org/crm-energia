import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Prospect, ESTADO_CONFIG, CATEGORIAS } from '../../types/prospect';
import { Zone } from '../../types/prospect';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUser,
  HiOutlineGlobe,
  HiOutlineLocationMarker,
  HiOutlineLightningBolt,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineCurrencyEuro,
} from 'react-icons/hi';

const prospectSchema = z.object({
  // Negocio
  nombre_negocio: z.string().min(1, 'El nombre del negocio es obligatorio'),
  categoria: z.string().optional().default('otro'),
  subcategoria: z.string().optional().default(''),
  zona_id: z.string().optional().nullable(),
  rating_google: z.coerce.number().optional().nullable(),
  // Contacto persona
  nombre_contacto: z.string().optional().default(''),
  telefono_movil: z.string().optional().default(''),
  telefono_fijo: z.string().optional().default(''),
  whatsapp: z.string().optional().default(''),
  email_principal: z.string().optional().default(''),
  email_secundario: z.string().optional().default(''),
  // Web y redes
  web: z.string().optional().default(''),
  instagram: z.string().optional().default(''),
  facebook: z.string().optional().default(''),
  // Ubicacion
  direccion_completa: z.string().optional().default(''),
  codigo_postal: z.string().optional().default(''),
  municipio: z.string().optional().default(''),
  provincia: z.string().optional().default(''),
  // Energia
  comercializadora_actual: z.string().optional().default(''),
  tarifa_actual: z.string().optional().default(''),
  potencia_p1_kw: z.coerce.number().optional().nullable(),
  potencia_p2_kw: z.coerce.number().optional().nullable(),
  potencia_p3_kw: z.coerce.number().optional().nullable(),
  consumo_anual_kwh: z.coerce.number().optional().nullable(),
  gasto_mensual_estimado_eur: z.coerce.number().optional().nullable(),
  cups: z.string().optional().default(''),
  fecha_vencimiento_contrato: z.string().optional().default(''),
  // Ahorro / oferta
  ahorro_estimado_eur: z.coerce.number().optional().nullable(),
  ahorro_porcentaje: z.coerce.number().optional().nullable(),
  precio_ofertado_eur: z.coerce.number().optional().nullable(),
  margen_estimado_eur: z.coerce.number().optional().nullable(),
  // Seguimiento
  estado: z.string().optional().default('pendiente'),
  prioridad: z.string().optional().default('media'),
  temperatura: z.string().optional().default('frio'),
  fuente: z.string().optional().default('manual'),
  fecha_proximo_contacto: z.string().optional().default(''),
  // Notas
  notas_internas: z.string().optional().default(''),
});

type FormData = z.infer<typeof prospectSchema>;

interface Props {
  prospect?: Prospect | null;
  zones: Zone[];
  onSave: (data: Partial<Prospect>) => void;
  onClose: () => void;
}

type Section = 'negocio' | 'contacto' | 'ubicacion' | 'energia' | 'oferta' | 'seguimiento' | 'notas';

const SECTIONS: { id: Section; label: string; icon: typeof HiOutlineOfficeBuilding }[] = [
  { id: 'negocio', label: 'Negocio', icon: HiOutlineOfficeBuilding },
  { id: 'contacto', label: 'Contacto', icon: HiOutlineUser },
  { id: 'ubicacion', label: 'Ubicacion', icon: HiOutlineLocationMarker },
  { id: 'energia', label: 'Energia', icon: HiOutlineLightningBolt },
  { id: 'oferta', label: 'Oferta/Ahorro', icon: HiOutlineCurrencyEuro },
  { id: 'seguimiento', label: 'Seguimiento', icon: HiOutlineClipboardList },
  { id: 'notas', label: 'Notas', icon: HiOutlineDocumentText },
];

const COMERCIALIZADORAS = [
  'Iberdrola', 'Endesa', 'Naturgy', 'Repsol', 'TotalEnergies', 'EDP',
  'Holaluz', 'Lucera', 'Aldro', 'Podo', 'Octopus Energy', 'Factor Energia',
  'Engie', 'Axpo', 'Audax', 'Nexus Energia', 'Som Energia', 'Otra',
];

const FUENTES = [
  { value: 'manual', label: 'Creacion manual' },
  { value: 'csv_importado', label: 'CSV importado' },
  { value: 'web', label: 'Formulario web' },
  { value: 'referido', label: 'Referido' },
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'puerta_fria', label: 'Puerta fria' },
  { value: 'llamada_entrante', label: 'Llamada entrante' },
  { value: 'redes_sociales', label: 'Redes sociales' },
];

const PROVINCIAS_ESP = [
  'A Coruna', 'Alava', 'Albacete', 'Alicante', 'Almeria', 'Asturias', 'Avila',
  'Badajoz', 'Barcelona', 'Bizkaia', 'Burgos', 'Caceres', 'Cadiz', 'Cantabria',
  'Castellon', 'Ceuta', 'Ciudad Real', 'Cordoba', 'Cuenca', 'Gipuzkoa', 'Girona',
  'Granada', 'Guadalajara', 'Huelva', 'Huesca', 'Illes Balears', 'Jaen',
  'La Rioja', 'Las Palmas', 'Leon', 'Lleida', 'Lugo', 'Madrid', 'Malaga',
  'Melilla', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra',
  'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria',
  'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Zamora', 'Zaragoza',
];

export default function ProspectModal({ prospect, zones, onSave, onClose }: Props) {
  const isEdit = !!prospect;
  const [activeSection, setActiveSection] = useState<Section>('negocio');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(prospectSchema),
    defaultValues: prospect ? {
      nombre_negocio: prospect.nombre_negocio || '',
      nombre_contacto: prospect.nombre_contacto || '',
      categoria: prospect.categoria || 'otro',
      subcategoria: prospect.subcategoria || '',
      zona_id: prospect.zona_id,
      rating_google: prospect.rating_google,
      telefono_movil: prospect.telefono_movil || '',
      telefono_fijo: prospect.telefono_fijo || '',
      whatsapp: prospect.whatsapp || '',
      email_principal: prospect.email_principal || '',
      email_secundario: prospect.email_secundario || '',
      web: prospect.web || '',
      instagram: prospect.instagram || '',
      facebook: prospect.facebook || '',
      direccion_completa: prospect.direccion_completa || '',
      codigo_postal: prospect.codigo_postal || '',
      municipio: prospect.municipio || '',
      provincia: prospect.provincia || '',
      comercializadora_actual: prospect.comercializadora_actual || '',
      tarifa_actual: prospect.tarifa_actual || '',
      potencia_p1_kw: prospect.potencia_p1_kw,
      potencia_p2_kw: prospect.potencia_p2_kw,
      potencia_p3_kw: prospect.potencia_p3_kw,
      consumo_anual_kwh: prospect.consumo_anual_kwh,
      gasto_mensual_estimado_eur: prospect.gasto_mensual_estimado_eur,
      cups: prospect.cups || '',
      fecha_vencimiento_contrato: prospect.fecha_vencimiento_contrato?.split('T')[0] || '',
      ahorro_estimado_eur: prospect.ahorro_estimado_eur,
      ahorro_porcentaje: prospect.ahorro_porcentaje,
      precio_ofertado_eur: prospect.precio_ofertado_eur,
      margen_estimado_eur: prospect.margen_estimado_eur,
      estado: prospect.estado || 'pendiente',
      prioridad: prospect.prioridad || 'media',
      temperatura: prospect.temperatura || 'frio',
      fuente: prospect.fuente || 'manual',
      fecha_proximo_contacto: prospect.fecha_proximo_contacto?.split('T')[0] || '',
      notas_internas: prospect.notas_internas || '',
    } : {
      categoria: 'otro',
      estado: 'pendiente',
      prioridad: 'media',
      temperatura: 'frio',
      fuente: 'manual',
    },
  });

  const onSubmit = (data: FormData) => {
    // Limpiar campos vacios para no enviar strings vacias
    const cleaned: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== '' && val !== null && val !== undefined) {
        cleaned[key] = val;
      }
    }
    onSave(cleaned as Partial<Prospect>);
  };

  const labelClass = "block text-xs font-medium text-gray-500 mb-1";
  const inputClass = "input-field text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Editar negocio' : 'Nuevo negocio'}
            </h2>
            {isEdit && (
              <p className="text-xs text-gray-400 mt-0.5">{prospect.nombre_negocio}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar navegacion */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 py-3 shrink-0 hidden sm:block overflow-y-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  activeSection === s.id
                    ? 'bg-primary-50 text-primary-700 font-medium border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>

          {/* Mobile section tabs */}
          <div className="sm:hidden border-b border-gray-200 overflow-x-auto shrink-0">
            <div className="flex">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 ${
                    activeSection === s.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form content */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── NEGOCIO ── */}
              {activeSection === 'negocio' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineOfficeBuilding className="w-4 h-4 text-primary-600" />
                    Datos del negocio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Nombre del negocio *</label>
                      <input {...register('nombre_negocio')} className={inputClass} placeholder="Ej: Bar Manolo, Clinica Dental Norte..." />
                      {errors.nombre_negocio && <p className="text-xs text-red-500 mt-1">{errors.nombre_negocio.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Categoria</label>
                      <select {...register('categoria')} className={inputClass}>
                        {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Subcategoria</label>
                      <input {...register('subcategoria')} className={inputClass} placeholder="Ej: Tapas, Comida rapida..." />
                    </div>
                    <div>
                      <label className={labelClass}>Zona comercial</label>
                      <select {...register('zona_id')} className={inputClass}>
                        <option value="">Sin zona asignada</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Rating Google</label>
                      <input {...register('rating_google')} type="number" step="0.1" min="0" max="5" className={inputClass} placeholder="Ej: 4.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── CONTACTO ── */}
              {activeSection === 'contacto' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineUser className="w-4 h-4 text-primary-600" />
                    Persona de contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Nombre (dueno/gerente/encargado)</label>
                      <input {...register('nombre_contacto')} className={inputClass} placeholder="Ej: Juan Garcia Lopez" />
                    </div>
                    <div>
                      <label className={labelClass}>Telefono movil</label>
                      <input {...register('telefono_movil')} className={inputClass} placeholder="612 345 678" />
                    </div>
                    <div>
                      <label className={labelClass}>Telefono fijo</label>
                      <input {...register('telefono_fijo')} className={inputClass} placeholder="965 123 456" />
                    </div>
                    <div>
                      <label className={labelClass}>WhatsApp (si diferente al movil)</label>
                      <input {...register('whatsapp')} className={inputClass} placeholder="Dejar vacio si es el mismo que movil" />
                    </div>
                    <div>
                      <label className={labelClass}>Email principal</label>
                      <input {...register('email_principal')} type="email" className={inputClass} placeholder="negocio@email.com" />
                    </div>
                    <div>
                      <label className={labelClass}>Email secundario</label>
                      <input {...register('email_secundario')} type="email" className={inputClass} placeholder="Otro email de contacto" />
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 pt-3">
                    <HiOutlineGlobe className="w-4 h-4 text-primary-600" />
                    Web y redes sociales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Pagina web</label>
                      <input {...register('web')} className={inputClass} placeholder="www.ejemplo.es" />
                    </div>
                    <div>
                      <label className={labelClass}>Instagram</label>
                      <input {...register('instagram')} className={inputClass} placeholder="@usuario" />
                    </div>
                    <div>
                      <label className={labelClass}>Facebook</label>
                      <input {...register('facebook')} className={inputClass} placeholder="URL o nombre de pagina" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── UBICACION ── */}
              {activeSection === 'ubicacion' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineLocationMarker className="w-4 h-4 text-primary-600" />
                    Ubicacion del negocio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Direccion completa</label>
                      <input {...register('direccion_completa')} className={inputClass} placeholder="Calle, numero, piso..." />
                    </div>
                    <div>
                      <label className={labelClass}>Municipio / Ciudad</label>
                      <input {...register('municipio')} className={inputClass} placeholder="Ej: San Juan de Alicante" />
                    </div>
                    <div>
                      <label className={labelClass}>Provincia</label>
                      <select {...register('provincia')} className={inputClass}>
                        <option value="">Seleccionar provincia</option>
                        {PROVINCIAS_ESP.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Codigo postal</label>
                      <input {...register('codigo_postal')} className={inputClass} placeholder="03550" maxLength={5} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    La direccion se usara para planificar rutas de visitas en Google Maps.
                  </p>
                </div>
              )}

              {/* ── ENERGIA ── */}
              {activeSection === 'energia' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineLightningBolt className="w-4 h-4 text-amber-500" />
                    Datos del suministro actual
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Comercializadora actual</label>
                      <select {...register('comercializadora_actual')} className={inputClass}>
                        <option value="">Seleccionar o escribir</option>
                        {COMERCIALIZADORAS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Tarifa contratada</label>
                      <select {...register('tarifa_actual')} className={inputClass}>
                        <option value="">Seleccionar</option>
                        <option value="2.0TD">2.0TD (hasta 15kW)</option>
                        <option value="3.0TD">3.0TD (mas de 15kW)</option>
                        <option value="3.1TD">3.1TD</option>
                        <option value="6.1TD">6.1TD (alta tension)</option>
                        <option value="6.2TD">6.2TD</option>
                        <option value="6.3TD">6.3TD</option>
                        <option value="6.4TD">6.4TD</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>CUPS</label>
                      <input {...register('cups')} className={inputClass} placeholder="ES0021..." />
                      <p className="text-xs text-gray-400 mt-0.5">Codigo Universal del Punto de Suministro (en la factura)</p>
                    </div>
                    <div>
                      <label className={labelClass}>Vencimiento contrato</label>
                      <input {...register('fecha_vencimiento_contrato')} type="date" className={inputClass} />
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-600 pt-2">Potencias contratadas</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>P1 (kW)</label>
                      <input {...register('potencia_p1_kw')} type="number" step="0.01" className={inputClass} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={labelClass}>P2 (kW)</label>
                      <input {...register('potencia_p2_kw')} type="number" step="0.01" className={inputClass} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={labelClass}>P3 (kW)</label>
                      <input {...register('potencia_p3_kw')} type="number" step="0.01" className={inputClass} placeholder="0.00" />
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-600 pt-2">Consumo y gasto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Consumo anual (kWh)</label>
                      <input {...register('consumo_anual_kwh')} type="number" className={inputClass} placeholder="Ej: 15000" />
                    </div>
                    <div>
                      <label className={labelClass}>Gasto mensual estimado (EUR)</label>
                      <input {...register('gasto_mensual_estimado_eur')} type="number" step="0.01" className={inputClass} placeholder="Ej: 350" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── OFERTA / AHORRO ── */}
              {activeSection === 'oferta' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineCurrencyEuro className="w-4 h-4 text-green-600" />
                    Propuesta y ahorro
                  </h3>
                  <p className="text-xs text-gray-500">
                    Datos de la oferta que se presenta al cliente. Estos valores se usan en las plantillas de email y en los reportes.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Ahorro estimado (EUR/ano)</label>
                      <input {...register('ahorro_estimado_eur')} type="number" step="0.01" className={inputClass} placeholder="Ej: 1200" />
                    </div>
                    <div>
                      <label className={labelClass}>Ahorro porcentaje (%)</label>
                      <input {...register('ahorro_porcentaje')} type="number" step="0.1" min="0" max="100" className={inputClass} placeholder="Ej: 18" />
                    </div>
                    <div>
                      <label className={labelClass}>Precio ofertado (EUR/mes)</label>
                      <input {...register('precio_ofertado_eur')} type="number" step="0.01" className={inputClass} placeholder="Nuevo precio mensual" />
                    </div>
                    <div>
                      <label className={labelClass}>Margen estimado (EUR/ano)</label>
                      <input {...register('margen_estimado_eur')} type="number" step="0.01" className={inputClass} placeholder="Margen para Sinergia" />
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 mt-2">
                    <p className="text-xs text-green-700">
                      Tip: El ahorro y margen se calculan automaticamente cuando se usa la Calculadora de Ahorro (proximamente).
                    </p>
                  </div>
                </div>
              )}

              {/* ── SEGUIMIENTO ── */}
              {activeSection === 'seguimiento' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineClipboardList className="w-4 h-4 text-primary-600" />
                    Estado y seguimiento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Estado del prospecto</label>
                      <select {...register('estado')} className={inputClass}>
                        {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Prioridad</label>
                      <select {...register('prioridad')} className={inputClass}>
                        <option value="alta">Alta - Llamar hoy</option>
                        <option value="media">Media - Esta semana</option>
                        <option value="baja">Baja - Cuando se pueda</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Temperatura</label>
                      <select {...register('temperatura')} className={inputClass}>
                        <option value="frio">Frio - No conoce la oferta</option>
                        <option value="tibio">Tibio - Ha mostrado interes</option>
                        <option value="caliente">Caliente - Listo para cerrar</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Fuente de captacion</label>
                      <select {...register('fuente')} className={inputClass}>
                        {FUENTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Proximo contacto programado</label>
                      <input {...register('fecha_proximo_contacto')} type="date" className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTAS ── */}
              {activeSection === 'notas' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineDocumentText className="w-4 h-4 text-primary-600" />
                    Notas internas
                  </h3>
                  <p className="text-xs text-gray-500">
                    Informacion privada sobre este negocio. No se comparte con el cliente.
                  </p>
                  <textarea
                    {...register('notas_internas')}
                    rows={8}
                    className={inputClass}
                    placeholder="Ej: El dueno parece interesado pero quiere esperar al vencimiento del contrato en septiembre. Tiene 2 locales mas en Alicante centro que podrian ser clientes potenciales."
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {SECTIONS.map((s) => (
                  <span
                    key={s.id}
                    className={`w-2 h-2 rounded-full ${activeSection === s.id ? 'bg-primary-600' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {isEdit ? 'Guardar cambios' : 'Crear negocio'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
