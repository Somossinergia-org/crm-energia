import { query } from '../config/database';

export interface ProspectDocument {
  id: string;
  prospect_id: string;
  uploaded_by: string;
  nombre: string;
  tipo: string;
  archivo_url: string;
  archivo_nombre: string;
  archivo_size: number;
  archivo_mime: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export const documentsModel = {
  async getByProspect(prospectId: string) {
    const sql = `SELECT * FROM prospect_documents WHERE prospect_id = $1 ORDER BY created_at DESC`;
    return (await query(sql, [prospectId])).rows;
  },

  async getById(id: string) {
    return (await query(`SELECT * FROM prospect_documents WHERE id = $1`, [id])).rows[0];
  },

  async create(data: {
    prospect_id: string;
    uploaded_by: string;
    nombre: string;
    tipo: string;
    archivo_url: string;
    archivo_nombre: string;
    archivo_size: number;
    archivo_mime?: string;
    notas?: string;
  }) {
    const sql = `INSERT INTO prospect_documents (prospect_id, uploaded_by, nombre, tipo, archivo_url, archivo_nombre, archivo_size, archivo_mime, notas)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`;
    return (await query(sql, [
      data.prospect_id,
      data.uploaded_by,
      data.nombre,
      data.tipo,
      data.archivo_url,
      data.archivo_nombre,
      data.archivo_size,
      data.archivo_mime || null,
      data.notas || null,
    ])).rows[0];
  },

  async delete(id: string) {
    return (await query(`DELETE FROM prospect_documents WHERE id = $1`, [id])).rowCount;
  },
};
