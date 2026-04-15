import { query } from '../config/database';

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
  updated_at: string;
}

// Helper: genera filtro SQL para comercial
function roleFilter(alias: string, userId?: string, userRole?: string): { sql: string; params: any[]; nextIdx: number } {
  if (userRole === 'comercial' && userId) {
    return { sql: `${alias}.asignado_a = $1`, params: [userId], nextIdx: 2 };
  }
  return { sql: '', params: [], nextIdx: 1 };
}

export const serviciosModel = {
  async getByProspect(prospectId: string) {
    const sql = `SELECT * FROM prospect_servicios WHERE prospect_id = $1 ORDER BY created_at`;
    return (await query(sql, [prospectId])).rows;
  },

  async getById(id: string) {
    return (await query(`SELECT * FROM prospect_servicios WHERE id = $1`, [id])).rows[0];
  },

  async upsert(data: {
    prospect_id: string;
    servicio: string;
    estado?: string;
    proveedor_actual?: string;
    gasto_actual_eur?: number | null;
    precio_ofertado_eur?: number | null;
    ahorro_estimado_eur?: number | null;
    fecha_contratacion?: string;
    fecha_vencimiento?: string;
    datos?: Record<string, any>;
    notas?: string;
  }) {
    const sql = `INSERT INTO prospect_servicios (prospect_id, servicio, estado, proveedor_actual, gasto_actual_eur, precio_ofertado_eur, ahorro_estimado_eur, fecha_contratacion, fecha_vencimiento, datos, notas)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (prospect_id, servicio) DO UPDATE SET
        estado = COALESCE(EXCLUDED.estado, prospect_servicios.estado),
        proveedor_actual = COALESCE(EXCLUDED.proveedor_actual, prospect_servicios.proveedor_actual),
        gasto_actual_eur = COALESCE(EXCLUDED.gasto_actual_eur, prospect_servicios.gasto_actual_eur),
        precio_ofertado_eur = COALESCE(EXCLUDED.precio_ofertado_eur, prospect_servicios.precio_ofertado_eur),
        ahorro_estimado_eur = COALESCE(EXCLUDED.ahorro_estimado_eur, prospect_servicios.ahorro_estimado_eur),
        fecha_contratacion = COALESCE(EXCLUDED.fecha_contratacion, prospect_servicios.fecha_contratacion),
        fecha_vencimiento = COALESCE(EXCLUDED.fecha_vencimiento, prospect_servicios.fecha_vencimiento),
        datos = COALESCE(EXCLUDED.datos, prospect_servicios.datos),
        notas = COALESCE(EXCLUDED.notas, prospect_servicios.notas),
        updated_at = NOW()
      RETURNING *`;
    return (await query(sql, [
      data.prospect_id, data.servicio, data.estado || 'pendiente',
      data.proveedor_actual || '', data.gasto_actual_eur, data.precio_ofertado_eur,
      data.ahorro_estimado_eur, data.fecha_contratacion || null, data.fecha_vencimiento || null,
      JSON.stringify(data.datos || {}), data.notas || '',
    ])).rows[0];
  },

  async update(id: string, data: Partial<ProspectServicio>) {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'id' && key !== 'prospect_id' && key !== 'created_at') {
        fields.push(`${key} = $${i}`);
        values.push(key === 'datos' ? JSON.stringify(val) : val);
        i++;
      }
    }
    if (!fields.length) return null;
    fields.push(`updated_at = NOW()`);
    values.push(id);
    return (await query(`UPDATE prospect_servicios SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values)).rows[0];
  },

  async delete(id: string) {
    return (await query(`DELETE FROM prospect_servicios WHERE id = $1`, [id])).rowCount;
  },

  async findAllWithProspect(
    filters: { servicio?: string; estado?: string; search?: string; page?: number; limit?: number },
    userId?: string,
    userRole?: string
  ) {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    // Filtro por rol: comercial solo ve servicios de sus prospectos
    if (userRole === 'comercial' && userId) {
      conditions.push(`p.asignado_a = $${i++}`);
      params.push(userId);
    }

    if (filters.servicio) {
      conditions.push(`ps.servicio = $${i++}`);
      params.push(filters.servicio);
    }
    if (filters.estado) {
      conditions.push(`ps.estado = $${i++}`);
      params.push(filters.estado);
    }
    if (filters.search) {
      conditions.push(`(p.nombre_negocio ILIKE $${i} OR p.nombre_contacto ILIKE $${i})`);
      params.push(`%${filters.search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const countResult = await query(`SELECT COUNT(*) as total FROM prospect_servicios ps JOIN prospects p ON p.id = ps.prospect_id ${where}`, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const rows = (await query(
      `SELECT ps.*, p.nombre_negocio, p.nombre_contacto, p.municipio, p.provincia, p.categoria, p.estado as prospect_estado
       FROM prospect_servicios ps
       JOIN prospects p ON p.id = ps.prospect_id
       ${where}
       ORDER BY ps.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )).rows;

    return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getGlobalStats(userId?: string, userRole?: string) {
    const rf = roleFilter('p', userId, userRole);
    const joinClause = rf.sql ? `JOIN prospects p ON p.id = ps.prospect_id WHERE ${rf.sql}` : '';
    const fromClause = rf.sql
      ? `FROM prospect_servicios ps JOIN prospects p ON p.id = ps.prospect_id WHERE ${rf.sql}`
      : `FROM prospect_servicios ps`;

    const sql = `SELECT
      COUNT(DISTINCT ps.prospect_id) as total_negocios,
      COUNT(*) as total_servicios,
      COUNT(*) FILTER (WHERE ps.estado = 'contratado') as contratados,
      COUNT(*) FILTER (WHERE ps.estado IN ('interesado','oferta_enviada','negociando')) as en_proceso,
      COALESCE(SUM(ps.precio_ofertado_eur) FILTER (WHERE ps.estado = 'contratado'), 0) as facturacion_mensual,
      COALESCE(SUM(ps.ahorro_estimado_eur) FILTER (WHERE ps.estado = 'contratado'), 0) as ahorro_total
      ${fromClause}`;
    return (await query(sql, rf.params)).rows[0];
  },

  async getStatsByServicio(userId?: string, userRole?: string) {
    const rf = roleFilter('p', userId, userRole);
    const fromClause = rf.sql
      ? `FROM prospect_servicios ps JOIN prospects p ON p.id = ps.prospect_id WHERE ${rf.sql}`
      : `FROM prospect_servicios ps`;

    const sql = `SELECT ps.servicio,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ps.estado = 'contratado') as contratados,
      COUNT(*) FILTER (WHERE ps.estado = 'interesado') as interesados,
      COUNT(*) FILTER (WHERE ps.estado = 'oferta_enviada') as ofertas,
      COALESCE(SUM(ps.precio_ofertado_eur) FILTER (WHERE ps.estado = 'contratado'), 0) as ingresos_mensuales,
      COALESCE(SUM(ps.ahorro_estimado_eur) FILTER (WHERE ps.estado = 'contratado'), 0) as ahorro_total
      ${fromClause} GROUP BY ps.servicio ORDER BY total DESC`;
    return (await query(sql, rf.params)).rows;
  },
};
