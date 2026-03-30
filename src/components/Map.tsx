'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix per l'icona del marker (altrimenti non si vede in Next.js)
const icon = L.icon({ 
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function Map({ locations }: { locations: any[] }) {
  return (
    /* Rimosso h-[500px] e bordi extra: ora fitta al 100% */
    <div className="h-full w-full overflow-hidden">
      <MapContainer 
        center={[45.438, 10.991]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {locations?.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icon}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-green-700 uppercase tracking-tight">{loc.product_name}</h3>
                <p className="text-sm font-bold text-neutral-600">Prezzo: €{loc.price}</p>
                <p className="text-[10px] text-neutral-400 font-black uppercase mt-1">{loc.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}