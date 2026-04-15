import { query } from '../config/database';

export interface Visit {
  id: string;
  prospect_id: string;
  user_id: string;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_minutos: number;
  estado: string;
  resultado: string | null;
  notas_resultado: string;
  direccion: string;
  coordenadas_lat: number | null;
  coordenadas_lng: number | null;
  orden_ruta: number;
  color: string;
  created_at: string;
  updated_at: string;
  // Joins
  prospect_nombre?: string;
  prospect_telefono?: string;
  prospect_direccion?: string;
  user_nombre?: string;
}

// Listar visitas por rango de fechas
export async function findByDateRange(
  userId: string,
  userRole: string,
  start: string,
  end: string
): Promise<Visit[]> {
  let where = 'WHERE v.fecha_inicio >= $1 AND v.fecha_inicio <= $2';
  const params: any[] = [start, end];

  if (userRole === 'comercial') {
    where += ' AND v.user_id = $3';
    params.push(userId);
  }

  const result = await query<Visit>(
    `SELECT v.*,
            p.nombre_negocio as prospect_nombre,
            p.telefono_movil as prospect_telefono,
            p.direccion_completa as prospect_direccion,
            u.nombre as user_nombre
     FROM visits v
     LEFT JOIN prospects p ON v.prospect_id = p.id
     LEFT JOIN users u ON v.user_id = u.id
     ${where}
     ORDER BY v.fecha_inicio ASC, v.orden_ruta ASC`,
    params
  );
  return result.rows;
}

// Buscar por ID
export async function findById(id: string): Promise<Visit | null> {
  const result = await query<Visit>(
    `SELECT v.*,
            p.nombre_negocio as prospect_nombre,
            p.telefono_movil as prospect_telefono,
            p.direccion_completa as prospect_direccion
     FROM visits v
     LEFT JOIN prospects p ON v.prospect_id = p.id
     WHERE v.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Crear visita
export async function create(data: {
  prospect_id: string;
  user_id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_minutos?: number;
  direccion?: string;
  coordenadas_lat?: number;
  coordenadas_lng?: number;
  color?: string;
}): Promise<Visit> {
  const result = await query<Visit>(
    `INSERT INTO visits
       (prospect_id, user_id, titulo, descripcion, fecha_inicio, fecha_fin,
        duracion_minutos, direccion, coordenadas_lat, coordenadas_lng, color)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.prospect_id,
      data.user_id,
      data.titulo,
      data.descripcion || '',
      data.fecha_inicio,
      data.fecha_fin,
      data.duracion_minutos || 20,
      data.direccion || '',
      data.coordenadas_lat || null,
      data.coordenadas_lng || null,
      data.color || '#3b82f6',
    ]
  );
  return result.rows[0];
}

// Actualizar visita
export async function update(id: string, data: Partial<Visit>): Promise<Visit | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const allowed = [
    'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'duracion_minutos',
    'estado', 'resultado', 'notas_resultado', 'direccion',
    'coordenadas_lat', 'coordenadas_lng', 'orden_ruta', 'color',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && allowed.includes(key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return findById(id);

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await query<Visit>(
    `UPDATE visits SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

// Eliminar visita
export async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM visits WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// Visitas de hoy para un usuario
export async function findToday(userId: string): Promise<Visit[]> {
  const result = await query<Visit>(
    `SELECT v.*, p.nombre_negocio as prospect_nombre,
            p.telefono_movil as prospect_telefono,
            p.direccion_completa as prospect_direccion
     FROM visits v
     LEFT JOIN prospects p ON v.prospect_id = p.id
     WHERE v.user_id = $1
       AND v.fecha_inicio >= CURRENT_DATE
       AND v.fecha_inicio < CURRENT_DATE + INTERVAL '1 day'
     ORDER BY v.fecha_inicio ASC`,
    [userId]
  );
  return result.rows;
}
