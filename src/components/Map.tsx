'use client'
import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Store, ShoppingBag, ChevronRight, Navigation, ChevronDown, Search, Map as MapIcon, LayoutList, Phone, Heart, SlidersHorizontal, X } from 'lucide-react'
import TractorLoader from './TractorLoader'
import { supabase } from '@/lib/supabase'
import Toast from './Toast'

// Carichiamo leaflet in modo sicuro per Next.js
const L: any = typeof window !== 'undefined' ? require('leaflet') : null;

// Funzione internazionale per assegnare emoji in base alla categoria (IT/EN)
const getCategoryIcon = (category: string) => {
  if (!category) return '🛒';
  const lower = category.trim().toLowerCase();
  
  // Frutta / Fruit
  if (lower.includes('frutt') || lower.includes('fruit') || lower.includes('apple') || lower.includes('mela') || lower.includes('pera') || lower.includes('banana')) return '🍎';
  
  // Verdure / Vegetables
  if (lower.includes('verdur') || lower.includes('vegetable') || lower.includes('ortagg') || lower.includes('greens') || lower.includes('salad') || lower.includes('insalata')) return '🥦';
  
  // Carne / Meat
  if (lower.includes('carn') || lower.includes('meat') || lower.includes('salum') || lower.includes('sausage') || lower.includes('salsiccia') || lower.includes('beef') || lower.includes('pork') || lower.includes('chicken')) return '🥩';
  
  // Formaggio / Cheese & Latticini / Dairy
  if (lower.includes('formagg') || lower.includes('cheese') || lower.includes('latt') || lower.includes('dairy') || lower.includes('milk') || lower.includes('latte') || lower.includes('yogurt')) return '🧀';
  
  // Miele / Honey
  if (lower.includes('miel') || lower.includes('honey') || lower.includes('bee')) return '🍯';
  
  // Uova / Eggs
  if (lower.includes('uov') || lower.includes('egg') || lower.includes('ova')) return '🥚';
  
  // Vino / Wine & Birra / Beer
  if (lower.includes('vin') || lower.includes('wine') || lower.includes('birr') || lower.includes('beer') || lower.includes('alcohol') || lower.includes('spirits')) return '🍷';
  
  // Olio / Oil
  if (lower.includes('olio') || lower.includes('oil')) return '🫒';
  
  // Pane / Bread & Farina / Flour
  if (lower.includes('pan') || lower.includes('bread') || lower.includes('farin') || lower.includes('flour') || lower.includes('pasta') || lower.includes('cereal')) return '🍞';
  
  // Pesce / Fish
  if (lower.includes('pesc') || lower.includes('fish') || lower.includes('seafood') || lower.includes('mare')) return '🐟';
  
  // Azienda / Farm
  if (lower.includes('farm') || lower.includes('azienda') || lower.includes('aziend') || lower.includes('agricola') || lower.includes('agriculture')) return '🚜';
  
  // Dolci / Sweets
  if (lower.includes('dolc') || lower.includes('sweet') || lower.includes('cake') || lower.includes('torta') || lower.includes('cioccolat') || lower.includes('chocolate')) return '🍰';
  
  // Spezie / Spices
  if (lower.includes('spezi') || lower.includes('spice') || lower.includes('herb') || lower.includes('erba')) return '🌶️';
  
  // Noci / Nuts
  if (lower.includes('noc') || lower.includes('nut') || lower.includes('almond') || lower.includes('mandorla')) return '🥜';
  
  // Funghi / Mushrooms
  if (lower.includes('fung') || lower.includes('mushroom') || lower.includes('truffle') || lower.includes('tartufo')) return '🍄';
  
  return '🌱'; // Default - Pianta/Generico
}

export default function MapComponent({ locations }: { locations: any[] }) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [farmerProfiles, setFarmerProfiles] = useState<Record<string, any>>({});
  
  // STATO PER IL FILTRO
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // STATO PER LA RICERCA
  const [searchQuery, setSearchQuery] = useState<string>('');

  // STATO PER LA VISUALIZZAZIONE (mappa o lista)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // STATO PER IL PANNELLO FILTRO
  const [filterOpen, setFilterOpen] = useState(false);

  // STATO PER I PREFERITI
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);

  // STATO PER IL TOAST
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'favorite' | 'contact'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  });

  // STATO PER POPUP APERTO (Focus Mode)
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // PATHNAME per visibilità condizionale
  const pathname = usePathname();
  const isHomePage = pathname === '/';

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

  // Carica utente corrente e preferiti
  useEffect(() => {
    async function loadUserAndFavorites() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Carica preferiti dell'utente
        const { data: favData } = await supabase
          .from('favorites')
          .select('farmer_id')
          .eq('user_id', user.id);
        
        if (favData) {
          setFavorites(new Set(favData.map(f => f.farmer_id)));
        }
      }
    }
    loadUserAndFavorites();
  }, []);

  // Helper: ottiene il vero user_id di un farmer (dai prodotti o fallback a farmer.id)
  const getFarmerRealId = (farmer: any): string => {
    return farmer.products?.find((p: any) => p.user_id)?.user_id || farmer.id;
  };

  // Funzione per toggle preferito
  const toggleFavorite = async (farmerObj: any) => {
    if (!currentUser) {
      showToast('Accedi per salvare i preferiti', 'info');
      return;
    }

    const realFarmerId = getFarmerRealId(farmerObj);
    const isFavorite = favorites.has(realFarmerId);

    if (isFavorite) {
      // Rimuovi dai preferiti
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('farmer_id', realFarmerId);

      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(realFarmerId);
        return next;
      });
      showToast('Rimosso dai preferiti', 'info');
    } else {
      // Aggiungi ai preferiti
      await supabase
        .from('favorites')
        .insert({ user_id: currentUser.id, farmer_id: realFarmerId });

      setFavorites(prev => new Set(prev).add(realFarmerId));
      showToast('Aggiunto ai preferiti!', 'favorite');
    }
  };

  // Funzione per mostrare toast
  const showToast = (message: string, type: 'success' | 'info' | 'favorite' | 'contact' = 'success') => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    async function loadProfiles() {
      if (!locations || locations.length === 0) return;
      const userIds = Array.from(new Set(locations.map(loc => loc.user_id).filter(Boolean)));
      if (userIds.length === 0) return;

      const { data } = await supabase.from('profiles').select('id, avatar_url, full_name, farm_name, phone, whatsapp').in('id', userIds);
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

  // FILTRIAMO I PRODOTTI (per categoria e ricerca testuale - AND logic)
  const filteredLocations = useMemo(() => {
    let filtered = locations;
    
    // Filtro per categoria
    if (selectedCategory) {
      filtered = filtered.filter(loc => loc.category === selectedCategory);
    }
    
    // Filtro per ricerca testuale (su product_name O nome azienda)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(loc => {
        const matchProduct = loc.product_name?.toLowerCase().includes(query);
        const profile = farmerProfiles[loc.user_id];
        const farmName = profile?.farm_name?.toLowerCase() || '';
        const fullName = profile?.full_name?.toLowerCase() || '';
        const matchFarm = farmName.includes(query) || fullName.includes(query);
        return matchProduct || matchFarm;
      });
    }
    
    return filtered;
  }, [locations, selectedCategory, searchQuery, farmerProfiles]);

  // Verifica se il testo di ricerca corrisponde a una categoria
  const matchedCategory = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return availableCategories.find(cat => cat.toLowerCase().includes(query));
  }, [searchQuery, availableCategories]);

  if (!L || !center) {
    return (
      <div className="h-full w-full bg-[#F0F7F0] flex flex-col items-center justify-center rounded-[2rem] shadow-inner border-4 border-white">
        <TractorLoader />
      </div>
    );
  }

  // RAGGRUPPIAMO I PRODOTTI FILTRATI PER CONTADINO
  const farmersMap = new Map();
  filteredLocations?.forEach((loc: any) => {
    // Salta prodotti senza coordinate valide
    if (!loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) return;
    const key = loc.user_id || `${loc.lat}-${loc.lng}`;
    
    if (!farmersMap.has(key)) {
      farmersMap.set(key, { id: key, lat: loc.lat, lng: loc.lng, products: [] });
    }
    farmersMap.get(key).products.push(loc);
  });
  
  const farmers = Array.from(farmersMap.values());

  // DEBUG: Log per verificare allineamento ricerca/marker
  console.log('[Map] Ricerca:', searchQuery, '| Categoria:', selectedCategory, '| Prodotti filtrati:', filteredLocations.length, '| Farmers unici:', farmers.length);

  const MapComp = MapContainer as any;
  const TileLayerComp = TileLayer as any;
  const MarkerComp = Marker as any;
  const PopupComp = Popup as any;

  const createFarmerMarker = (farmer: any) => {
    const productCount = farmer.products.length;
    const profile = farmerProfiles[farmer.id];
    
    const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.farm_name || profile?.full_name || 'F'}&background=15803d&color=fff&size=150`;
    const farmName = profile?.farm_name || profile?.full_name || 'Azienda';

    // NUOVO: Pin stile Google Maps con SVG
    return L.divIcon({
      className: 'custom-farmer-marker bg-transparent border-none',
      html: `
        <div class="marker-pin-wrapper relative flex flex-col items-center cursor-pointer group" data-farmer-id="${farmer.id}" title="${farmName}">
          <!-- PIN SVG stile Google Maps -->
          <div class="relative">
            <svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
              <!-- Pin shape -->
              <path d="M24 0C10.745 0 0 10.745 0 24c0 5.5 1.9 10.6 5.1 14.7L24 56l18.9-17.3C46.1 34.6 48 29.5 48 24 48 10.745 37.255 0 24 0z" fill="#16a34a"/>
              <!-- Pin border -->
              <path d="M24 2C12.402 2 2 12.402 2 24c0 4.8 1.6 9.2 4.3 12.8L24 52.8l17.7-16C44.4 33.2 46 28.8 46 24 46 12.402 35.598 2 24 2z" fill="#15803d"/>
              <!-- Inner circle background -->
              <circle cx="24" cy="22" r="14" fill="white"/>
            </svg>
            
            <!-- Avatar inside pin -->
            <div class="absolute top-[6px] left-[8px] w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img src="${avatarUrl}" alt="${farmName}" class="w-full h-full object-cover" />
            </div>
            
            <!-- Pulse animation on pin -->
            <div class="absolute top-[6px] left-[8px] w-8 h-8 rounded-full bg-green-500 animate-ping opacity-20"></div>
          </div>
          
          <!-- Badge conteggio prodotti -->
          <div class="absolute -top-1 -right-2 z-20 bg-red-500 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-bounce">
            ${productCount}
          </div>
          
          <!-- Label nome azienda (opzionale, visibile su hover) -->
          <div class="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap max-w-[120px] truncate text-[10px] font-bold text-neutral-700">
            ${farmName}
          </div>
        </div>
      `,
      iconSize: [48, 72],
      iconAnchor: [24, 56],
      popupAnchor: [0, -56]
    });
  };

  return (
    <div className="h-full w-full overflow-hidden relative rounded-[2rem] bg-neutral-100 z-0 border-4 border-white shadow-lg">
      
      {/* 🔍 SEARCH CONTAINER - Glassmorphism avanzato, z-700 per stare sopra la mappa ma sotto i popup */}
      {/* BUG FIX: nascosta anche in vista elenco (viewMode === 'list') */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[700] pointer-events-auto w-[95%] max-w-[420px] transition-all duration-300 ease-out ${!isHomePage || viewMode === 'list' ? 'opacity-0 pointer-events-none translate-y-[-100%]' : ''} ${isPopupOpen ? 'opacity-0 pointer-events-none translate-y-[-100%]' : 'opacity-100 translate-y-0'}`}>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/60 p-3 flex flex-col gap-2">

          {/* Barra di ricerca + icona filtro */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 bg-neutral-50 rounded-xl border border-neutral-200 px-3 py-2.5 flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-500 shrink-0" />
              <input
                type="text"
                placeholder="Cerca prodotti o aziende..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm text-neutral-800 placeholder:text-neutral-400 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-neutral-600 text-xs font-bold shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Icona filtro */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                selectedCategory || filterOpen
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100'
              }`}
              title="Filtra per categoria"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Pannello filtro categorie - aperto al click dell'icona */}
          {filterOpen && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-100">
              {/* Bottone "Tutti" */}
              <button
                onClick={() => { setSelectedCategory(null); setFilterOpen(false); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-green-700 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span className="text-xs">🌍</span>
                <span>Tutti</span>
              </button>

              {/* Pills categorie */}
              {availableCategories.map((cat) => {
                const isHighlighted = matchedCategory?.toLowerCase() === cat.toLowerCase();
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(isSelected ? null : cat); setFilterOpen(false); }}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-green-700 text-white shadow-sm'
                        : isHighlighted
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                    title={isHighlighted ? 'Categoria corrispondente!' : cat}
                  >
                    <span className="text-xs">{getCategoryIcon(cat)}</span>
                    <span className="capitalize">{cat}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Messaggio categoria evidenziata - più discreto */}
          {matchedCategory && !selectedCategory && !filterOpen && (
            <div className="text-[10px] text-amber-700 bg-amber-50/80 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <span>💡</span>
              <span>Tocca "{matchedCategory}" per filtrare</span>
            </div>
          )}

          {/* Counter risultati - minimal */}
          <div className="flex justify-center">
            <span className="text-[10px] font-medium text-neutral-500">
              {farmers.length} {farmers.length === 1 ? 'azienda trovata' : 'aziende trovate'}
            </span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup { z-index: 1000 !important; }
        .leaflet-popup-pane { z-index: 1000 !important; }\n        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-radius: 2rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3) !important;
          padding: 0 !important;
          border: 1px solid rgba(255, 255, 255, 0.6);
          overflow: hidden;
        }
        .leaflet-popup-content { margin: 0 !important; width: 340px !important; }
        .leaflet-popup-tip { background: rgba(255, 255, 255, 0.98) !important; }
        .leaflet-control-attribution { display: none !important; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}} />

      {/* CONTENUTO CONDIZIONALE: Mappa o Lista */}
      {viewMode === 'map' ? (
        <MapComp center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }} scrollWheelZoom={false}>
          <TileLayerComp 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
            attribution='&copy; CartoDB'
          />
          
          {farmers.map((farmer: any) => (
            <MarkerComp 
              key={farmer.id} 
              position={[farmer.lat, farmer.lng]} 
              icon={createFarmerMarker(farmer)}
              eventHandlers={{
                popupopen: () => setIsPopupOpen(true),
                popupclose: () => setIsPopupOpen(false),
              }}
            >
              <PopupComp>

                <div className="flex flex-col max-h-[460px]">
                  {/* HEADER POPUP - Migliorato con distanza placeholder */}
                  <div className="bg-gradient-to-br from-green-600 to-green-700 p-5 text-white rounded-t-[2rem] relative overflow-hidden shrink-0">
                    <div className="absolute -right-4 -top-4 opacity-10">
                      <Store className="w-28 h-28" />
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-black text-2xl leading-tight truncate">
                          {farmerProfiles[farmer.id]?.farm_name || farmerProfiles[farmer.id]?.full_name || 'Azienda Agricola'}
                        </h3>
                        <p className="text-green-100 font-semibold text-xs uppercase tracking-wider mt-2 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3.5 h-3.5" /> 
                            {farmer.products.length} {selectedCategory ? `di ${selectedCategory}` : 'Prodotti'}
                          </span>
                          <span className="text-green-300">•</span>
                          <span className="flex items-center gap-1 opacity-80">
                            📍 Vicino a te
                          </span>
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <span className="text-lg">🚜</span>
                      </div>
                    </div>
                  </div>

                  {/* LISTA PRODOTTI - Con rounded-2xl e prezzi più evidenti */}
                  <div className="p-4 overflow-y-auto custom-scroll flex flex-col gap-3 bg-neutral-50/50">
                    {farmer.products.map((product: any, index: number) => {
                      const imgUrl = product.image_url;

                      return (
                        <div key={product.id || index} className="flex items-center gap-4 p-3 rounded-2xl bg-white hover:bg-green-50 border border-neutral-100 hover:border-green-200 transition-all group cursor-pointer shadow-sm hover:shadow-md">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-neutral-100 bg-white flex items-center justify-center">
                            {imgUrl ? (
                              <img src={imgUrl} alt={product.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">{getCategoryIcon(product.category || '')}</span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-neutral-900 truncate text-sm capitalize">{product.product_name}</h4>
                            <span className="inline-flex items-center gap-1 text-sm font-black text-green-800 bg-green-100 px-3 py-1 rounded-full mt-1.5">
                              €{product.price}
                              <span className="text-[10px] font-medium text-green-600">/kg</span>
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-green-600 transition-colors shrink-0" />
                        </div>
                      )
                    })}
                  </div>

                  {/* BOTTONI RISTRUTTURATI - Vetrina CTA primario, Portami Qui secondario + Cuore */}
                  <div className="p-4 border-t border-neutral-100 shrink-0 bg-white flex gap-2">
                    {(() => {
                      // FIX: usa user_id dal primo prodotto valido, altrimenti farmer.id
                      const farmerUserId = farmer.products.find((p: any) => p.user_id)?.user_id || farmer.id;
                      const isValidId = farmerUserId && farmerUserId.length >= 8 && !farmerUserId.includes(',');
                      return isValidId ? (
                        <Link
                          href={`/farmer/${farmerUserId}`}
                          className="flex-[2] bg-green-600 text-white text-center font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-500/25 hover:bg-green-700 hover:shadow-green-500/40 transition-all active:scale-95 flex items-center justify-center gap-2 no-underline"
                        >
                          <Store className="w-4 h-4" />
                          Vetrina
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="flex-[2] bg-neutral-200 text-neutral-400 text-center font-bold py-3.5 rounded-2xl text-sm cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Store className="w-4 h-4" />
                          Vetrina N/D
                        </button>
                      );
                    })()}
                    
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${farmer.lat},${farmer.lng}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-neutral-100 text-neutral-600 text-center font-semibold py-3.5 rounded-2xl text-xs hover:bg-neutral-200 hover:text-neutral-800 transition-all active:scale-95 flex items-center justify-center gap-1.5 no-underline border border-neutral-200"
                    >
                      <Navigation className="w-4 h-4" /> 
                      Portami Qui
                    </a>
                    
                    {/* Bottone Preferiti nel Popup */}
                    <button
                      onClick={() => toggleFavorite(farmer)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${
                        favorites.has(getFarmerRealId(farmer))
                          ? 'bg-red-50 border-red-200 text-red-500'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-400 hover:text-red-400'
                      }`}
                      title={favorites.has(getFarmerRealId(farmer)) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                    >
                      <Heart className={`w-5 h-5 ${favorites.has(getFarmerRealId(farmer)) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                </div>
              </PopupComp>
            </MarkerComp>
          ))}
        </MapComp>
      ) : (
        /* VISTA LISTA - Assoluta, copre tutto quando attiva */
        <div className="absolute inset-0 z-0 overflow-y-auto bg-[#F0F7F0] p-4 sm:p-6 custom-scroll">
          <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-24">
            {farmers.map((farmer: any) => {
              const profile = farmerProfiles[farmer.id];
              const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.farm_name || profile?.full_name || 'F'}&background=15803d&color=fff&size=200`;
              const phone = profile?.phone || profile?.whatsapp;
              
              return (
                <div 
                  key={farmer.id} 
                  className="bg-white rounded-[2.5rem] shadow-xl shadow-green-900/5 border border-white/60 overflow-hidden transition-all hover:shadow-2xl hover:shadow-green-900/10"
                >
                  {/* HEADER CARD */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar Azienda */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-green-100">
                        <img 
                          src={avatarUrl} 
                          alt={profile?.farm_name || 'Azienda'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Info Azienda */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-black text-xl sm:text-2xl text-neutral-900 leading-tight truncate">
                            {profile?.farm_name || profile?.full_name || 'Azienda Agricola'}
                          </h3>
                          
                          {/* Cuore Preferiti - Lista */}
                          <button
                            onClick={() => toggleFavorite(farmer)}
                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                              favorites.has(getFarmerRealId(farmer))
                                ? 'bg-red-50 text-red-500'
                                : 'bg-neutral-100 text-neutral-400 hover:text-red-400'
                            }`}
                            title={favorites.has(getFarmerRealId(farmer)) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                          >
                            <Heart className={`w-5 h-5 ${favorites.has(getFarmerRealId(farmer)) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {/* Badge Distanza */}
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                            📍 Vicino a te
                          </span>
                          
                          {/* Badge Numero Prodotti */}
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full">
                            <ShoppingBag className="w-3 h-3" />
                            {farmer.products.length} prodotti
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PRODOTTI SCORREVOLI ORIZZONTALMENTE */}
                  <div className="border-t border-neutral-100 bg-neutral-50/50 p-4">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">
                      Prodotti disponibili
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scroll">
                      {farmer.products.slice(0, 6).map((product: any, index: number) => {
                        const imgUrl = product.image_url;
                        
                        return (
                          <div 
                            key={product.id || index} 
                            className="flex-shrink-0 w-28 bg-white rounded-2xl p-2 shadow-sm border border-neutral-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer"
                          >
                            <div className="w-full h-20 rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center">
                              {imgUrl ? (
                                <img 
                                  src={imgUrl} 
                                  alt={product.product_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">{getCategoryIcon(product.category || '')}</span>
                              )}
                            </div>
                            <p className="font-bold text-xs text-neutral-800 mt-2 truncate px-1 capitalize">
                              {product.product_name}
                            </p>
                            <p className="text-xs font-black text-green-700 mt-0.5 px-1">
                              €{product.price}
                            </p>
                          </div>
                        );
                      })}
                      
                      {farmer.products.length > 6 && (
                        <div className="flex-shrink-0 w-28 bg-green-50 rounded-2xl p-2 border border-green-200 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-green-600">+{farmer.products.length - 6}</span>
                          <span className="text-[10px] font-medium text-green-600 mt-1">prodotti</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOTTONI AZIONE */}
                  <div className="p-4 sm:p-5 border-t border-neutral-100 flex gap-3">
                    {(() => {
                      const farmerUserId = farmer.products.find((p: any) => p.user_id)?.user_id || farmer.id;
                      const isValidId = farmerUserId && farmerUserId.length >= 8 && !farmerUserId.includes(',');
                      return isValidId ? (
                        <Link
                          href={`/farmer/${farmerUserId}`}
                          className="flex-[2] bg-green-600 text-white text-center font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-500/25 hover:bg-green-700 hover:shadow-green-500/40 transition-all active:scale-95 flex items-center justify-center gap-2 no-underline"
                        >
                          <Store className="w-4 h-4" />
                          Vedi Vetrina
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="flex-[2] bg-neutral-200 text-neutral-400 text-center font-bold py-3.5 rounded-2xl text-sm cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Store className="w-4 h-4" />
                          Vetrina N/D
                        </button>
                      );
                    })()}
                    
                    {phone ? (
                      <a 
                        href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-50 text-green-700 text-center font-bold py-3.5 rounded-2xl text-sm hover:bg-green-100 transition-all active:scale-95 flex items-center justify-center gap-2 no-underline border border-green-200"
                      >
                        <Phone className="w-4 h-4" />
                        WhatsApp
                      </a>
                    ) : (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${farmer.lat},${farmer.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-neutral-100 text-neutral-600 text-center font-bold py-3.5 rounded-2xl text-sm hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center gap-2 no-underline border border-neutral-200"
                      >
                        <Navigation className="w-4 h-4" />
                        Portami
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Messaggio se nessun risultato */}
            {farmers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-neutral-300" />
                </div>
                <h3 className="font-bold text-lg text-neutral-700">Nessuna azienda trovata</h3>
                <p className="text-sm text-neutral-500 mt-1">Prova a modificare i filtri o la ricerca</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB TOGGLE - Floating Action Button in basso a destra */}
      <button
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        className="absolute bottom-6 right-6 z-[900] w-14 h-14 bg-white rounded-full shadow-2xl border border-neutral-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        title={viewMode === 'map' ? 'Vista Lista' : 'Vista Mappa'}
      >
        {viewMode === 'map' ? (
          <LayoutList className="w-6 h-6 text-green-600 group-hover:text-green-700" />
        ) : (
          <MapIcon className="w-6 h-6 text-green-600 group-hover:text-green-700" />
        )}
      </button>

      {/* TOAST NOTIFICATION */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  )
}
