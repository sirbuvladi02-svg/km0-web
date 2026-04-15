'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Store, MessageCircle, Mail, ImagePlus, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function FarmerProfile() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // STATI NUOVI PER L'EDITING INLINE
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null)

  useEffect(() => {
    async function loadFarmerData() {
      if (!id) return;

      // 1. Controlliamo chi sta guardando la pagina
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // 2. Recuperiamo i dati del contadino
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', id).single();
      setProfile(profileData || { full_name: 'Azienda Agricola' });

      // 3. Recuperiamo i prodotti
      const { data: productsData } = await supabase.from('products').select('*').eq('user_id', id);
      setProducts(productsData || []);
      
      setLoading(false);
    }

    loadFarmerData();
  }, [id]);

  // 🔥 LA MAGIA: Funzione per caricare la foto del prodotto al volo!
  const handleProductImageUpload = async (productId: string, file: File) => {
    if (!file) return;
    setUploadingProductId(productId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${productId}-${Math.random()}.${fileExt}`;

      // Carica nel bucket 'products'
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
      if (uploadError) throw uploadError;

      // Prendi il link pubblico
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);

      // Salva nel database
      const { error: dbError } = await supabase.from('products').update({ image_url: publicUrl }).eq('id', productId);
      if (dbError) throw dbError;

      // Aggiorna la lista prodotti visibile istantaneamente
      setProducts(products.map(p => p.id === productId ? { ...p, image_url: publicUrl } : p));
      
    } catch (error: any) {
      alert("Errore caricamento foto: " + error.message);
    } finally {
      setUploadingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F7F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Store className="w-12 h-12 text-green-700" />
          <span className="text-green-700 font-bold uppercase tracking-widest text-sm">Allestimento vetrina...</span>
        </div>
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.farm_name || profile?.full_name || 'F'}&background=15803d&color=fff&size=200`;
  const coverUrl = `https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=400&fit=crop&q=80`;

  const formatPhoneForWA = (phone: string) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (!cleaned.startsWith('39') && cleaned.length >= 9) cleaned = '39' + cleaned;
    return cleaned;
  }
  const waPhone = formatPhoneForWA(profile?.phone);

  // Variabile di sicurezza: è vero SOLO se chi guarda è il proprietario del profilo
  const isOwner = currentUserId === id;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 font-sans">
      
      {/* COPERTINA */}
      <div className="relative w-full h-64 md:h-80 bg-neutral-900 overflow-hidden">
        <img src={coverUrl} alt="Copertina Fattoria" className="w-full h-full object-cover opacity-60" />
        <Link href="/" className="absolute top-6 left-6 z-10 flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-green-800 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SCHEDA CONTADINO */}
        <div className="relative -mt-24 mb-12 bg-white rounded-[3rem] p-8 shadow-2xl border border-neutral-100 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          
          <div className="w-40 h-40 bg-white rounded-full p-2 shrink-0 shadow-xl z-10 -mt-12 md:mt-0">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-green-50 bg-green-100">
              <img src={avatarUrl} alt="Profilo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="bg-green-100 text-green-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">Produttore Verificato</span>
            </div>
            <h1 className="text-4xl font-black text-neutral-900 tracking-tight">{profile?.farm_name || profile?.full_name}</h1>
            <p className="text-neutral-500 font-medium mt-1 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4" /> Km0 Partner • Sulla piattaforma dal 2024
            </p>
            
            {profile?.bio && (
              <p className="mt-4 text-neutral-600 max-w-xl text-sm leading-relaxed border-l-2 border-green-500 pl-4 bg-neutral-50 p-3 rounded-r-xl">
                "{profile.bio}"
              </p>
            )}
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3 md:mt-4">
            {waPhone ? (
              <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent('Ciao! Ho visitato la tua vetrina su KM0. Vorrei avere delle informazioni.')}`} 
                 target="_blank" rel="noopener noreferrer"
                 className="w-full md:w-auto bg-[#25D366] text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-transform active:scale-95 shadow-lg">
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            ) : (
              <button disabled className="w-full md:w-auto bg-neutral-200 text-neutral-400 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm cursor-not-allowed">
                <Mail className="w-5 h-5" /> Contatti N/D
              </button>
            )}

            {/* Se è il proprietario, mostriamo anche un tasto rapido per andare direttamente a modificare il profilo */}
            {isOwner && (
              <Link href="/farmer/profile" className="text-center text-xs font-bold uppercase tracking-widest text-green-700 hover:text-green-800 mt-2">
                Modifica Profilo
              </Link>
            )}
          </div>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-neutral-900">I nostri prodotti ({products.length})</h2>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-bold hover:bg-green-100 transition-all border border-green-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Mappa
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-neutral-200">
            <Store className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-900">Nessun prodotto disponibile</h3>
            <p className="text-neutral-500 mt-2">Questa azienda non ha ancora inserito prodotti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const imgUrl = product.image_url;
              const isUploadingThis = uploadingProductId === product.id;

              return (
                <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-neutral-100 hover:shadow-xl transition-shadow group flex flex-col">
                  
                  {/* ZONA IMMAGINE PRODOTTO */}
                  <div className="aspect-square relative overflow-hidden bg-white border-b border-neutral-50 flex items-center justify-center shrink-0 group/img">
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-300 group-hover:scale-105 transition-transform duration-500">
                        {isUploadingThis ? (
                          <Loader2 className="w-10 h-10 mb-2 animate-spin text-green-600" />
                        ) : (
                          <Store className="w-10 h-10 mb-2 opacity-50" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {isUploadingThis ? 'Caricamento...' : 'Senza Foto'}
                        </span>
                      </div>
                    )}
                    
                    {/* OVERLAY AGGIUNGI FOTO (Appare SOLO se è il proprietario e NON c'è già una foto, oppure al passaggio del mouse per cambiarla) */}
                    {isOwner && (
                      <label className={`absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm ${imgUrl ? 'opacity-0 group-hover/img:opacity-100' : 'opacity-100 hover:bg-neutral-900/80'}`}>
                        <ImagePlus className="w-10 h-10 mb-2" />
                        <span className="font-bold text-sm">{imgUrl ? 'Cambia Foto' : 'Aggiungi Foto Reale'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleProductImageUpload(product.id, e.target.files[0]);
                            }
                          }} 
                          disabled={isUploadingThis}
                        />
                      </label>
                    )}

                    <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-black text-sm text-green-700 shadow-sm border border-white">
                      €{product.price} / kg
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-black text-xl text-neutral-900 mb-1 capitalize">{product.product_name}</h3>
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex-1">
                      {product.category || 'Prodotto agricolo'}
                    </p>
                    
                    <a href={waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Ciao! Vorrei sapere se il prodotto "${product.product_name}" è attualmente disponibile.`)}` : '#'}
                       target={waPhone ? "_blank" : "_self"}
                       rel="noopener noreferrer"
                       className={`w-full font-bold py-3 rounded-xl transition-colors text-center flex items-center justify-center gap-2 ${waPhone ? 'bg-green-50 text-green-700 hover:bg-green-700 hover:text-white' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'}`}>
                      {waPhone ? <MessageCircle className="w-4 h-4" /> : null}
                      {waPhone ? 'Richiedi Disponibilità' : 'Contatto N/D'}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}