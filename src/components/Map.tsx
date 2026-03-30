'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Carichiamo leaflet in modo sicuro per Next.js
const L: any = typeof window !== 'undefined' ? require('leaflet') : null;

// Fix per l'icona del marker
const icon = L ? L.icon({ 
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
}) : null;

export default function Map({ locations }: { locations: any[] }) {
  if (!L) return <div className="h-full w-full bg-neutral-100 animate-pulse" />;

  // Trasformiamo TUTTI i componenti in "any" per zittire TypeScript una volta per tutte
  const MapComp = MapContainer as any;
  const TileLayerComp = TileLayer as any;
  const MarkerComp = Marker as any;
  const PopupComp = Popup as any;

  return (
    <div className="h-full w-full overflow-hidden">
      <MapComp 
        center={[45.438, 10.991]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayerComp 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap contributors'
        />
        {locations?.map((loc: any) => (
          <MarkerComp key={loc.id} position={[loc.lat, loc.lng]} icon={icon}>
            <PopupComp>
              <div className="p-1">
                <h3 className="font-bold text-green-700 uppercase tracking-tight">{loc.product_name}</h3>
                <p className="text-sm font-bold text-neutral-600">Prezzo: €{loc.price}</p>
              </div>
            </PopupComp>
          </MarkerComp>
        ))}
      </MapComp>
    </div>
  )
}