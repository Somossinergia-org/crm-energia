import { useState, useRef, useCallback } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineLink,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineSparkles,
} from 'react-icons/hi';
import api from '../services/api';

// ─── Exported type ───────────────────────────────────────────────────────────
export interface ParsedBillData {
  comercializadora: string | null;
  cups: string | null;
  tarifa: string | null;
  periodoFacturacion: { desde: string | null; hasta: string | null; dias: number | null };
  potencias: number[];
  consumos: number[];
  preciosEnergia: number[];
  importePotencia: number | null;
  importeEnergia: number | null;
  importeTotal: number | null;
  impuestoElectrico: number | null;
  iva: number | null;
  alquilerContador: number | null;
  confianza: number;
  metodo?: string;
  camposExtraidos: string[];
  advertencias: string[];
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onResult: (data: ParsedBillData) => void;
  compact?: boolean;
}

// ─── Tab type ─────────────────────────────────────────────────────────────────
type TabId = 'foto' | 'pdf' | 'url';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-400' : 'bg-red-500';
  const textColor =
    value >= 80 ? 'text-green-700' : value >= 50 ? 'text-yellow-700' : 'text-red-700';
  const bgLight =
    value >= 80 ? 'bg-green-50' : value >= 50 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className={`rounded-lg p-2 ${bgLight}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold ${textColor}`}>Confianza extraccion</span>
        <span className={`text-xs font-bold ${textColor}`}>{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BillUploader({ onResult, compact = false }: Props) {
  // On mobile, Foto tab is first (index 0); on desktop order is kept the same
  const tabs: { id: TabId; label: string; icon: JSX.Element }[] = [
    { id: 'foto', label: 'Foto', icon: <HiOutlinePhotograph className="w-4 h-4" /> },
    { id: 'pdf', label: 'PDF', icon: <HiOutlineDocumentText className="w-4 h-4" /> },
    { id: 'url', label: 'Email/URL', icon: <HiOutlineLink className="w-4 h-4" /> },
  ];

  const [activeTab, setActiveTab] = useState<TabId>('foto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedBillData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDragOver, setPdfDragOver] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ── PDF handlers ────────────────────────────────────────────────────────────
  const handlePdfSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF');
      return;
    }
    setError(null);
    setResult(null);
    setPdfFile(file);
  };

  const handlePdfDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPdfDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePdfSelect(file);
  }, []);

  const handleExtractPdf = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('factura', pdfFile);
      const res = await api.post('/bill/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data as ParsedBillData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar el PDF');
    } finally {
      setLoading(false);
    }
  };

  // ── Photo handlers ──────────────────────────────────────────────────────────
  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan imagenes (JPG, PNG, WEBP)');
      return;
    }
    setError(null);
    setResult(null);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPhotoDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePhotoSelect(file);
  }, []);

  const handleExtractPhoto = async () => {
    if (!photoFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('foto', photoFile);
      const res = await api.post('/bill/extract-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data as ParsedBillData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setResult(null);
    setError(null);
    setPdfFile(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // ── Result section ──────────────────────────────────────────────────────────
  const ResultSection = ({ data }: { data: ParsedBillData }) => (
    <div className="mt-4 space-y-3">
      {/* Method badge */}
      <div className="flex items-center gap-2">
        {(data.metodo === 'gemini' || data.metodo === 'gemini-vision') ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            {data.metodo === 'gemini-vision' ? 'Completado con Gemini Vision' : 'Completado con IA'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
            Extraccion completada
          </span>
        )}
        <button
          onClick={handleReset}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <HiOutlineX className="w-3 h-3" /> Nueva extraccion
        </button>
      </div>

      {/* Confidence bar */}
      <ConfidenceBar value={data.confianza} />

      {/* Data grid */}
      <div className={`grid gap-2 text-xs ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {data.comercializadora && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">Comercializadora</p>
            <p className="font-semibold text-gray-800 truncate">{data.comercializadora}</p>
          </div>
        )}
        {data.cups && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">CUPS</p>
            <p className="font-mono font-semibold text-gray-800 truncate text-[10px]">{data.cups}</p>
          </div>
        )}
        {data.tarifa && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">Tarifa</p>
            <p className="font-semibold text-gray-800">{data.tarifa}</p>
          </div>
        )}
        {data.importeTotal !== null && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">Total factura</p>
            <p className="font-semibold text-gray-800">{data.importeTotal?.toFixed(2)} EUR</p>
          </div>
        )}
        {data.potencias.length > 0 && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">Potencias (kW)</p>
            <p className="font-semibold text-gray-800 truncate">{data.potencias.join(' / ')}</p>
          </div>
        )}
        {data.consumos.length > 0 && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">Consumos (kWh)</p>
            <p className="font-semibold text-gray-800 truncate">{data.consumos.join(' / ')}</p>
          </div>
        )}
        {data.periodoFacturacion.desde && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-400 uppercase tracking-wide text-[10px]">Periodo</p>
            <p className="font-semibold text-gray-800 text-[10px]">
              {data.periodoFacturacion.desde} — {data.periodoFacturacion.hasta}
              {data.periodoFacturacion.dias && ` (${data.periodoFacturacion.dias}d)`}
            </p>
          </div>
        )}
      </div>

      {/* Extracted fields chips */}
      {data.camposExtraidos.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Campos extraidos</p>
          <div className="flex flex-wrap gap-1">
            {data.camposExtraidos.map((campo, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                {campo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {data.advertencias.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2">
          <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
            <HiOutlineExclamation className="w-3.5 h-3.5" />
            Advertencias
          </p>
          <ul className="space-y-0.5">
            {data.advertencias.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Use data button */}
      <button
        onClick={() => onResult(data)}
        className="w-full btn-primary text-sm py-2"
      >
        Usar estos datos
      </button>
    </div>
  );

  // ── Spinner overlay ─────────────────────────────────────────────────────────
  const LoadingOverlay = () => (
    <div className="mt-4 flex flex-col items-center justify-center gap-3 py-8">
      <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
      </svg>
      <p className="text-sm text-gray-600 font-medium">Analizando factura...</p>
      {activeTab === 'foto' && (
        <p className="text-xs text-indigo-500">Procesando con Gemini Vision IA</p>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Importar datos de factura</h3>
            <p className="text-xs text-gray-500">Extrae automaticamente los datos energeticos</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'url') return; // disabled
              setActiveTab(tab.id);
              setError(null);
            }}
            disabled={tab.id === 'url'}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors rounded-t ${
              tab.id === 'url'
                ? 'border-transparent text-gray-300 cursor-not-allowed'
                : activeTab === tab.id
                ? 'border-primary-600 text-primary-700 bg-primary-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'url' && (
              <span className="text-[9px] bg-gray-100 text-gray-400 px-1 rounded">Pronto</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content: FOTO */}
      {activeTab === 'foto' && !loading && !result && (
        <div className="space-y-3">
          {/* Hidden inputs */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }}
          />

          {!photoFile ? (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
                onDragLeave={() => setPhotoDragOver(false)}
                onDrop={handlePhotoDrop}
                onClick={() => photoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl cursor-pointer transition-all text-center py-6 px-4 ${
                  photoDragOver
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <HiOutlinePhotograph className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Arrastra tu foto aqui</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
                  className="mt-3 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                >
                  Seleccionar archivo
                </button>
              </div>

              {/* Camera button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
              >
                <span>📷</span>
                Abrir camara
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                Requiere API key de Gemini configurada
              </p>
            </>
          ) : (
            <>
              {/* Preview */}
              {photoPreview && (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={photoPreview}
                    alt="Preview factura"
                    className="w-full object-contain max-h-48"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 shadow"
                  >
                    <HiOutlineX className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                <HiOutlinePhotograph className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate flex-1">{photoFile.name}</span>
                <span className="text-gray-400 shrink-0">{formatBytes(photoFile.size)}</span>
              </div>
              <button onClick={handleExtractPhoto} className="w-full btn-primary text-sm py-2">
                Extraer con IA
              </button>
            </>
          )}
        </div>
      )}

      {/* Tab content: PDF */}
      {activeTab === 'pdf' && !loading && !result && (
        <div className="space-y-3">
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfSelect(f); }}
          />

          {!pdfFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
              onDragLeave={() => setPdfDragOver(false)}
              onDrop={handlePdfDrop}
              onClick={() => pdfInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl cursor-pointer transition-all text-center py-8 px-4 ${
                pdfDragOver
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <HiOutlineDocumentText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Arrastra tu factura PDF aqui</p>
              <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); pdfInputRef.current?.click(); }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
              >
                <HiOutlineUpload className="w-3.5 h-3.5" />
                Seleccionar archivo
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-3">
                <HiOutlineDocumentText className="w-5 h-5 text-red-400 shrink-0" />
                <span className="truncate flex-1 font-medium">{pdfFile.name}</span>
                <span className="text-gray-400 shrink-0">{formatBytes(pdfFile.size)}</span>
                <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 ml-1">
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleExtractPdf} className="w-full btn-primary text-sm py-2">
                Extraer datos
              </button>
            </>
          )}
        </div>
      )}

      {/* Tab content: URL (disabled/info only) */}
      {activeTab === 'url' && !loading && !result && (
        <div className="py-8 text-center text-gray-400">
          <HiOutlineLink className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Proximamente</p>
          <p className="text-xs text-gray-300 mt-1">Extraccion desde email de Gmail</p>
        </div>
      )}

      {/* Loading overlay */}
      {loading && <LoadingOverlay />}

      {/* Error */}
      {error && !loading && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          <HiOutlineExclamation className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && !loading && <ResultSection data={result} />}
    </div>
  );
}
