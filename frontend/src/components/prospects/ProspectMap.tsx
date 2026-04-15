import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Prospect, ESTADO_CONFIG, ProspectState } from '../../types/prospect';

// Fix iconos por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Crear icono coloreado según estado
function createIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

const STATE_COLORS: Record<string, string> = {
  pendiente: '#9ca3af',
  llamado: '#3b82f6',
  contactado: '#06b6d4',
  interesado: '#eab308',
  oferta_enviada: '#f97316',
  negociacion: '#8b5cf6',
  contrato_firmado: '#10b981',
  rechazado: '#ef4444',
  volver_llamar: '#f59e0b',
  perdido: '#64748b',
};

interface Props {
  prospects: Prospect[];
  onSelect: (prospect: Prospect) => void;
}

// Componente para ajustar el mapa a los bounds de los markers
function FitBounds({ prospects }: { prospects: Prospect[] }) {
  const map = useMap();

  useEffect(() => {
    const withCoords = prospects.filter(p => p.coordenadas_lat && p.coordenadas_lng);
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(
        withCoords.map(p => [p.coordenadas_lat!, p.coordenadas_lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [prospects, map]);

  return null;
}

export default function ProspectMap({ prospects, onSelect }: Props) {
  const withCoords = prospects.filter(p => p.coordenadas_lat && p.coordenadas_lng);

  // Centro por defecto: Madrid
  const defaultCenter: [number, number] = [40.4168, -3.7038];

  return (
    <div className="h-[600px] rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={defaultCenter}
        zoom={6}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds prospects={withCoords} />

        {withCoords.map((p) => {
          const estadoCfg = ESTADO_CONFIG[p.estado as ProspectState] || ESTADO_CONFIG.pendiente;
          const color = STATE_COLORS[p.estado] || '#9ca3af';

          return (
            <Marker
              key={p.id}
              position={[p.coordenadas_lat!, p.coordenadas_lng!]}
              icon={createIcon(color)}
              eventHandlers={{ click: () => onSelect(p) }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold text-sm">{p.nombre_negocio}</h3>
                  {p.nombre_contacto && <p className="text-xs text-gray-500">{p.nombre_contacto}</p>}
                  <div className="mt-2 space-y-1">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${estadoCfg.bg} ${estadoCfg.color}`}>
                      {estadoCfg.label}
                    </span>
                    {p.direccion_completa && (
                      <p className="text-xs text-gray-600">{p.direccion_completa}</p>
                    )}
                    {p.gasto_mensual_estimado_eur && (
                      <p className="text-xs"><strong>{p.gasto_mensual_estimado_eur} €/mes</strong></p>
                    )}
                    {p.telefono_movil && (
                      <div className="flex gap-2 mt-1">
                        <a href={`tel:${p.telefono_movil}`} className="text-xs text-blue-600 hover:underline">
                          Llamar
                        </a>
                        <a
                          href={`https://wa.me/34${p.telefono_movil.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-green-600 hover:underline"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-[1000]">
          <p className="text-gray-500">No hay prospectos con coordenadas para mostrar en el mapa</p>
        </div>
      )}
    </div>
  );
}
