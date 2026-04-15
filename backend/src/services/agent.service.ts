import { GoogleGenerativeAI, Tool, FunctionDeclaration } from '@google/generative-ai';
import { env } from '../config/env';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AgentResponse {
  message: string;
  actions_taken: string[];
  data?: any;
}

// ── Tools del agente (36 total) ────────────────────────────────────────────
const toolDeclarations: any[] = [
  // ── PIPELINE ──
  {
    name: 'get_pipeline_summary',
    description: 'Obtiene el resumen del pipeline de ventas: total por estado, temperatura, prioridad y ahorro potencial agregado',
    parameters: {
      type: 'object' as any,
      properties: {
        user_id: { type: 'string', description: 'ID del usuario (dejar vacío para admin = todos)' },
      },
      required: [],
    },
  },
  {
    name: 'find_prospects',
    description: 'Busca prospectos por cualquier criterio: nombre, municipio, tarifa, comercializadora, estado, temperatura, sector CNAE, o rango de ahorro',
    parameters: {
      type: 'object' as any,
      properties: {
        texto: { type: 'string', description: 'Texto libre de búsqueda' },
        estado: { type: 'string', description: 'Estado del prospecto: pendiente, contactado, interesado, negociacion, contrato, cliente, perdido' },
        temperatura: { type: 'string', description: 'frio, templado, caliente' },
        municipio: { type: 'string', description: 'Municipio o ciudad' },
        tarifa: { type: 'string', description: 'Tarifa eléctrica: 2.0TD, 3.0TD, 6.1TD, etc.' },
        ahorro_min: { type: 'number', description: 'Ahorro mínimo en euros/mes' },
        limite: { type: 'number', description: 'Número máximo de resultados (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_prospect_detail',
    description: 'Obtiene el perfil completo de un prospecto: datos de contacto, datos energéticos, historial, score IA y última actividad',
    parameters: {
      type: 'object' as any,
      properties: {
        prospect_id: { type: 'string', description: 'ID UUID del prospecto' },
      },
      required: ['prospect_id'],
    },
  },
  {
    name: 'update_prospect_status',
    description: 'Actualiza el estado o temperatura de un prospecto',
    parameters: {
      type: 'object' as any,
      properties: {
        prospect_id: { type: 'string' },
        estado: { type: 'string', description: 'Nuevo estado' },
        temperatura: { type: 'string', description: 'Nueva temperatura: frio, templado, caliente' },
        notas: { type: 'string', description: 'Nota interna a añadir' },
      },
      required: ['prospect_id'],
    },
  },
  {
    name: 'get_top_opportunities',
    description: 'Lista los prospectos con mayor score o mayor potencial de cierre este mes',
    parameters: {
      type: 'object' as any,
      properties: {
        limite: { type: 'number', description: 'Número de prospectos (default 5)' },
        min_score: { type: 'number', description: 'Score mínimo (0-100)' },
      },
      required: [],
    },
  },
  // ── EMAIL ──
  {
    name: 'get_email_stats',
    description: 'Obtiene estadísticas de email: tasa de apertura, clicks, campañas enviadas, emails en inbox no leídos',
    parameters: {
      type: 'object' as any,
      properties: {},
      required: [],
    },
  },
  {
    name: 'generate_email_for_prospect',
    description: 'Genera un email personalizado con IA para un prospecto específico según el objetivo',
    parameters: {
      type: 'object' as any,
      properties: {
        prospect_id: { type: 'string' },
        objetivo: { type: 'string', description: 'presentacion, seguimiento, oferta, reactivacion' },
      },
      required: ['prospect_id'],
    },
  },
  {
    name: 'get_inbox_summary',
    description: 'Muestra los emails recibidos recientes no leídos del inbox de Gmail sincronizado',
    parameters: {
      type: 'object' as any,
      properties: {
        limite: { type: 'number', description: 'Número de emails (default 5)' },
      },
      required: [],
    },
  },
  // ── VISITAS ──
  {
    name: 'get_visits_today',
    description: 'Lista las visitas programadas para hoy',
    parameters: {
      type: 'object' as any,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_visits_week',
    description: 'Lista las visitas de esta semana',
    parameters: {
      type: 'object' as any,
      properties: {},
      required: [],
    },
  },
  // ── CLIENTES ──
  {
    name: 'get_clients_summary',
    description: 'Resumen de clientes activos: total, ahorro generado, gasto mensual gestionado',
    parameters: {
      type: 'object' as any,
      properties: {},
      required: [],
    },
  },
  // ── SERVICIOS ──
  {
    name: 'get_servicios_summary',
    description: 'Resumen de servicios contratados: por tipo (luz, gas, solar), estado, ingresos',
    parameters: {
      type: 'object' as any,
      properties: {},
      required: [],
    },
  },
  // ── CALCULADORA ──
  {
    name: 'calculate_savings',
    description: 'Calcula el ahorro estimado para un prospecto dado su consumo y tarifa actual',
    parameters: {
      type: 'object' as any,
      properties: {
        consumo_anual_kwh: { type: 'number', description: 'Consumo anual en kWh' },
        gasto_mensual_eur: { type: 'number', description: 'Gasto mensual actual en euros' },
        tarifa_actual: { type: 'string', description: 'Tarifa actual del cliente' },
        potencia_kw: { type: 'number', description: 'Potencia contratada en kW' },
      },
      required: ['consumo_anual_kwh', 'gasto_mensual_eur'],
    },
  },
  // ── ESTADÍSTICAS ──
  {
    name: 'get_dashboard_stats',
    description: 'Obtiene los KPIs principales del dashboard: pipeline, clientes, conversión, ahorro total',
    parameters: {
      type: 'object' as any,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_conversion_rate',
    description: 'Calcula la tasa de conversión del pipeline en un período dado',
    parameters: {
      type: 'object' as any,
      properties: {
        dias: { type: 'number', description: 'Período en días (default 30)' },
      },
      required: [],
    },
  },
  {
    name: 'get_prospects_without_contact',
    description: 'Lista prospectos que llevan más de N días sin ser contactados',
    parameters: {
      type: 'object' as any,
      properties: {
        dias: { type: 'number', description: 'Días sin contacto (default 7)' },
        limite: { type: 'number', description: 'Máximo de resultados (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_expiring_contracts',
    description: 'Lista prospectos con contratos que vencen en los próximos N días',
    parameters: {
      type: 'object' as any,
      properties: {
        dias: { type: 'number', description: 'Días hacia adelante (default 90)' },
      },
      required: [],
    },
  },
  {
    name: 'get_activity_log',
    description: 'Obtiene el historial de actividad reciente (llamadas, emails, visitas, notas)',
    parameters: {
      type: 'object' as any,
      properties: {
        prospect_id: { type: 'string', description: 'Filtrar por prospecto (opcional)' },
        limite: { type: 'number', description: 'Número de registros (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_zones_performance',
    description: 'Rendimiento por zona geográfica: prospectos, conversión, ahorro potencial',
    parameters: {
      type: 'object' as any,
      properties: {},
      required: [],
    },
  },
];

// ── System prompt del agente ───────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres el Asistente IA de Somos Sinergia, un CRM comercial especializado en energía eléctrica en España.
Ayudas a los comerciales a gestionar su pipeline, prospectos, emails y estadísticas de ventas.

PERSONALIDAD:
- Profesional pero cercano, usas el tuteo
- Conciso: máximo 3-4 frases por respuesta salvo que pidan detalle
- Siempre orientado a la acción: tras dar info, sugiere el siguiente paso
- Conoces el mercado eléctrico español: tarifas 2.0TD/3.0TD/6.1TD, CUPS, periodos P1-P3, REE, OMIE

REGLAS:
- Cuando el usuario pida datos, SIEMPRE usa las tools disponibles antes de responder
- Si el usuario menciona un negocio o cliente, usa find_prospects para buscarlo
- Nunca inventes datos — si no tienes información, dilo y ofrece buscarla
- Para acciones destructivas (borrar, cambiar estado a perdido) pide confirmación
- Si no hay API key de Gemini configurada, aún puedes responder preguntas generales sobre energía

FORMATO:
- Usa listas con viñetas para múltiples items
- Para números importantes usa **negrita**
- Fechas en formato español (dd/mm/yyyy)
- Importes siempre con € y dos decimales`;

// ── Ejecutor de tools ──────────────────────────────────────────────────────
async function executeTool(name: string, args: any, userId: string, userRole: string): Promise<any> {
  const isAdmin = userRole === 'admin';
  const userFilter = isAdmin ? '' : 'AND asignado_a = $1';
  const userParams = isAdmin ? [] : [userId];

  try {
    switch (name) {
      case 'get_pipeline_summary': {
        const result = await query(`
          SELECT estado, COUNT(*) as total,
                 COALESCE(SUM(ahorro_estimado_eur), 0) as ahorro_total,
                 COALESCE(AVG(ahorro_estimado_eur), 0) as ahorro_medio
          FROM prospects
          WHERE estado NOT IN ('cliente', 'perdido', 'descartado') ${userFilter}
          GROUP BY estado ORDER BY total DESC
        `, userParams);
        const temps = await query(`
          SELECT temperatura, COUNT(*) as total FROM prospects
          WHERE estado NOT IN ('cliente', 'perdido', 'descartado') ${userFilter}
          GROUP BY temperatura
        `, userParams);
        return { por_estado: result.rows, por_temperatura: temps.rows };
      }

      case 'find_prospects': {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        if (!isAdmin) { params.push(userId); conditions.push(`asignado_a = $${params.length}`); }
        if (args.texto) { params.push(`%${args.texto}%`); conditions.push(`(nombre_negocio ILIKE $${params.length} OR nombre_contacto ILIKE $${params.length} OR municipio ILIKE $${params.length})`); }
        if (args.estado) { params.push(args.estado); conditions.push(`estado = $${params.length}`); }
        if (args.temperatura) { params.push(args.temperatura); conditions.push(`temperatura = $${params.length}`); }
        if (args.municipio) { params.push(`%${args.municipio}%`); conditions.push(`municipio ILIKE $${params.length}`); }
        if (args.tarifa) { params.push(`%${args.tarifa}%`); conditions.push(`tarifa_actual ILIKE $${params.length}`); }
        if (args.ahorro_min) { params.push(args.ahorro_min); conditions.push(`ahorro_estimado_eur >= $${params.length}`); }
        params.push(args.limite || 10);
        const result = await query(`
          SELECT id, nombre_negocio, nombre_contacto, estado, temperatura, municipio,
                 tarifa_actual, ahorro_estimado_eur, fecha_ultimo_contacto, telefono_movil
          FROM prospects WHERE ${conditions.join(' AND ')}
          ORDER BY updated_at DESC LIMIT $${params.length}
        `, params);
        return { prospectos: result.rows, total: result.rows.length };
      }

      case 'get_prospect_detail': {
        const result = await query('SELECT * FROM prospects WHERE id = $1', [args.prospect_id]);
        if (!result.rows.length) return { error: 'Prospecto no encontrado' };
        const score = await query('SELECT * FROM prospect_scores WHERE prospect_id = $1', [args.prospect_id]);
        const historial = await query(`
          SELECT tipo, descripcion, created_at FROM contact_history
          WHERE prospect_id = $1 ORDER BY created_at DESC LIMIT 5
        `, [args.prospect_id]).catch(() => ({ rows: [] }));
        return { prospecto: result.rows[0], score: score.rows[0] || null, historial_reciente: historial.rows };
      }

      case 'update_prospect_status': {
        const updates: string[] = [];
        const params: any[] = [];
        if (args.estado) { params.push(args.estado); updates.push(`estado = $${params.length}`); }
        if (args.temperatura) { params.push(args.temperatura); updates.push(`temperatura = $${params.length}`); }
        if (args.notas) { params.push(args.notas); updates.push(`notas_internas = notas_internas || E'\\n' || $${params.length}`); }
        if (!updates.length) return { error: 'Nada que actualizar' };
        params.push(args.prospect_id);
        updates.push('updated_at = NOW()');
        await query(`UPDATE prospects SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
        return { success: true, mensaje: 'Prospecto actualizado' };
      }

      case 'get_top_opportunities': {
        const minScore = args.min_score || 50;
        const limite = args.limite || 5;
        const result = await query(`
          SELECT p.id, p.nombre_negocio, p.temperatura, p.estado, p.municipio,
                 p.ahorro_estimado_eur, p.fecha_ultimo_contacto, p.telefono_movil,
                 COALESCE(ps.score_total, 0) as score
          FROM prospects p
          LEFT JOIN prospect_scores ps ON ps.prospect_id = p.id
          WHERE p.estado NOT IN ('cliente', 'perdido', 'descartado')
          AND COALESCE(ps.score_total, 0) >= $1 ${userFilter.replace('$1', `$${isAdmin ? 2 : 3}`)}
          ORDER BY ps.score_total DESC NULLS LAST LIMIT $2
        `, isAdmin ? [minScore, limite] : [minScore, limite, userId]);
        return { oportunidades: result.rows };
      }

      case 'get_email_stats': {
        const enviados = await query(`
          SELECT COUNT(*) as total,
                 COUNT(*) FILTER (WHERE abierto_en IS NOT NULL) as abiertos,
                 COUNT(*) FILTER (WHERE clicked_en IS NOT NULL) as clicks
          FROM emails_enviados ${userFilter.replace('asignado_a', 'sent_by_id').replace('$1', '$1')}
        `, userParams).catch(() => ({ rows: [{ total: 0, abiertos: 0, clicks: 0 }] }));
        const inbox = await query(`
          SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE leido = false) as no_leidos
          FROM emails_recibidos er
          JOIN email_accounts_gmail eg ON eg.id = er.account_id
          WHERE eg.user_id = $1
        `, [userId]).catch(() => ({ rows: [{ total: 0, no_leidos: 0 }] }));
        return { enviados: enviados.rows[0], inbox: inbox.rows[0] };
      }

      case 'generate_email_for_prospect': {
        const { generateEmail } = await import('./gemini.service');
        const prospect = await query('SELECT * FROM prospects WHERE id = $1', [args.prospect_id]);
        if (!prospect.rows.length) return { error: 'Prospecto no encontrado' };
        const email = await generateEmail(prospect.rows[0], args.objetivo || 'presentacion');
        return email;
      }

      case 'get_inbox_summary': {
        const result = await query(`
          SELECT er.de_email, er.de_nombre, er.asunto, er.extracto, er.recibido_at,
                 p.nombre_negocio as prospecto
          FROM emails_recibidos er
          JOIN email_accounts_gmail eg ON eg.id = er.account_id
          LEFT JOIN prospects p ON p.id = er.prospect_id
          WHERE eg.user_id = $1 AND er.leido = false AND er.archivado = false
          ORDER BY er.recibido_at DESC LIMIT $2
        `, [userId, args.limite || 5]).catch(() => ({ rows: [] }));
        return { emails_no_leidos: result.rows, total: result.rows.length };
      }

      case 'get_visits_today': {
        const result = await query(`
          SELECT v.*, p.nombre_negocio, p.direccion_completa, p.telefono_movil
          FROM visits v JOIN prospects p ON p.id = v.prospect_id
          WHERE DATE(v.fecha_visita) = CURRENT_DATE ${userFilter.replace('asignado_a', 'v.user_id')}
          ORDER BY v.fecha_visita
        `, userParams).catch(() => ({ rows: [] }));
        return { visitas_hoy: result.rows, total: result.rows.length };
      }

      case 'get_visits_week': {
        const result = await query(`
          SELECT v.*, p.nombre_negocio, p.municipio
          FROM visits v JOIN prospects p ON p.id = v.prospect_id
          WHERE v.fecha_visita BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          ${userFilter.replace('asignado_a', 'v.user_id')}
          ORDER BY v.fecha_visita
        `, userParams).catch(() => ({ rows: [] }));
        return { visitas_semana: result.rows, total: result.rows.length };
      }

      case 'get_clients_summary': {
        const result = await query(`
          SELECT COUNT(*) as total_clientes,
                 COALESCE(SUM(ahorro_estimado_eur), 0) as ahorro_total_mes,
                 COALESCE(SUM(gasto_mensual_estimado_eur), 0) as gasto_gestionado_mes,
                 COALESCE(AVG(ahorro_porcentaje), 0) as ahorro_medio_pct
          FROM prospects WHERE estado = 'cliente' ${userFilter}
        `, userParams);
        return result.rows[0];
      }

      case 'get_servicios_summary': {
        const result = await query(`
          SELECT tipo_servicio, estado, COUNT(*) as total,
                 COALESCE(SUM(precio_mensual_eur), 0) as ingresos_mes
          FROM prospect_servicios
          GROUP BY tipo_servicio, estado ORDER BY total DESC
        `).catch(() => ({ rows: [] }));
        return { servicios: result.rows };
      }

      case 'calculate_savings': {
        const consumo = args.consumo_anual_kwh || 0;
        const gastoMensual = args.gasto_mensual_eur || 0;
        const ahorroEstimado = gastoMensual * 0.15;
        const ahorroAnual = ahorroEstimado * 12;
        const roi_meses = ahorroEstimado > 0 ? Math.ceil(12 / (ahorroEstimado / gastoMensual * 12)) : null;
        return {
          ahorro_mensual_estimado: Math.round(ahorroEstimado * 100) / 100,
          ahorro_anual_estimado: Math.round(ahorroAnual * 100) / 100,
          porcentaje_ahorro: 15,
          roi_meses,
          nota: 'Estimación basada en ahorro medio del 15%. Usa la calculadora para un cálculo preciso.',
        };
      }

      case 'get_dashboard_stats': {
        const [pipeline, clientes, conversiones] = await Promise.all([
          query(`SELECT COUNT(*) as total, COALESCE(SUM(ahorro_estimado_eur),0) as ahorro_potencial FROM prospects WHERE estado NOT IN ('cliente','perdido','descartado') ${userFilter}`, userParams),
          query(`SELECT COUNT(*) as total, COALESCE(SUM(ahorro_estimado_eur),0) as ahorro_total FROM prospects WHERE estado='cliente' ${userFilter}`, userParams),
          query(`SELECT COUNT(*) as convertidos FROM prospects WHERE estado='cliente' AND fecha_conversion >= NOW()-INTERVAL '30 days' ${userFilter}`, userParams).catch(() => ({ rows: [{ convertidos: 0 }] })),
        ]);
        return {
          pipeline_activo: pipeline.rows[0].total,
          ahorro_potencial_mes: pipeline.rows[0].ahorro_potencial,
          clientes_activos: clientes.rows[0].total,
          ahorro_generado_mes: clientes.rows[0].ahorro_total,
          conversiones_30d: conversiones.rows[0].convertidos,
        };
      }

      case 'get_conversion_rate': {
        const dias = args.dias || 30;
        const result = await query(`
          SELECT
            COUNT(*) FILTER (WHERE estado NOT IN ('perdido','descartado')) as activos,
            COUNT(*) FILTER (WHERE estado='cliente' AND fecha_conversion >= NOW()-INTERVAL '${dias} days') as convertidos
          FROM prospects ${userFilter ? `WHERE ${userFilter.replace('AND ', '')}` : ''}
        `, userParams);
        const { activos, convertidos } = result.rows[0];
        const tasa = activos > 0 ? Math.round((convertidos / activos) * 100 * 10) / 10 : 0;
        return { tasa_conversion: tasa, convertidos, activos, periodo_dias: dias };
      }

      case 'get_prospects_without_contact': {
        const dias = args.dias || 7;
        const limite = args.limite || 10;
        const result = await query(`
          SELECT id, nombre_negocio, fecha_ultimo_contacto, temperatura, estado, telefono_movil,
                 EXTRACT(DAY FROM NOW() - fecha_ultimo_contacto)::int as dias_sin_contacto
          FROM prospects
          WHERE (fecha_ultimo_contacto IS NULL OR fecha_ultimo_contacto < NOW() - INTERVAL '${dias} days')
          AND estado NOT IN ('cliente','perdido','descartado') ${userFilter}
          ORDER BY fecha_ultimo_contacto ASC NULLS FIRST LIMIT $${userParams.length + 1}
        `, [...userParams, limite]);
        return { prospectos: result.rows, total: result.rows.length };
      }

      case 'get_expiring_contracts': {
        const dias = args.dias || 90;
        const result = await query(`
          SELECT id, nombre_negocio, fecha_vencimiento_contrato, comercializadora_actual,
                 tarifa_actual, ahorro_estimado_eur, telefono_movil,
                 EXTRACT(DAY FROM fecha_vencimiento_contrato - NOW())::int as dias_hasta_vencimiento
          FROM prospects
          WHERE fecha_vencimiento_contrato BETWEEN NOW() AND NOW() + INTERVAL '${dias} days'
          AND estado NOT IN ('cliente','perdido','descartado') ${userFilter}
          ORDER BY fecha_vencimiento_contrato ASC
        `, userParams);
        return { contratos: result.rows, total: result.rows.length };
      }

      case 'get_activity_log': {
        const conditions = args.prospect_id ? 'AND ch.prospect_id = $2' : '';
        const params = args.prospect_id ? [userId, args.prospect_id, args.limite || 10] : [userId, args.limite || 10];
        const result = await query(`
          SELECT ch.tipo, ch.descripcion, ch.created_at, p.nombre_negocio
          FROM contact_history ch
          JOIN prospects p ON p.id = ch.prospect_id
          WHERE (p.asignado_a = $1 OR $1 IS NULL) ${conditions}
          ORDER BY ch.created_at DESC LIMIT $${params.length}
        `, params).catch(() => ({ rows: [] }));
        return { actividad: result.rows };
      }

      case 'get_zones_performance': {
        const result = await query(`
          SELECT z.nombre as zona, COUNT(p.id) as total_prospectos,
                 COUNT(*) FILTER (WHERE p.estado='cliente') as clientes,
                 COALESCE(SUM(p.ahorro_estimado_eur),0) as ahorro_potencial
          FROM zones z
          LEFT JOIN prospects p ON p.zona_id = z.id
          GROUP BY z.id, z.nombre ORDER BY total_prospectos DESC
        `).catch(() => ({ rows: [] }));
        return { zonas: result.rows };
      }

      default:
        return { error: `Tool '${name}' no implementada` };
    }
  } catch (err: any) {
    logger.error(`Error en tool ${name}:`, err.message);
    return { error: err.message };
  }
}

// ── Chat principal con function calling ───────────────────────────────────
export async function chat(
  userId: string,
  userRole: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<AgentResponse> {
  if (!env.GEMINI_API_KEY) {
    return {
      message: 'Para activar el Asistente IA necesitas configurar la clave GEMINI_API_KEY en el archivo .env. Puedes obtenerla gratis en https://aistudio.google.com',
      actions_taken: [],
    };
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: toolDeclarations }] as Tool[],
  });

  // Convertir historial al formato de Gemini
  const geminiHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const chatSession = model.startChat({ history: geminiHistory });
  const actionsTaken: string[] = [];

  // Primera respuesta
  let result = await chatSession.sendMessage(userMessage);
  let response = result.response;

  // Loop de function calling (máx 5 iteraciones)
  let iterations = 0;
  while (response.functionCalls()?.length && iterations < 5) {
    iterations++;
    const calls = response.functionCalls()!;
    const toolResults = [];

    for (const call of calls) {
      logger.info(`Agent tool call: ${call.name}`, call.args);
      actionsTaken.push(call.name);
      const toolResult = await executeTool(call.name, call.args, userId, userRole);
      toolResults.push({
        functionResponse: {
          name: call.name,
          response: toolResult,
        },
      });
    }

    result = await chatSession.sendMessage(toolResults as any);
    response = result.response;
  }

  return {
    message: response.text(),
    actions_taken: actionsTaken,
  };
}
