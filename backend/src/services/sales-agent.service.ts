import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface SalesProspect {
  id: string;
  nombre_negocio: string;
  nombre_contacto?: string;
  categoria?: string;
  municipio?: string;
  comercializadora_actual?: string;
  tarifa_actual?: string;
  consumo_anual_kwh?: number;
  gasto_mensual_estimado_eur?: number;
  ahorro_estimado_eur?: number;
  temperatura?: string;
  estado?: string;
}

export interface SalesPitch {
  apertura: string;
  propuesta_valor: string;
  cuerpo_pitch: string;
  cierre: string;
  puntos_clave: string[];
  tiempos_estimados: {
    apertura_seg: number;
    propuesta_seg: number;
    cierre_seg: number;
  };
}

export interface ObjectionResponse {
  objecion: string;
  respuesta_inmediata: string;
  contraargumentos: string[];
  pruebas_efectivas: string[];
  siguiente_paso: string;
}

export interface SalesStrategy {
  temperatura: string;
  sector: string;
  estrategia: string;
  puntos_fuertes: string[];
  puntos_debiles_prospect: string[];
  mejor_hora_contacto: string;
  duracion_estimada_min: number;
  siguiente_contacto_dias: number;
}

// ── Base de guiones (fallback sin Gemini) ──────────────────────────────────
const PITCH_TEMPLATES = {
  apertura_caliente: `Buenos días/tardes, soy {nombre} de Somos Sinergia. He visto que {nombre_negocio} está con {comercializadora}, ¿es la persona indicada para hablar de las facturas de electricidad?`,
  apertura_frio: `Buenos días/tardes, soy {nombre} de Somos Sinergia. Es una llamada breve sobre oportunidades de ahorro en energía para {nombre_negocio}. ¿Tienes 2 minutos?`,

  propuesta_energia: `Especializo en ahorrar entre 10-40% en la factura eléctrica. Para {nombre_negocio}, con un consumo de {consumo} kWh/año, podríamos alcanzar un ahorro de {ahorro}€/mes.`,
  propuesta_general: `Somos una comercializadora energética que ayuda a empresas como {nombre_negocio} a reducir costes de electricidad sin complicaciones administrativas.`,

  cierre_fuerte: `¿Te envío una propuesta personalizada por email? Puedo hacerlo en 10 minutos.`,
  cierre_suave: `Me gustaría mostrarte cómo otros negocios en {municipio} lo están usando. ¿Cuándo te va mejor esta semana para una breve videollamada?`,
};

const COMMON_OBJECTIONS = {
  'me-va-bien': {
    objecion: 'Mi actual comercializadora me va bien',
    respuestas: [
      'Entiendo. El 85% de nuestros clientes decía lo mismo antes. Muchas veces hay margen que no es visible hasta que lo ves por escrito.',
      'Claro. De todas formas, una comparación no te cuesta nada. Puedo enviarte en 5 min una estimación versus tu actual.',
    ],
  },
  'es-demasiado-lío': {
    objecion: 'Cambiar de comercializadora es un lío administrativo',
    respuestas: [
      'Ese era el caso hace años. Ahora lo hacemos en 100% digital y en 2-3 semanas está activo. Nosotros tramitamos todo.',
      'Lo sé, por eso el 90% del trabajo lo hacemos nosotros. Tú solo firmas la propuesta y listo.',
    ],
  },
  'no-tengo-tiempo': {
    objecion: 'No tengo tiempo ahora',
    respuestas: [
      'Perfecto, entiendo que estés ocupado. ¿Qué tal el jueves a las 5pm? Hacemos una llamada de 15 minutos.',
      'Sin problema. Te envío una estimación por email y la ves cuando tengas tiempo. Sin presión.',
    ],
  },
  'que-es-esto': {
    objecion: '¿Quién eres? No te conozco',
    respuestas: [
      'Claro, es la primera vez que nos hablamos. Somos Somos Sinergia, especialistas en energía para PYMEs. Llevamos 5 años ahorrándole dinero a empresas como la tuya.',
      'Es comprensible. Somos una comercializadora energética con 2000+ clientes en España. Aquí estoy en LinkedIn si quieres verificar.',
    ],
  },
};

// ── Cliente Gemini ──────────────────────────────────────────────────────────
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada');
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAI;
}

function getModel() {
  return getClient().getGenerativeModel({ model: 'gemini-2.0-flash' });
}

// ── Helper: llamada segura con retry ───────────────────────────────────────
async function safeGenerate(prompt: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const model = getModel();
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      if (i === retries) throw err;
      const delay = 1000 * Math.pow(2, i);
      logger.warn(`Gemini retry ${i + 1} en ${delay}ms: ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Gemini: máximo de reintentos alcanzado');
}

// ── 1. GENERAR GUIÓN DE VENTA PERSONALIZADO ────────────────────────────────
export async function generateSalesPitch(prospect: SalesProspect, commercialNombre: string): Promise<SalesPitch> {
  const fallback: SalesPitch = {
    apertura: PITCH_TEMPLATES.apertura_caliente
      .replace('{nombre}', commercialNombre)
      .replace('{nombre_negocio}', prospect.nombre_negocio)
      .replace('{comercializadora}', prospect.comercializadora_actual || 'una comercializadora'),
    propuesta_valor: prospect.ahorro_estimado_eur
      ? PITCH_TEMPLATES.propuesta_energia
          .replace('{nombre_negocio}', prospect.nombre_negocio)
          .replace('{consumo}', prospect.consumo_anual_kwh?.toString() || '?')
          .replace('{ahorro}', prospect.ahorro_estimado_eur.toString())
      : PITCH_TEMPLATES.propuesta_general.replace('{nombre_negocio}', prospect.nombre_negocio),
    cuerpo_pitch: `En ${prospect.municipio || 'vuestra zona'}, hemos ayudado a negocios similares a ahorrar entre 500-2000€/año. Sin cambios de infraestructura, sin riesgos.`,
    cierre: prospect.temperatura === 'caliente' ? PITCH_TEMPLATES.cierre_fuerte : PITCH_TEMPLATES.cierre_suave.replace('{municipio}', prospect.municipio || 'vuestra zona'),
    puntos_clave: [
      `Ahorro: ${prospect.ahorro_estimado_eur || '10-40%'} euros/mes`,
      'Trámites 100% digitales sin papeleos',
      'Cambio en 2-3 semanas sin interrupciones',
      'Cero costes de cambio',
    ],
    tiempos_estimados: {
      apertura_seg: 30,
      propuesta_seg: 45,
      cierre_seg: 30,
    },
  };

  if (!env.GEMINI_API_KEY) return fallback;

  try {
    const prompt = `Eres un coach de ventas B2B energético. Crea un guión de venta personalizado para este prospecto. Responde EXCLUSIVAMENTE en JSON válido.

PROSPECTO:
- Negocio: ${prospect.nombre_negocio}
- Contacto: ${prospect.nombre_contacto || 'desconocido'}
- Sector: ${prospect.categoria || 'comercial'}
- Municipio: ${prospect.municipio || 'desconocido'}
- Comercializadora actual: ${prospect.comercializadora_actual || 'desconocida'}
- Consumo anual: ${prospect.consumo_anual_kwh || '?'} kWh
- Gasto mensual: ${prospect.gasto_mensual_estimado_eur || '?'} €
- Ahorro estimado: ${prospect.ahorro_estimado_eur || '?'} €/mes
- Temperatura: ${prospect.temperatura || 'frio'}
- Comercial: ${commercialNombre}

Genera un guión de venta de 4 párrafos en español, natural y conversacional. Estructura JSON:
{
  "apertura": "primeras 30 seg de la llamada, ganching atención",
  "propuesta_valor": "45 seg explicando por qué le interesa",
  "cuerpo_pitch": "45-60 seg de detalles técnicos y beneficios",
  "cierre": "cierre con call-to-action clara",
  "puntos_clave": ["punto 1", "punto 2", "punto 3", "punto 4"],
  "tiempos_estimados": {
    "apertura_seg": 30,
    "propuesta_seg": 45,
    "cierre_seg": 30
  }
}`;

    const raw = await safeGenerate(prompt);
    const json = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(json);
  } catch (e) {
    logger.warn('Gemini pitch fallido, usando fallback:', e);
    return fallback;
  }
}

// ── 2. RESPONDER OBJECIONES ────────────────────────────────────────────────
export async function handleObjection(objecion: string, prospect: SalesProspect, historial: string = ''): Promise<ObjectionResponse> {
  // Buscar objeción en la base local primero
  const objLocal = Object.values(COMMON_OBJECTIONS).find(o => objecion.toLowerCase().includes(o.objecion.toLowerCase()));

  const fallback: ObjectionResponse = objLocal ? {
    objecion: objLocal.objecion,
    respuesta_inmediata: objLocal.respuestas[0],
    contraargumentos: objLocal.respuestas,
    pruebas_efectivas: [
      'Casos de éxito similares',
      'Comparativa presupuestaria por escrito',
      'Testimonios de clientes',
    ],
    siguiente_paso: 'Enviar propuesta por email + agendar demo en 2 días',
  } : {
    objecion,
    respuesta_inmediata: 'Entiendo perfectamente. Ese es un punto importante.',
    contraargumentos: [
      'La mayoría de nuestros clientes tenían la misma preocupación inicialmente.',
      'Podemos demostrarlo con datos reales de tu sector.',
    ],
    pruebas_efectivas: [
      'Comparativa personalizada',
      'Cálculo exacto de ahorro',
      'Referencias de clientes similares',
    ],
    siguiente_paso: 'Enviar propuesta técnica detallada',
  };

  if (!env.GEMINI_API_KEY) return fallback;

  try {
    const prompt = `Eres un maestro en sales. El prospecto ${prospect.nombre_negocio} ha puesto una objeción: "${objecion}".

Contexto:
- Temperatura: ${prospect.temperatura}
- Sector: ${prospect.categoria}
- Historial: ${historial || 'primer contacto'}
- Ahorro potencial: ${prospect.ahorro_estimado_eur}€/mes

Genera respuestas efectivas en JSON:
{
  "objecion": "resumen de la objeción",
  "respuesta_inmediata": "respuesta en 1 frase que valida su preocupación",
  "contraargumentos": ["arg 1", "arg 2", "arg 3"],
  "pruebas_efectivas": ["prueba 1", "prueba 2"],
  "siguiente_paso": "acción concreta para avanzar"
}`;

    const raw = await safeGenerate(prompt);
    const json = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(json);
  } catch (e) {
    logger.warn('Gemini objection handler fallido, usando fallback');
    return fallback;
  }
}

// ── 3. ESTRATEGIA DE VENTA POR TEMPERATURA/SECTOR ──────────────────────────
export async function getSalesStrategy(prospect: SalesProspect): Promise<SalesStrategy> {
  const fallbackStrategy: SalesStrategy = {
    temperatura: prospect.temperatura || 'frio',
    sector: prospect.categoria || 'desconocido',
    estrategia: prospect.temperatura === 'caliente'
      ? 'Ataque directo: enfocarse en cierre en 2-3 contactos'
      : prospect.temperatura === 'tibio'
      ? 'Nutrición: educar con beneficios, esperar a que responda'
      : 'Prospecting: múltiples toques, bajo pressure, datos y valor',
    puntos_fuertes: [
      `Ahorro: ${prospect.ahorro_estimado_eur || 'X'}€/mes`,
      'Proceso 100% digital',
      'Soporte dedicado',
    ],
    puntos_debiles_prospect: [
      prospect.temperatura === 'frio' ? 'Falta de urgencia' : 'Posible contrato vigente',
    ],
    mejor_hora_contacto: prospect.temperatura === 'caliente' ? '10:00-12:00' : '14:00-16:00',
    duracion_estimada_min: prospect.temperatura === 'caliente' ? 15 : 10,
    siguiente_contacto_dias: prospect.temperatura === 'caliente' ? 2 : 7,
  };

  if (!env.GEMINI_API_KEY) return fallbackStrategy;

  try {
    const prompt = `Eres estratega de ventas B2B energético. Define la estrategia para:
- Negocio: ${prospect.nombre_negocio}
- Sector: ${prospect.categoria}
- Temperatura: ${prospect.temperatura}
- Ahorro: ${prospect.ahorro_estimado_eur}€/mes
- Estado: ${prospect.estado}

Responde JSON:
{
  "temperatura": "${prospect.temperatura}",
  "sector": "${prospect.categoria}",
  "estrategia": "descripción de la estrategia",
  "puntos_fuertes": ["punto 1", "punto 2"],
  "puntos_debiles_prospect": ["debilidad 1"],
  "mejor_hora_contacto": "10:00-12:00",
  "duracion_estimada_min": 15,
  "siguiente_contacto_dias": 3
}`;

    const raw = await safeGenerate(prompt);
    const json = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(json);
  } catch (e) {
    logger.warn('Gemini strategy fallido, usando fallback');
    return fallbackStrategy;
  }
}

// ── 4. SUGERENCIAS EN TIEMPO REAL PARA COMERCIALES ──────────────────────────
export interface SalesAction {
  tipo: 'llamar_ahora' | 'enviar_email' | 'cambiar_temperatura' | 'esperar' | 'ofertar';
  urgencia: 'alta' | 'media' | 'baja';
  accion: string;
  razon: string;
  tiempo_estimado_min: number;
}

export async function getSalesAction(prospect: SalesProspect, diasDesdeUltimoContacto: number): Promise<SalesAction> {
  // Lógica determinística según el estado
  if (prospect.temperatura === 'caliente' && diasDesdeUltimoContacto > 3) {
    return {
      tipo: 'llamar_ahora',
      urgencia: 'alta',
      accion: `Llamar a ${prospect.nombre_contacto || 'responsable'} de ${prospect.nombre_negocio}`,
      razon: 'Prospecto caliente sin contacto en 3+ días. Alto riesgo de pérdida.',
      tiempo_estimado_min: 15,
    };
  }

  if (prospect.estado === 'oferta_enviada' && diasDesdeUltimoContacto > 5) {
    return {
      tipo: 'llamar_ahora',
      urgencia: 'alta',
      accion: 'Follow-up de la oferta enviada',
      razon: 'Oferta sin respuesta en 5+ días. Hacer follow-up directo.',
      tiempo_estimado_min: 10,
    };
  }

  if (prospect.estado === 'interesado' && diasDesdeUltimoContacto > 2) {
    return {
      tipo: 'enviar_email',
      urgencia: 'media',
      accion: 'Enviar email con propuesta personalizada + demo link',
      razon: 'Prospecto interesado necesita siguiente paso tangible.',
      tiempo_estimado_min: 5,
    };
  }

  if (prospect.estado === 'pendiente' && diasDesdeUltimoContacto > 7) {
    return {
      tipo: 'llamar_ahora',
      urgencia: 'media',
      accion: 'Primer contacto: apertura + propuesta + cierre agenda',
      razon: 'Prospecto sin contacto en 7+ días. Necesita primer toque.',
      tiempo_estimado_min: 15,
    };
  }

  return {
    tipo: 'esperar',
    urgencia: 'baja',
    accion: 'Esperar siguiente actividad',
    razon: 'Prospecto en buen estado, sin acciones inmediatas necesarias.',
    tiempo_estimado_min: 0,
  };
}
