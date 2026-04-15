import { query } from '../config/database';

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
  estado: string;
  prioridad: string;
  temperatura: string;
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
  created_by: string | null;
  // Joins
  zona_nombre?: string;
  zona_color?: string;
  asignado_nombre?: string;
}

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

// Listar prospectos con filtros, paginación y joins
export async function findAll(filters: ProspectFilters, userId?: string, userRole?: string) {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  // Restricción por rol: comercial solo ve sus prospectos
  if (userRole === 'comercial' && userId) {
    conditions.push(`p.asignado_a = $${paramIdx++}`);
    params.push(userId);
  }

  // Filtros
  if (filters.estado) {
    conditions.push(`p.estado = $${paramIdx++}`);
    params.push(filters.estado);
  }
  if (filters.prioridad) {
    conditions.push(`p.prioridad = $${paramIdx++}`);
    params.push(filters.prioridad);
  }
  if (filters.temperatura) {
    conditions.push(`p.temperatura = $${paramIdx++}`);
    params.push(filters.temperatura);
  }
  if (filters.categoria) {
    conditions.push(`p.categoria = $${paramIdx++}`);
    params.push(filters.categoria);
  }
  if (filters.zona_id) {
    conditions.push(`p.zona_id = $${paramIdx++}`);
    params.push(filters.zona_id);
  }
  if (filters.asignado_a) {
    conditions.push(`p.asignado_a = $${paramIdx++}`);
    params.push(filters.asignado_a);
  }
  if (filters.provincia) {
    conditions.push(`p.provincia ILIKE $${paramIdx++}`);
    params.push(`%${filters.provincia}%`);
  }
  if (filters.fuente) {
    conditions.push(`p.fuente = $${paramIdx++}`);
    params.push(filters.fuente);
  }
  if (filters.search) {
    conditions.push(`(
      p.nombre_negocio ILIKE $${paramIdx} OR
      p.nombre_contacto ILIKE $${paramIdx} OR
      p.email_principal ILIKE $${paramIdx} OR
      p.telefono_movil ILIKE $${paramIdx} OR
      p.municipio ILIKE $${paramIdx}
    )`);
    params.push(`%${filters.search}%`);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Ordenación
  const allowedSorts = [
    'nombre_negocio', 'estado', 'prioridad', 'temperatura', 'categoria',
    'provincia', 'created_at', 'updated_at', 'fecha_ultimo_contacto',
    'fecha_proximo_contacto', 'gasto_mensual_estimado_eur', 'ahorro_estimado_eur',
  ];
  const sortBy = allowedSorts.includes(filters.sort_by || '') ? filters.sort_by : 'created_at';
  const sortOrder = filters.sort_order === 'ASC' ? 'ASC' : 'DESC';

  // Paginación
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 25));
  const offset = (page - 1) * limit;

  // Contar total
  const countResult = await query(
    `SELECT COUNT(*) as total FROM prospects p ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Query principal con joins
  const result = await query<Prospect>(
    `SELECT p.*,
            z.nombre as zona_nombre,
            z.color as zona_color,
            u.nombre as asignado_nombre
     FROM prospects p
     LEFT JOIN zones z ON p.zona_id = z.id
     LEFT JOIN users u ON p.asignado_a = u.id
     ${where}
     ORDER BY p.${sortBy} ${sortOrder}
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Buscar por ID
export async function findById(id: string): Promise<Prospect | null> {
  const result = await query<Prospect>(
    `SELECT p.*,
            z.nombre as zona_nombre,
            z.color as zona_color,
            u.nombre as asignado_nombre
     FROM prospects p
     LEFT JOIN zones z ON p.zona_id = z.id
     LEFT JOIN users u ON p.asignado_a = u.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Crear prospecto
export async function create(data: Partial<Prospect>): Promise<Prospect> {
  const fields = Object.keys(data).filter(k => data[k as keyof Prospect] !== undefined);
  const values = fields.map(k => data[k as keyof Prospect]);
  const placeholders = fields.map((_, i) => `$${i + 1}`);

  const result = await query<Prospect>(
    `INSERT INTO prospects (${fields.join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING *`,
    values
  );
  return result.rows[0];
}

// Actualizar prospecto
export async function update(id: string, data: Partial<Prospect>): Promise<Prospect | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<Prospect>(
    `UPDATE prospects SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

// Eliminar prospecto
export async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM prospects WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// Actualizar estado (acción rápida)
export async function updateStatus(id: string, estado: string): Promise<Prospect | null> {
  const result = await query<Prospect>(
    `UPDATE prospects SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [estado, id]
  );
  return result.rows[0] || null;
}

// Contar por estado (para kanban)
export async function countByStatus(userId?: string, userRole?: string) {
  let where = '';
  const params: any[] = [];
  if (userRole === 'comercial' && userId) {
    where = 'WHERE asignado_a = $1';
    params.push(userId);
  }

  const result = await query(
    `SELECT estado, COUNT(*) as count FROM prospects ${where} GROUP BY estado`,
    params
  );
  return result.rows;
}

// Estadísticas rápidas
export async function getStats(userId?: string, userRole?: string) {
  let where = '';
  const params: any[] = [];
  if (userRole === 'comercial' && userId) {
    where = 'WHERE asignado_a = $1';
    params.push(userId);
  }

  const result = await query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE estado = 'contrato_firmado') as contratos,
       COUNT(*) FILTER (WHERE estado = 'interesado') as interesados,
       COUNT(*) FILTER (WHERE estado = 'oferta_enviada') as ofertas,
       COUNT(*) FILTER (WHERE fecha_proximo_contacto <= NOW() AND estado NOT IN ('contrato_firmado','rechazado','perdido')) as pendientes_hoy,
       COALESCE(SUM(ahorro_estimado_eur) FILTER (WHERE estado = 'contrato_firmado'), 0) as ahorro_total,
       COALESCE(SUM(margen_estimado_eur) FILTER (WHERE estado = 'contrato_firmado'), 0) as margen_total
     FROM prospects ${where}`,
    params
  );
  return result.rows[0];
}

// Buscar clientes (prospects con al menos un servicio contratado)
export async function findClients(filters: ProspectFilters, userId?: string, userRole?: string) {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (userRole === 'comercial' && userId) {
    conditions.push(`p.asignado_a = $${paramIdx++}`);
    params.push(userId);
  }

  if (filters.search) {
    conditions.push(`(
      p.nombre_negocio ILIKE $${paramIdx} OR
      p.nombre_contacto ILIKE $${paramIdx} OR
      p.email_principal ILIKE $${paramIdx} OR
      p.telefono_movil ILIKE $${paramIdx} OR
      p.municipio ILIKE $${paramIdx}
    )`);
    params.push(`%${filters.search}%`);
    paramIdx++;
  }
  if (filters.categoria) {
    conditions.push(`p.categoria = $${paramIdx++}`);
    params.push(filters.categoria);
  }
  if (filters.provincia) {
    conditions.push(`p.provincia ILIKE $${paramIdx++}`);
    params.push(`%${filters.provincia}%`);
  }

  const where = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 25));
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(DISTINCT p.id) as total
     FROM prospects p
     INNER JOIN prospect_servicios ps ON ps.prospect_id = p.id AND ps.estado = 'contratado'
     WHERE 1=1 ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await query<Prospect>(
    `SELECT DISTINCT p.*,
            z.nombre as zona_nombre,
            z.color as zona_color,
            u.nombre as asignado_nombre
     FROM prospects p
     INNER JOIN prospect_servicios ps ON ps.prospect_id = p.id AND ps.estado = 'contratado'
     LEFT JOIN zones z ON p.zona_id = z.id
     LEFT JOIN users u ON p.asignado_a = u.id
     WHERE 1=1 ${where}
     ORDER BY p.fecha_conversion DESC NULLS LAST, p.updated_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    data: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Estadísticas de clientes
export async function getClientStats(userId?: string, userRole?: string) {
  let roleFilter = '';
  const params: any[] = [];
  if (userRole === 'comercial' && userId) {
    roleFilter = 'AND p.asignado_a = $1';
    params.push(userId);
  }

  const result = await query(
    `SELECT
       COUNT(DISTINCT p.id) as total_clientes,
       COUNT(ps.id) as total_servicios,
       COALESCE(SUM(ps.precio_ofertado_eur), 0) as facturacion_mensual,
       COUNT(ps.id) FILTER (WHERE ps.fecha_vencimiento <= NOW() + INTERVAL '60 days' AND ps.fecha_vencimiento > NOW()) as renovaciones_proximas,
       COUNT(ps.id) FILTER (WHERE ps.fecha_vencimiento <= NOW()) as servicios_vencidos
     FROM prospects p
     INNER JOIN prospect_servicios ps ON ps.prospect_id = p.id AND ps.estado = 'contratado'
     WHERE 1=1 ${roleFilter}`,
    params
  );
  return result.rows[0];
}

// Insertar múltiples (para CSV)
export async function bulkCreate(prospects: Partial<Prospect>[]): Promise<number> {
  let inserted = 0;
  for (const p of prospects) {
    try {
      await create(p);
      inserted++;
    } catch {
      // Saltar filas con error
    }
  }
  return inserted;
}
