import api from './api';

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
}

export const DOCUMENT_TIPOS = [
  { value: 'contrato', label: 'Contrato', icon: '📄', color: 'text-green-700', bg: 'bg-green-100' },
  { value: 'factura', label: 'Factura', icon: '🧾', color: 'text-blue-700', bg: 'bg-blue-100' },
  { value: 'oferta', label: 'Oferta', icon: '📋', color: 'text-amber-700', bg: 'bg-amber-100' },
  { value: 'dni', label: 'DNI / CIF', icon: '🪪', color: 'text-purple-700', bg: 'bg-purple-100' },
  { value: 'otro', label: 'Otro', icon: '📎', color: 'text-gray-700', bg: 'bg-gray-100' },
];

export const documentsApi = {
  getByProspect: async (prospectId: string) => {
    return (await api.get(`/documents/prospect/${prospectId}`)).data;
  },

  upload: async (data: { prospect_id: string; nombre: string; tipo: string; notas?: string; archivo: File }) => {
    const formData = new FormData();
    formData.append('prospect_id', data.prospect_id);
    formData.append('nombre', data.nombre);
    formData.append('tipo', data.tipo);
    if (data.notas) formData.append('notas', data.notas);
    formData.append('archivo', data.archivo);
    return (await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },

  delete: async (id: string) => {
    return (await api.delete(`/documents/${id}`)).data;
  },
};
