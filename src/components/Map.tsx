'use client'
import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { Store, ShoppingBag, ChevronRight, Navigation, ChevronDown, Search } from 'lucide-react'
import TractorLoader from './TractorLoader'
import { supabase } from '@/lib/supabase'


// Carichiamo leaflet in modo sicuro per Next.js
const L: any = typeof window !== 'undefined' ? require('leaflet') : null;

// Funzione simpatica per assegnare un'emoji automatica in base alla categoria
const getCategoryIcon = (category: string) => {
  if (!category) return '🛒';
  const lower = category.toLowerCase();
  if (lower.includes('frutt') || lower.includes('fruit')) return '🍎';
  if (lower.includes('verdur') || lower.includes('ortagg')) return '🥦';
  if (lower.includes('carn') || lower.includes('salum') || lower.includes('meat')) return '🥩';
  if (lower.includes('formagg') || lower.includes('latt')) return '🧀';
  if (lower.includes('miel') || lower.includes('honey')) return '🍯';
  if (lower.includes('uov') || lower.includes('egg')) return '🥚';
  if (lower.includes('vin') || lower.includes('birr')) return '🍷';
  if (lower.includes('olio')) return '🫒';
  if (lower.includes('pan') || lower.includes('farin')) return '🍞';
  return '🌱'; // Default
}

export default function MapComponent({ locations }: { locations: any[] }) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [farmerProfiles, setFarmerProfiles] = useState<Record<string, any>>({});
  
  // STATO PER IL FILTRO
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // STATO PER LA RICERCA
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  useEffect(() => {
    async function loadProfiles() {
      if (!locations || locations.length === 0) return;
      const userIds = Array.from(new Set(locations.map(loc => loc.user_id).filter(Boolean)));
      if (userIds.length === 0) return;

      const { data } = await supabase.from('profiles').select('id, avatar_url, full_name, farm_name').in('id', userIds);
      if (data) {
        const profileMap: Record<string, any> = {};
        data.forEach(p => profileMap[p.id] = p);
        setFarmerProfiles(profileMap);
      }
    }
    loadProfiles();
  }, [locations]);

  // ESTRAIAMO LE CATEGORIE DINAMICAMENTE (Ignorando i null)
  const availableCategories = useMemo(() => {
    if (!locations) return [];
    const categories = Array.from(new Set(locations.map(loc => loc.category).filter(Boolean))) as string[];
    return categories.sort();
  }, [locations]);

  // FILTRIAMO I PRODOTTI (per categoria e ricerca testuale)
  const filteredLocations = useMemo(() => {
    let filtered = locations;
    
    // Filtro per categoria
    if (selectedCategory) {
      filtered = filtered.filter(loc => loc.category === selectedCategory);
    }
    
    // Filtro per ricerca testuale
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(loc => 
        (loc.product_name?.toLowerCase().includes(query)) ||
        (loc.category?.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [locations, selectedCategory, searchQuery]);

  if (!L || !center) {
    return (
      <div className="h-full w-full bg-[#F0F7F0] flex flex-col items-center justify-center rounded-[3rem] shadow-inner border-4 border-white">
        <TractorLoader />
      </div>
    );
  }

  // RAGGRUPPIAMO I PRODOTTI FILTRATI PER CONTADINO
  const farmersMap = new Map();
  filteredLocations?.forEach((loc: any) => {
    if (!loc.lat || !loc.lng) return;
    const key = loc.user_id || `${loc.lat}-${loc.lng}`;
    
    if (!farmersMap.has(key)) {
      farmersMap.set(key, { id: key, lat: loc.lat, lng: loc.lng, products: [] });
    }
    farmersMap.get(key).products.push(loc);
  });
  
  const farmers = Array.from(farmersMap.values());

  const MapComp = MapContainer as any;
  const TileLayerComp = TileLayer as any;
  const MarkerComp = Marker as any;
  const PopupComp = Popup as any;

  const createFarmerMarker = (farmer: any) => {
    const productCount = farmer.products.length;
    const profile = farmerProfiles[farmer.id];
    
    const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.farm_name || profile?.full_name || 'F'}&background=15803d&color=fff&size=150`;

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
    <div className="h-full w-full overflow-hidden relative rounded-[3rem] bg-neutral-100 z-0 border-4 border-white shadow-sm">
      
      {/* � BARRA DI RICERCA E FILTRO */}
      <div className="absolute top-4 right-4 z-[1000] pointer-events-auto flex flex-col gap-3">
        
        {/* Barra di ricerca */}
        <div className="relative bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-neutral-100 px-4 py-2.5 flex items-center gap-3 min-w-[280px]">
          <Search className="w-5 h-5 text-green-600 shrink-0" />
          <input
            type="text"
            placeholder="Cerca prodotti o categorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium text-neutral-700 placeholder:text-neutral-400 w-full"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-neutral-400 hover:text-neutral-600 text-xs font-bold shrink-0"
            >
              ✕
            </button>
          )}
        </div>

        {/* Menu a tendina categorie */}
        <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-neutral-100 p-1 flex items-center group hover:shadow-xl transition-shadow self-end">
          
          {/* L'emoji cambia in base a cosa selezioni */}
          <div className="pl-3 pr-2 py-2 border-r border-neutral-100 flex items-center justify-center">
            <span className="text-xl leading-none">{selectedCategory ? getCategoryIcon(selectedCategory) : '🌍'}</span>
          </div>
          
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="bg-transparent font-black text-neutral-700 outline-none appearance-none cursor-pointer py-2 pl-3 pr-8 w-40 capitalize text-sm"
          >
            <option value="">Tutti i Prodotti</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-green-700 absolute right-3 pointer-events-none group-hover:translate-y-0.5 transition-transform" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-radius: 1.5rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          padding: 0 !important;
          border: 1px solid rgba(255, 255, 255, 0.5);
          overflow: hidden;
        }
        .leaflet-popup-content { margin: 0 !important; width: 320px !important; }
        .leaflet-popup-tip { background: rgba(255, 255, 255, 0.95) !important; }
        .leaflet-control-attribution { display: none !important; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
      `}} />

      <MapComp center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }} scrollWheelZoom={false}>
        <TileLayerComp 
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
          attribution='&copy; CartoDB'
        />
        
        {farmers.map((farmer: any) => (
          <MarkerComp key={farmer.id} position={[farmer.lat, farmer.lng]} icon={createFarmerMarker(farmer)}>
            <PopupComp>

              <div className="flex flex-col max-h-[420px]">
                {/* HEADER POPUP */}
                <div className="bg-green-700 p-4 text-white rounded-t-[1.5rem] relative overflow-hidden shrink-0">
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Store className="w-24 h-24" />
                  </div>
                  <h3 className="font-black text-xl leading-none relative z-10 truncate pr-4">
                    {farmerProfiles[farmer.id]?.farm_name || farmerProfiles[farmer.id]?.full_name || 'Azienda Agricola'}
                  </h3>
                  <p className="text-green-200 font-bold text-xs uppercase tracking-widest mt-1 relative z-10 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> {farmer.products.length} {selectedCategory ? `di ${selectedCategory}` : 'Prodotti'}
                  </p>
                </div>

                {/* LISTA PRODOTTI */}
                <div className="p-3 overflow-y-auto custom-scroll flex flex-col gap-2">
                  {farmer.products.map((product: any, index: number) => {
                    const imgUrl = product.image_url;

                    return (
                      <div key={product.id || index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-100 transition-colors group cursor-pointer">
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm border border-neutral-100 bg-white flex items-center justify-center">
                          {imgUrl ? (
                            <img src={imgUrl} alt={product.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{getCategoryIcon(product.category || '')}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-neutral-900 truncate text-sm capitalize">{product.product_name}</h4>
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                            €{product.price} / kg
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-green-600 transition-colors shrink-0" />
                      </div>
                    )
                  })}
                </div>

                {/* 🧭 DOPPIO BOTTONE RIPARATO (Ora apre il navigatore vero) */}
                <div className="p-3 border-t border-neutral-100 shrink-0 bg-white/50 flex gap-2">
                  <a 
                    // IL LINK ORA È CORRETTO: Crea un percorso fino alle coordinate del contadino
                    href={`https://www.google.com/maps/dir/?api=1&destination=${farmer.lat},${farmer.lng}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-neutral-100 text-neutral-700 text-center font-bold py-3 rounded-xl text-xs shadow-sm hover:bg-neutral-200 transition-transform active:scale-95 flex flex-col items-center justify-center gap-1 no-underline border border-neutral-200"
                  >
                    <Navigation className="w-4 h-4" /> Portami Qui
                  </a>
                  
                  <a 
                    href={`/farmer/${farmer.id}`} 
                    className="flex-[1.5] bg-green-700 !text-white text-center font-black py-3 rounded-xl text-sm shadow-md hover:bg-green-800 transition-transform active:scale-95 flex items-center justify-center uppercase tracking-widest no-underline"
                  >
                    Vetrina
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