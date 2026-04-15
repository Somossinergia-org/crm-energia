import { query } from '../config/database';

export interface ContactHistory {
  id: string;
  prospect_id: string;
  user_id: string | null;
  tipo: string;
  resultado: string;
  nota: string;
  duracion_minutos: number | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  proxima_accion: string;
  fecha_proxima_accion: string | null;
  adjuntos: string[];
  created_at: string;
  // Joins
  user_nombre?: string;
  prospect_nombre?: string;
}

// Listar historial de un prospecto
export async function findByProspect(prospectId: string): Promise<ContactHistory[]> {
  const result = await query<ContactHistory>(
    `SELECT ch.*, u.nombre as user_nombre
     FROM contact_history ch
     LEFT JOIN users u ON ch.user_id = u.id
     WHERE ch.prospect_id = $1
     ORDER BY ch.created_at DESC`,
    [prospectId]
  );
  return result.rows;
}

// Listar actividad reciente (todos los prospectos)
export async function findRecent(
  userId?: string,
  userRole?: string,
  limit: number = 20
): Promise<ContactHistory[]> {
  let where = '';
  const params: any[] = [limit];

  if (userRole === 'comercial' && userId) {
    where = 'WHERE ch.user_id = $2';
    params.push(userId);
  }

  const result = await query<ContactHistory>(
    `SELECT ch.*, u.nombre as user_nombre, p.nombre_negocio as prospect_nombre
     FROM contact_history ch
     LEFT JOIN users u ON ch.user_id = u.id
     LEFT JOIN prospects p ON ch.prospect_id = p.id
     ${where}
     ORDER BY ch.created_at DESC
     LIMIT $1`,
    params
  );
  return result.rows;
}

// Crear entrada en historial
export async function create(data: {
  prospect_id: string;
  user_id: string;
  tipo: string;
  resultado?: string;
  nota?: string;
  duracion_minutos?: number;
  estado_anterior?: string;
  estado_nuevo?: string;
  proxima_accion?: string;
  fecha_proxima_accion?: string;
}): Promise<ContactHistory> {
  const result = await query<ContactHistory>(
    `INSERT INTO contact_history
       (prospect_id, user_id, tipo, resultado, nota, duracion_minutos,
        estado_anterior, estado_nuevo, proxima_accion, fecha_proxima_accion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.prospect_id,
      data.user_id,
      data.tipo,
      data.resultado || 'neutro',
      data.nota || '',
      data.duracion_minutos || null,
      data.estado_anterior || null,
      data.estado_nuevo || null,
      data.proxima_accion || '',
      data.fecha_proxima_accion || null,
    ]
  );

  // Actualizar fecha_ultimo_contacto del prospecto
  if (['llamada', 'visita_presencial', 'whatsapp', 'email_enviado'].includes(data.tipo)) {
    await query(
      `UPDATE prospects SET
         fecha_ultimo_contacto = NOW(),
         numero_intentos_contacto = numero_intentos_contacto + 1,
         updated_at = NOW()
       WHERE id = $1`,
      [data.prospect_id]
    );
  }

  // Si tiene próxima acción, actualizar en el prospecto
  if (data.fecha_proxima_accion) {
    await query(
      `UPDATE prospects SET fecha_proximo_contacto = $1, updated_at = NOW() WHERE id = $2`,
      [data.fecha_proxima_accion, data.prospect_id]
    );
  }

  return result.rows[0];
}

// Eliminar entrada
export async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM contact_history WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// Contar por tipo (para stats)
export async function countByType(userId?: string, userRole?: string) {
  let where = '';
  const params: any[] = [];

  if (userRole === 'comercial' && userId) {
    where = 'WHERE ch.user_id = $1';
    params.push(userId);
  }

  const result = await query(
    `SELECT tipo, COUNT(*) as count
     FROM contact_history ch ${where}
     GROUP BY tipo`,
    params
  );
  return result.rows;
}

// Contar actividad de hoy
export async function countToday(userId: string) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE tipo = 'llamada') as llamadas,
       COUNT(*) FILTER (WHERE tipo = 'visita_presencial') as visitas,
       COUNT(*) FILTER (WHERE tipo = 'whatsapp') as whatsapp,
       COUNT(*) FILTER (WHERE tipo = 'email_enviado') as emails,
       COUNT(*) as total
     FROM contact_history
     WHERE user_id = $1 AND created_at >= CURRENT_DATE`,
    [userId]
  );
  return result.rows[0];
}
