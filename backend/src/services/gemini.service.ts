import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// ── Cliente singleton ──────────────────────────────────────────────────────
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

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface ProspectData {
  nombre_negocio: string;
  nombre_contacto?: string;
  categoria?: string;
  municipio?: string;
  provincia?: string;
  comercializadora_actual?: string;
  tarifa_actual?: string;
  potencia_p1_kw?: number | null;
  consumo_anual_kwh?: number | null;
  gasto_mensual_estimado_eur?: number | null;
  ahorro_estimado_eur?: number | null;
  ahorro_porcentaje?: number | null;
  estado?: string;
  temperatura?: string;
  num_emails_enviados?: number;
  num_emails_abiertos?: number;
  num_emails_clicked?: number;
  numero_intentos_contacto?: number;
  fecha_ultimo_contacto?: string | null;
  fecha_vencimiento_contrato?: string | null;
  notas_internas?: string;
}

export interface LeadScore {
  score_total: number;
  score_email: number;
  score_energetico: number;
  score_actividad: number;
  probabilidad_cierre: number;
  explicacion: string;
}

export interface CallBriefing {
  briefing_llamada: string;
  sugerencia_siguiente_paso: string;
  motivos_interes: string[];
  objeciones_detectadas: string[];
  mejor_hora_contacto: string | null;
  resumen_historial: string;
}

export interface GeneratedEmail {
  asunto: string;
  cuerpo_html: string;
  cuerpo_texto: string;
}

// ── Helper: llamada segura con retry ─────────────────────────────────────
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

// ── 1. SCORING DE PROSPECTOS ───────────────────────────────────────────────
export async function scoreLead(prospect: ProspectData): Promise<LeadScore> {
  // Cálculo determinístico (sin IA) para score base
  let scoreEmail = 0;
  let scoreEnergetico = 0;
  let scoreActividad = 0;

  // Score email (0-35)
  const emailsEnviados = prospect.num_emails_enviados || 0;
  const emailsAbiertos = prospect.num_emails_abiertos || 0;
  const emailsClicked = prospect.num_emails_clicked || 0;
  if (emailsEnviados > 0) {
    const tasaApertura = emailsAbiertos / emailsEnviados;
    const tasaClick = emailsClicked / emailsEnviados;
    scoreEmail = Math.min(35, Math.round(tasaApertura * 20 + tasaClick * 15));
  }

  // Score energético (0-40)
  if (prospect.ahorro_estimado_eur && prospect.ahorro_estimado_eur > 0) {
    if (prospect.ahorro_estimado_eur >= 500) scoreEnergetico += 20;
    else if (prospect.ahorro_estimado_eur >= 200) scoreEnergetico += 15;
    else if (prospect.ahorro_estimado_eur >= 100) scoreEnergetico += 10;
    else scoreEnergetico += 5;
  }
  if (prospect.consumo_anual_kwh && prospect.consumo_anual_kwh > 50000) scoreEnergetico += 10;
  else if (prospect.consumo_anual_kwh && prospect.consumo_anual_kwh > 10000) scoreEnergetico += 6;
  if (prospect.tarifa_actual && ['2.0TD', '3.0TD', '6.1TD'].includes(prospect.tarifa_actual)) scoreEnergetico += 5;
  if (prospect.fecha_vencimiento_contrato) {
    const dias = Math.ceil((new Date(prospect.fecha_vencimiento_contrato).getTime() - Date.now()) / 86400000);
    if (dias > 0 && dias <= 60) scoreEnergetico += 10;
    else if (dias > 60 && dias <= 180) scoreEnergetico += 5;
  }
  scoreEnergetico = Math.min(40, scoreEnergetico);

  // Score actividad (0-25)
  const intentos = prospect.numero_intentos_contacto || 0;
  if (intentos >= 3) scoreActividad += 10;
  else if (intentos >= 1) scoreActividad += 5;
  if (prospect.temperatura === 'caliente') scoreActividad += 10;
  else if (prospect.temperatura === 'tibio' || prospect.temperatura === 'templado') scoreActividad += 5;
  if (prospect.fecha_ultimo_contacto) {
    const diasDesde = Math.ceil((Date.now() - new Date(prospect.fecha_ultimo_contacto).getTime()) / 86400000);
    if (diasDesde <= 7) scoreActividad += 5;
    else if (diasDesde <= 30) scoreActividad += 3;
  }
  scoreActividad = Math.min(25, scoreActividad);

  const scoreTotal = scoreEmail + scoreEnergetico + scoreActividad;
  const probabilidadCierre = Math.min(95, Math.round(scoreTotal * 0.95));

  // Enriquecer con IA si hay API key
  let explicacion = `Score calculado: Email=${scoreEmail}/35, Energético=${scoreEnergetico}/40, Actividad=${scoreActividad}/25`;

  if (env.GEMINI_API_KEY) {
    try {
      const prompt = `Eres un experto en ventas de energía eléctrica en España. Analiza este prospecto y da una explicación breve (2 frases máximo) del score calculado:

Negocio: ${prospect.nombre_negocio}
Sector: ${prospect.categoria || 'desconocido'}
Ahorro estimado: ${prospect.ahorro_estimado_eur || 0}€/mes
Estado: ${prospect.estado || 'nuevo'}
Temperatura: ${prospect.temperatura || 'frío'}
Score total: ${scoreTotal}/100

Responde SOLO con 2 frases explicando por qué tiene ese score y qué haría falta para subirlo.`;
      explicacion = await safeGenerate(prompt);
    } catch (e) {
      logger.warn('Gemini score explicación fallida, usando cálculo local');
    }
  }

  return {
    score_total: scoreTotal,
    score_email: scoreEmail,
    score_energetico: scoreEnergetico,
    score_actividad: scoreActividad,
    probabilidad_cierre: probabilidadCierre,
    explicacion,
  };
}

// ── 2. BRIEFING DE LLAMADA ─────────────────────────────────────────────────
export async function generateCallBriefing(prospect: ProspectData, historialNotas: string = ''): Promise<CallBriefing> {
  const fallback: CallBriefing = {
    briefing_llamada: `Contactar a ${prospect.nombre_negocio} para presentar oferta de ahorro energético. Actualmente con ${prospect.comercializadora_actual || 'comercializadora desconocida'}.`,
    sugerencia_siguiente_paso: 'Llamar y preguntar por el responsable de facturas de energía.',
    motivos_interes: prospect.ahorro_estimado_eur ? [`Ahorro potencial de ${prospect.ahorro_estimado_eur}€/mes`] : [],
    objeciones_detectadas: ['Posible contrato en vigor'],
    mejor_hora_contacto: null,
    resumen_historial: historialNotas || 'Sin historial previo.',
  };

  if (!env.GEMINI_API_KEY) return fallback;

  try {
    const prompt = `Eres un coach de ventas de energía eléctrica en España. Genera un briefing de llamada comercial para el siguiente prospecto. Responde EXCLUSIVAMENTE en JSON válido.

DATOS DEL PROSPECTO:
- Negocio: ${prospect.nombre_negocio}
- Contacto: ${prospect.nombre_contacto || 'desconocido'}
- Sector: ${prospect.categoria || 'desconocido'}
- Municipio: ${prospect.municipio || ''}, ${prospect.provincia || ''}
- Comercializadora actual: ${prospect.comercializadora_actual || 'desconocida'}
- Tarifa: ${prospect.tarifa_actual || 'desconocida'}
- Consumo anual: ${prospect.consumo_anual_kwh || 0} kWh
- Gasto mensual: ${prospect.gasto_mensual_estimado_eur || 0}€
- Ahorro estimado: ${prospect.ahorro_estimado_eur || 0}€/mes (${prospect.ahorro_porcentaje || 0}%)
- Vencimiento contrato: ${prospect.fecha_vencimiento_contrato || 'desconocido'}
- Temperatura: ${prospect.temperatura || 'frío'}
- Intentos de contacto: ${prospect.numero_intentos_contacto || 0}
- Notas: ${prospect.notas_internas || 'ninguna'}
- Historial: ${historialNotas || 'sin historial'}

Responde con este JSON exacto:
{
  "briefing_llamada": "párrafo de 3-4 frases con contexto completo para la llamada",
  "sugerencia_siguiente_paso": "acción concreta a realizar",
  "motivos_interes": ["motivo 1", "motivo 2"],
  "objeciones_detectadas": ["objeción 1", "objeción 2"],
  "mejor_hora_contacto": "10:00" o null,
  "resumen_historial": "resumen breve del historial"
}`;

    const raw = await safeGenerate(prompt);
    const json = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(json);
  } catch (e) {
    logger.warn('Gemini briefing fallido, usando fallback:', e);
    return fallback;
  }
}

// ── 3. GENERAR EMAIL CON IA ────────────────────────────────────────────────
export async function generateEmail(
  prospect: ProspectData,
  objetivo: 'presentacion' | 'seguimiento' | 'oferta' | 'reactivacion' = 'presentacion'
): Promise<GeneratedEmail> {
  const fallback: GeneratedEmail = {
    asunto: `Ahorra en tu factura eléctrica — ${prospect.nombre_negocio}`,
    cuerpo_html: `<p>Estimado ${prospect.nombre_contacto || 'cliente'},</p><p>Me pongo en contacto para presentarle nuestra propuesta de ahorro energético para ${prospect.nombre_negocio}.</p><p>Saludos,<br/>Somos Sinergia</p>`,
    cuerpo_texto: `Estimado ${prospect.nombre_contacto || 'cliente'},\n\nMe pongo en contacto para presentarle nuestra propuesta de ahorro energético para ${prospect.nombre_negocio}.\n\nSaludos,\nSomos Sinergia`,
  };

  if (!env.GEMINI_API_KEY) return fallback;

  const objetivos: Record<string, string> = {
    presentacion: 'primera toma de contacto comercial, presentar Somos Sinergia',
    seguimiento: 'seguimiento de contacto previo, recordar propuesta de ahorro',
    oferta: `presentar oferta concreta con ahorro de ${prospect.ahorro_estimado_eur || 0}€/mes`,
    reactivacion: 'reactivar un prospecto frío que no ha respondido en semanas',
  };

  try {
    const prompt = `Eres un comercial experto en energía eléctrica de la empresa "Somos Sinergia" (Orihuela, Alicante). Redacta un email comercial profesional en español.

OBJETIVO: ${objetivos[objetivo]}
DESTINATARIO: ${prospect.nombre_negocio} (${prospect.nombre_contacto || 'responsable'})
SECTOR: ${prospect.categoria || 'empresa'}
DATOS ENERGÉTICOS:
- Comercializadora actual: ${prospect.comercializadora_actual || 'desconocida'}
- Tarifa: ${prospect.tarifa_actual || 'desconocida'}
- Ahorro estimado: ${prospect.ahorro_estimado_eur || 0}€/mes
- Consumo anual: ${prospect.consumo_anual_kwh || 0} kWh

Responde EXCLUSIVAMENTE con JSON:
{
  "asunto": "asunto del email (máx 60 caracteres, sin emojis)",
  "cuerpo_html": "cuerpo completo en HTML con párrafos <p>, máx 4 párrafos, tono profesional pero cercano",
  "cuerpo_texto": "misma versión en texto plano"
}`;

    const raw = await safeGenerate(prompt);
    const json = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(json);
  } catch (e) {
    logger.warn('Gemini email fallido, usando fallback:', e);
    return fallback;
  }
}

// ── 4. BRIEFING DIARIO DEL USUARIO ────────────────────────────────────────
export interface DailyBriefing {
  saludo: string;
  resumen: string;
  alertas: Array<{ tipo: string; mensaje: string; severidad: 'alta' | 'media' | 'baja' }>;
  top_prospectos: Array<{ id: string; nombre: string; motivo: string; score: number }>;
  stats_hoy: { pipeline_activo: number; emails_pendientes: number; visitas_hoy: number };
}

// ── 5. EXTRACCIÓN DE FACTURAS ELÉCTRICAS CON IA ───────────────────────────
export interface BillExtraction {
  comercializadora: string | null;
  cups: string | null;
  tarifa: string | null;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  dias: number | null;
  potencias: number[];
  consumos: number[];
  precios_energia: number[];
  importe_potencia: number | null;
  importe_energia: number | null;
  importe_total: number | null;
  impuesto_electrico: number | null;
  iva: number | null;
  alquiler_contador: number | null;
  tiene_reactiva: boolean;
  modalidad: string | null;
  confianza: number;
  metodo: 'regex' | 'gemini' | 'gemini-vision';
}

export async function extractEnergyBillFromText(pdfText: string): Promise<BillExtraction> {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada');

  const prompt = `Eres un experto en facturas de electricidad españolas. Extrae los datos estructurados de este texto de factura eléctrica española.

TEXTO DE FACTURA:
${pdfText.slice(0, 8000)}

Responde SOLO con JSON válido, sin markdown, con esta estructura exacta:
{
  "comercializadora": "nombre o null",
  "cups": "ES seguido de dígitos o null",
  "tarifa": "2.0TD o 3.0TD o 6.1TD u otra o null",
  "periodo_desde": "DD/MM/YYYY o null",
  "periodo_hasta": "DD/MM/YYYY o null",
  "dias": número entero o null,
  "potencias": [número kW por periodo, puede estar vacío],
  "consumos": [número kWh por periodo, puede estar vacío],
  "precios_energia": [EUR/kWh por periodo, puede estar vacío],
  "importe_potencia": número EUR o null,
  "importe_energia": número EUR o null,
  "importe_total": número EUR total a pagar o null,
  "impuesto_electrico": número EUR o null,
  "iva": número EUR (importe del IVA, no el porcentaje) o null,
  "alquiler_contador": número EUR o null,
  "tiene_reactiva": true o false,
  "modalidad": "fijo" o "indexado" o null
}`;

  const raw = await safeGenerate(prompt);
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const data = JSON.parse(clean);

  // Calcular confianza basada en campos extraídos
  const camposClave = ['comercializadora', 'cups', 'tarifa', 'importe_total', 'consumos'];
  const extraidos = camposClave.filter(c => {
    const v = data[c];
    return v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true);
  });
  const confianza = Math.round((extraidos.length / camposClave.length) * 100);

  return { ...data, confianza, metodo: 'gemini' };
}

export async function extractEnergyBillFromImage(imageBuffer: Buffer, mimeType: string): Promise<BillExtraction> {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada');

  const client = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Eres un experto en facturas de electricidad españolas. Analiza esta imagen de factura eléctrica y extrae todos los datos.

Responde SOLO con JSON válido, sin markdown, con esta estructura exacta:
{
  "comercializadora": "nombre o null",
  "cups": "ES seguido de dígitos o null",
  "tarifa": "2.0TD o 3.0TD o 6.1TD u otra o null",
  "periodo_desde": "DD/MM/YYYY o null",
  "periodo_hasta": "DD/MM/YYYY o null",
  "dias": número entero o null,
  "potencias": [número kW por periodo],
  "consumos": [número kWh por periodo],
  "precios_energia": [EUR/kWh por periodo],
  "importe_potencia": número EUR o null,
  "importe_energia": número EUR o null,
  "importe_total": número EUR total a pagar o null,
  "impuesto_electrico": número EUR o null,
  "iva": número EUR o null,
  "alquiler_contador": número EUR o null,
  "tiene_reactiva": true o false,
  "modalidad": "fijo" o "indexado" o null
}`;

  const result = await model.generateContent([
    { inlineData: { mimeType, data: imageBuffer.toString('base64') } },
    { text: prompt },
  ]);

  const raw = result.response.text();
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const data = JSON.parse(clean);

  const camposClave = ['comercializadora', 'cups', 'tarifa', 'importe_total', 'consumos'];
  const extraidos = camposClave.filter(c => {
    const v = data[c];
    return v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true);
  });
  const confianza = Math.round((extraidos.length / camposClave.length) * 100);

  return { ...data, confianza, metodo: 'gemini-vision' };
}
