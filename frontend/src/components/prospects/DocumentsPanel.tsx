import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, DOCUMENT_TIPOS, ProspectDocument } from '../../services/documents.service';
import { toast } from 'react-toastify';
import {
  HiOutlineDocumentAdd,
  HiOutlineTrash,
  HiOutlineDownload,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';

interface Props {
  prospectId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPanel({ prospectId }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', tipo: 'contrato', notas: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ['documents', prospectId],
    queryFn: () => documentsApi.getByProspect(prospectId),
  });

  const documents: ProspectDocument[] = data?.data || [];

  const uploadMutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', prospectId] });
      toast.success('Documento subido');
      resetForm();
    },
    onError: () => toast.error('Error al subir documento'),
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', prospectId] });
      toast.success('Documento eliminado');
    },
    onError: () => toast.error('Error al eliminar documento'),
  });

  const resetForm = () => {
    setShowForm(false);
    setFormData({ nombre: '', tipo: 'contrato', notas: '' });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!selectedFile) return toast.warn('Selecciona un archivo');
    if (!formData.nombre.trim()) return toast.warn('Escribe un nombre para el documento');

    uploadMutation.mutate({
      prospect_id: prospectId,
      nombre: formData.nombre.trim(),
      tipo: formData.tipo,
      notas: formData.notas || undefined,
      archivo: selectedFile,
    });
  };

  const handleDelete = (doc: ProspectDocument) => {
    if (window.confirm(`Eliminar "${doc.nombre}"?`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.nombre) {
        setFormData((f) => ({ ...f, nombre: file.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span>📁</span>
          Documentos ({documents.length})
        </h3>
        <div className="flex items-center gap-2">
          {!showForm && (
            <span
              onClick={(e) => { e.stopPropagation(); setExpanded(true); setShowForm(true); }}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              + Subir
            </span>
          )}
          {expanded ? <HiOutlineChevronUp className="w-4 h-4 text-gray-400" /> : <HiOutlineChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Upload form */}
          {showForm && (
            <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-3 bg-gray-50">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del documento"
                  className="input-field text-sm"
                />
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData((f) => ({ ...f, tipo: e.target.value }))}
                  className="input-field text-sm"
                >
                  {DOCUMENT_TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={formData.notas}
                onChange={(e) => setFormData((f) => ({ ...f, notas: e.target.value }))}
                placeholder="Notas (opcional)"
                className="input-field text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <button onClick={resetForm} className="btn-secondary text-sm py-1.5">
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploadMutation.isPending || !selectedFile}
                  className="btn-primary text-sm py-1.5 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadMutation.isPending ? (
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <HiOutlineDocumentAdd className="w-4 h-4" />
                  )}
                  Subir
                </button>
              </div>
            </div>
          )}

          {/* Document list */}
          {documents.length === 0 && !showForm ? (
            <p className="text-xs text-gray-400 text-center py-3">
              Sin documentos. Sube contratos, facturas, ofertas...
            </p>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc) => {
                const tipoCfg = DOCUMENT_TIPOS.find((t) => t.value === doc.tipo);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-gray-50 group"
                  >
                    <span className="text-lg shrink-0">{tipoCfg?.icon || '📎'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.nombre}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded ${tipoCfg?.bg} ${tipoCfg?.color} text-xs`}>
                          {tipoCfg?.label || doc.tipo}
                        </span>
                        <span>{formatFileSize(doc.archivo_size)}</span>
                        <span>{new Date(doc.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                      {doc.notas && <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.notas}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <a
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                        title="Descargar"
                      >
                        <HiOutlineDownload className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
