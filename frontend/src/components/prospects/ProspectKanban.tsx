import { useState } from 'react';
import { Prospect, ESTADO_CONFIG, ESTADOS, TEMPERATURA_CONFIG } from '../../types/prospect';

interface Props {
  prospects: Prospect[];
  onStatusChange: (id: string, estado: string) => void;
  onSelect: (prospect: Prospect) => void;
}

export default function ProspectKanban({ prospects, onStatusChange, onSelect }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Agrupar por estado
  const columns = ESTADOS.map((estado) => ({
    estado,
    config: ESTADO_CONFIG[estado],
    items: prospects.filter((p) => p.estado === estado),
  }));

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (estado: string) => {
    if (draggedId) {
      onStatusChange(draggedId, estado);
      setDraggedId(null);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
      {columns.map(({ estado, config, items }) => (
        <div
          key={estado}
          className="flex-shrink-0 w-64 bg-gray-50 rounded-lg"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(estado)}
        >
          {/* Header columna */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {items.length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 min-h-[200px]">
            {items.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(p.id)}
                onClick={() => onSelect(p)}
                className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer
                  hover:shadow-md transition-shadow
                  ${draggedId === p.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                    {p.nombre_negocio}
                  </h4>
                  <span className="text-xs ml-1 flex-shrink-0">
                    {TEMPERATURA_CONFIG[p.temperatura as keyof typeof TEMPERATURA_CONFIG]?.icon}
                  </span>
                </div>

                {p.nombre_contacto && (
                  <p className="text-xs text-gray-500 mb-2">{p.nombre_contacto}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 capitalize">{p.categoria}</span>
                  {p.gasto_mensual_estimado_eur && (
                    <span className="text-xs font-medium text-gray-700">
                      {p.gasto_mensual_estimado_eur} €/mes
                    </span>
                  )}
                </div>

                {p.municipio && (
                  <p className="text-xs text-gray-400 mt-1">{p.municipio}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
