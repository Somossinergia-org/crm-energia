import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { prospectsApi, zonesApi } from '../services/prospects.service';
import { Prospect, ProspectFilters } from '../types/prospect';
import ProspectTable from '../components/prospects/ProspectTable';
import ProspectKanban from '../components/prospects/ProspectKanban';
import ProspectCards from '../components/prospects/ProspectCards';
import ProspectMap from '../components/prospects/ProspectMap';
import ProspectFiltersBar from '../components/prospects/ProspectFilters';
import ProspectModal from '../components/prospects/ProspectModal';
import { HiOutlineViewList, HiOutlineViewBoards, HiOutlineViewGrid, HiOutlineMap, HiOutlinePlus, HiOutlineUpload } from 'react-icons/hi';

type ViewMode = 'tabla' | 'kanban' | 'tarjetas' | 'mapa';

interface ProspectsProps {
  defaultView?: ViewMode;
}

export default function Prospects({ defaultView }: ProspectsProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(defaultView || 'tabla');
  const [filters, setFilters] = useState<ProspectFilters>(() => {
    const initialSearch = searchParams.get('search') || undefined;
    return {
      page: 1,
      limit: (defaultView || 'tabla') === 'kanban' || (defaultView || 'tabla') === 'mapa' ? 100 : 25,
      sort_by: 'created_at',
      sort_order: 'DESC',
      ...(initialSearch ? { search: initialSearch } : {}),
    };
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // Queries
  const { data: prospectsData, isLoading } = useQuery({
    queryKey: ['prospects', filters],
    queryFn: () => prospectsApi.getAll(filters),
  });

  const { data: zonesData } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zonesApi.getAll(),
  });

  const prospects = prospectsData?.data || [];
  const pagination = prospectsData?.pagination;
  const zones = zonesData?.data || [];

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      prospectsApi.updateStatus(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Prospect>) => prospectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      setShowModal(false);
      toast.success('Prospecto creado');
    },
    onError: () => toast.error('Error al crear prospecto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Prospect> }) =>
      prospectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      setShowModal(false);
      setSelectedProspect(null);
      toast.success('Prospecto actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => prospectsApi.importCSV(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      toast.success(`Importados ${result.data.imported} de ${result.data.total_rows} prospectos`);
    },
    onError: () => toast.error('Error al importar CSV'),
  });

  // Handlers
  const handleStatusChange = useCallback((id: string, estado: string) => {
    statusMutation.mutate({ id, estado });
  }, [statusMutation]);

  const handleSelect = useCallback((prospect: Prospect) => {
    navigate(`/pipeline/${prospect.id}`);
  }, [navigate]);

  const handleCall = useCallback((prospect: Prospect) => {
    window.open(`tel:${prospect.telefono_movil}`, '_self');
  }, []);

  const handleWhatsApp = useCallback((prospect: Prospect) => {
    const phone = prospect.whatsapp || prospect.telefono_movil;
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`;
    const msg = encodeURIComponent(
      `Hola ${prospect.nombre_contacto || ''}, le contacto de Somos Sinergia respecto a su suministro electrico.`
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
  }, []);

  const handleSave = useCallback((data: Partial<Prospect>) => {
    if (selectedProspect) {
      updateMutation.mutate({ id: selectedProspect.id, data });
    } else {
      createMutation.mutate(data);
    }
  }, [selectedProspect, updateMutation, createMutation]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) importMutation.mutate(file);
    };
    input.click();
  }, [importMutation]);

  const handleViewChange = (v: ViewMode) => {
    setView(v);
    // Kanban y mapa necesitan todos los registros
    setFilters(prev => ({
      ...prev,
      limit: v === 'kanban' || v === 'mapa' ? 100 : 25,
      page: 1,
    }));
  };

  const views = [
    { key: 'tabla' as const, icon: HiOutlineViewList, label: 'Tabla' },
    { key: 'kanban' as const, icon: HiOutlineViewBoards, label: 'Kanban' },
    { key: 'tarjetas' as const, icon: HiOutlineViewGrid, label: 'Tarjetas' },
    { key: 'mapa' as const, icon: HiOutlineMap, label: 'Mapa' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>

        <div className="flex items-center gap-2">
          {/* Selector de vista */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {views.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => handleViewChange(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Acciones */}
          <button onClick={handleImport} className="btn-secondary flex items-center gap-1.5">
            <HiOutlineUpload className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={() => { setSelectedProspect(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-1.5"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Filtros (no en kanban) */}
      {view !== 'kanban' && (
        <div className="card">
          <ProspectFiltersBar
            filters={filters}
            zones={zones}
            onChange={setFilters}
            total={pagination?.total || 0}
          />
        </div>
      )}

      {/* Vista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {view === 'tabla' && (
            <div className="card overflow-hidden">
              <ProspectTable
                prospects={prospects}
                onStatusChange={handleStatusChange}
                onSelect={handleSelect}
                onCall={handleCall}
                onWhatsApp={handleWhatsApp}
              />
            </div>
          )}

          {view === 'kanban' && (
            <ProspectKanban
              prospects={prospects}
              onStatusChange={handleStatusChange}
              onSelect={handleSelect}
            />
          )}

          {view === 'tarjetas' && (
            <ProspectCards
              prospects={prospects}
              onSelect={handleSelect}
              onCall={handleCall}
              onWhatsApp={handleWhatsApp}
              onStatusChange={handleStatusChange}
            />
          )}

          {view === 'mapa' && (
            <ProspectMap
              prospects={prospects}
              onSelect={handleSelect}
            />
          )}
        </>
      )}

      {/* Paginación (solo tabla y tarjetas) */}
      {(view === 'tabla' || view === 'tarjetas') && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}
              disabled={pagination.page <= 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProspectModal
          prospect={selectedProspect}
          zones={zones}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setSelectedProspect(null); }}
        />
      )}
    </div>
  );
}
