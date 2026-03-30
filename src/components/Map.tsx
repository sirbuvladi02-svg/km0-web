'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Store, ShoppingBag, ChevronRight } from 'lucide-react'

// Carichiamo leaflet in modo sicuro per Next.js
const L: any = typeof window !== 'undefined' ? require('leaflet') : null;

export default function MapComponent({ locations }: { locations: any[] }) {
  const [center, setCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    const gpsOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCenter([position.coords.latitude, position.coords.longitude]),
        () => setCenter([45.438, 10.991]),
        gpsOptions
      );
    } else {
      setCenter([45.438, 10.991]);
    }
  }, []);

  if (!L || !center) {
    return (
      <div className="h-full w-full bg-green-50 animate-pulse flex items-center justify-center">
        <span className="text-green-700 font-bold uppercase tracking-widest text-sm">Caricamento Mappa Premium...</span>
      </div>
    );
  }

  // 🔥 LA MAGIA: Raggruppiamo i prodotti per Contadino (user_id) o per coordinate
  const farmersMap = new Map();
  locations?.forEach((loc: any) => {
    if (!loc.lat || !loc.lng) return;
    
    // Raggruppiamo per user_id. Se manca, usiamo le coordinate come "ID"
    const key = loc.user_id || `${loc.lat}-${loc.lng}`;
    
    if (!farmersMap.has(key)) {
      farmersMap.set(key, {
        id: key,
        lat: loc.lat,
        lng: loc.lng,
        products: []
      });
    }
    farmersMap.get(key).products.push(loc);
  });
  
  // Trasformiamo la mappa in un array per poterlo ciclare
  const farmers = Array.from(farmersMap.values());

  const MapComp = MapContainer as any;
  const TileLayerComp = TileLayer as any;
  const MarkerComp = Marker as any;
  const PopupComp = Popup as any;

  // MARKER AZIENDA CON BADGE NUMERICO
  const createFarmerMarker = (farmer: any) => {
    const productCount = farmer.products.length;
    // Generiamo una foto "fattoria" casuale per l'avatar, basata sulle coordinate per mantenerla fissa
    const seed = Math.abs(Math.floor(farmer.lat * 1000));
    const avatarUrl = `https://loremflickr.com/150/150/farm,landscape/all?lock=${seed}`;

    return L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="relative flex items-center justify-center w-16 h-16 group cursor-pointer">
          <div class="absolute w-full h-full bg-green-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
          
          <div class="relative z-10 w-14 h-14 bg-white border-[3px] border-green-600 rounded-full shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
            <img src="${avatarUrl}" alt="Azienda" class="w-full h-full object-cover" />
          </div>

          <div class="absolute -top-1 -right-1 z-20 bg-red-500 text-white text-[12px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-bounce">
            ${productCount}
          </div>
        </div>
      `,
      iconSize: [64, 64],
      iconAnchor: [32, 32],
      popupAnchor: [0, -28]
    });
  };

  return (
    <div className="h-full w-full overflow-hidden relative rounded-[3rem] bg-neutral-100">
      
      {/* CSS PER IL POPUP VETRINA (Largo, sfocato e scorrevole) */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.90) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-radius: 1.5rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          padding: 0 !important;
          border: 1px solid rgba(255, 255, 255, 0.5);
          overflow: hidden;
        }
        .leaflet-popup-content { margin: 0 !important; width: 320px !important; }
        .leaflet-popup-tip { background: rgba(255, 255, 255, 0.90) !important; }
        .leaflet-control-attribution { display: none !important; }
        
        /* Custom Scrollbar per la lista prodotti */
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}} />

      <MapComp center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayerComp 
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
          attribution='&copy; CartoDB'
        />
        
        {/* Renderizziamo un marker per ogni CONTADINO (che contiene N prodotti) */}
        {farmers.map((farmer: any) => (
          <MarkerComp key={farmer.id} position={[farmer.lat, farmer.lng]} icon={createFarmerMarker(farmer)}>
            <PopupComp>
              <div className="flex flex-col max-h-[400px]">
                
                {/* HEADER POPUP */}
                <div className="bg-green-700 p-4 text-white rounded-t-[1.5rem] relative overflow-hidden shrink-0">
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Store className="w-24 h-24" />
                  </div>
                  <h3 className="font-black text-xl leading-none relative z-10">Azienda Agricola</h3>
                  <p className="text-green-200 font-bold text-xs uppercase tracking-widest mt-1 relative z-10 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> {farmer.products.length} Prodotti
                  </p>
                </div>

                {/* LISTA PRODOTTI SCORREVOLE */}
                <div className="p-3 overflow-y-auto custom-scroll flex flex-col gap-2">
                  {farmer.products.map((product: any, index: number) => {
                    // Usiamo SOLO l'immagine reale, niente fallback di LoremFlickr
                    const imgUrl = product.image_url;

                    return (
                      <div key={product.id || index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-100 transition-colors group cursor-pointer">
                        {/* Immagine Prodotto o Spazio Bianco */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm border border-neutral-100 bg-white flex items-center justify-center">
                          {imgUrl ? (
                            <img src={imgUrl} alt={product.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest">N/D</span>
                          )}
                        </div>
                        
                        {/* Info Prodotto */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-neutral-900 truncate text-sm">{product.product_name}</h4>
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                            €{product.price} / kg
                          </span>
                        </div>

                        {/* Freccetta hover */}
                        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-green-600 transition-colors shrink-0" />
                      </div>
                    )
                  })}
                </div>

                {/* BOTTONE CONTATTA (ORA VERDE!) */}
                <div className="p-3 border-t border-neutral-100 shrink-0 bg-white/50">
                  <a href={`/farmer/${farmer.id}`} className="block w-full bg-green-700 !text-white text-center font-bold py-3 rounded-xl text-sm shadow-md hover:bg-green-800 transition-transform active:scale-95 uppercase tracking-widest no-underline">
                  Visita la sua Vetrina
                  </a>
                </div>

              </div>
            </PopupComp>
          </MarkerComp>
        ))}
      </MapComp>
    </div>
  )
}