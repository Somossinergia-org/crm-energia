import { query } from '../config/database';

export interface Zone {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export async function findAll(): Promise<Zone[]> {
  const result = await query<Zone>(
    'SELECT * FROM zones WHERE activa = true ORDER BY nombre'
  );
  return result.rows;
}

export async function findById(id: string): Promise<Zone | null> {
  const result = await query<Zone>('SELECT * FROM zones WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: { nombre: string; descripcion?: string; color?: string }): Promise<Zone> {
  const result = await query<Zone>(
    `INSERT INTO zones (nombre, descripcion, color) VALUES ($1, $2, $3) RETURNING *`,
    [data.nombre, data.descripcion || '', data.color || '#3b82f6']
  );
  return result.rows[0];
}

export async function update(id: string, data: Partial<Zone>): Promise<Zone | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  if (fields.length === 0) return findById(id);

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await query<Zone>(
    `UPDATE zones SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM zones WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
