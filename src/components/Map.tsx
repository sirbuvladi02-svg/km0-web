'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Carichiamo leaflet in modo sicuro per Next.js
const L: any = typeof window !== 'undefined' ? require('leaflet') : null;

// Fix per l'icona del marker dei prodotti
const icon = L ? L.icon({ 
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
}) : null;

export default function Map({ locations }: { locations: any[] }) {
  // Stato per salvare la posizione in cui centrare la mappa
  const [center, setCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Opzioni per forzare il browser a essere super preciso col GPS
    const gpsOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // GPS riuscito: centriamo sull'utente
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("GPS ignorato o fallito, uso Verona come default.", error);
          // Fallback: Se rifiuta il GPS o fallisce, andiamo a Verona
          setCenter([45.438, 10.991]);
        },
        gpsOptions // Le nostre opzioni speciali passate qui!
      );
    } else {
      // Se il browser è vecchissimo e non ha il GPS
      setCenter([45.438, 10.991]);
    }
  }, []);

  // Aspettiamo di avere le coordinate (GPS o Fallback) prima di disegnare la mappa,
  // altrimenti React-Leaflet va in confusione col centro dinamico.
  if (!L || !center) {
    return (
      <div className="h-full w-full bg-neutral-100 animate-pulse flex items-center justify-center">
        <span className="text-neutral-500 font-medium">Ricerca posizione in corso...</span>
      </div>
    );
  }

  // Trasformiamo TUTTI i componenti in "any" per zittire TypeScript una volta per tutte
  const MapComp = MapContainer as any;
  const TileLayerComp = TileLayer as any;
  const MarkerComp = Marker as any;
  const PopupComp = Popup as any;

  return (
    <div className="h-full w-full overflow-hidden">
      <MapComp 
        center={center} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayerComp 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Renderizziamo i prodotti passati dal database */}
        {locations?.map((loc: any) => {
          // Controllo di sicurezza: disegna il marker solo se lat e lng esistono
          if (!loc.lat || !loc.lng) return null;
          
          return (
            <MarkerComp key={loc.id} position={[loc.lat, loc.lng]} icon={icon}>
              <PopupComp>
                <div className="p-1">
                  <h3 className="font-bold text-green-700 uppercase tracking-tight">{loc.product_name}</h3>
                  <p className="text-sm font-bold text-neutral-600">Prezzo: €{loc.price}</p>
                </div>
              </PopupComp>
            </MarkerComp>
          )
        })}
      </MapComp>
    </div>
  )
}