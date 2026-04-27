'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Store, MessageCircle, Mail, ImagePlus, Loader2, Sprout, Compass } from 'lucide-react'
import Link from 'next/link'
import { useToast, ProductCardSkeleton, EmptyState, LinkButton } from '@/components/ui'
import { getCategory } from '@/lib/categories'

export default function FarmerProfile() {
  const toast = useToast()
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

      try {
        // 1. Controlliamo chi sta guardando la pagina ( Buyer o Farmer )
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          console.log('[Vetrina] Utente corrente:', user.id, 'Ruolo:', user.user_metadata?.role || 'non definito');
        } else {
          console.log('[Vetrina] Utente non autenticato - accesso pubblico');
        }

        // 2. Recuperiamo i dati del contadino tramite API server-side (bypass RLS)
        const params = new URLSearchParams();
        params.set('ids', id);
        const response = await fetch(`/api/profiles?${params.toString()}`);
        if (!response.ok) {
          console.error('[Vetrina] API profili non disponibile:', response.status, await response.text());
        }

        const json = response.ok ? await response.json() : { profiles: {} };
        const profileData = json?.profiles?.[id] || null;

        if (!profileData) {
          console.warn('[Vetrina] Profilo non trovato per id:', id, '- mostro pagina generica');
          setProfile({ full_name: 'Azienda Agricola', id: id });
        } else {
          console.log('[Vetrina] Profilo caricato:', profileData.farm_name || profileData.full_name);
          setProfile(profileData);
        }

        // 3. Recuperiamo i prodotti (accessibile a tutti: Buyer, Farmer, o anonimi)
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', id);
        
        if (productsError) {
          console.error('[Vetrina] Errore caricamento prodotti:', productsError);
        }
        
        console.log('[Vetrina] Prodotti caricati:', productsData?.length || 0);
        setProducts(productsData || []);
      } catch (error) {
        console.error('[Vetrina] Errore generale:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFarmerData();
  }, [id]);

  // Aggiorna automaticamente la vetrina se il farmer cambia nome/avatar/bio
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`farmer-vetrina-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${id}` }, payload => {
        const updated = payload.new as any;
        if (updated) {
          setProfile((prev: any) => ({ ...(prev || {}), ...updated }));
          console.log('[Vetrina] Profilo aggiornato in tempo reale:', updated.farm_name || updated.full_name);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      toast.error({ title: 'Caricamento foto fallito', description: error.message });
    } finally {
      setUploadingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-app pb-20">
        <div className="w-full h-64 md:h-80 bg-ink-100 relative overflow-hidden">
          <span aria-hidden className="absolute inset-0 -translate-x-full animate-[km0-shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-24 mb-12 bg-surface-card rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)] border border-ink-100">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-32 h-32 rounded-full bg-ink-100 animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-3/5 bg-ink-100 rounded-full animate-pulse" />
                <div className="h-4 w-2/3 bg-ink-100/70 rounded-full animate-pulse" />
                <div className="h-4 w-1/2 bg-ink-100/70 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
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
      <div className="relative w-full h-64 md:h-80 bg-ink-900 overflow-hidden">
        <img src={coverUrl} alt="Copertina Fattoria" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-transparent to-ink-900/50" />
        <Link
          href="/"
          className="absolute top-6 left-6 z-10 flex items-center justify-center w-11 h-11 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-brand-700 transition"
          aria-label="Torna alla mappa"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link
          href="/"
          className="absolute top-6 right-6 z-10 inline-flex items-center gap-2 px-3.5 py-2 bg-white/15 backdrop-blur-md text-white rounded-full text-xs font-semibold tracking-wide hover:bg-white hover:text-brand-700 transition shadow-[var(--shadow-sm)]"
        >
          <Sprout className="w-4 h-4" />
          <span>Su <span className="font-bold">farm2you</span> · mercato km0</span>
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
          <EmptyState
            icon={<Store className="w-8 h-8" />}
            title="Nessun prodotto disponibile"
            description="Questa azienda non ha ancora inserito prodotti. Torna presto per scoprire il suo raccolto."
            action={
              <LinkButton href="/" variant="secondary" iconLeft={<ArrowLeft className="w-4 h-4" />}>
                Torna alla mappa
              </LinkButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => {
              const imgUrl = product.image_url;
              const isUploadingThis = uploadingProductId === product.id;
              const cat = getCategory(product.category);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-neutral-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group flex flex-col animate-slide-up"
                  style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
                >
                  
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
                    <span className={`inline-flex items-center gap-1 self-start text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full mb-3 ${cat.classes.pill}`}>
                      <span aria-hidden>{cat.emoji}</span>
                      {cat.label}
                    </span>
                    <h3 className="font-bold text-xl text-ink-900 mb-2 capitalize tracking-tight">{product.product_name}</h3>
                    {product.description && (
                      <p className="text-sm text-neutral-600 mb-4 flex-1 whitespace-pre-line">
                        {product.description}
                      </p>
                    )}
                    
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

        {/* CTA KM0 per cold-landing */}
        <section className="mt-16 relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-brand-600 to-brand-700 text-white p-8 sm:p-10 shadow-[var(--shadow-lg)]">
          <div
            aria-hidden
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent-400/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-brand-300/20 blur-3xl"
          />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Scopri farm2you
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                Altre aziende a km zero ti aspettano
              </h3>
              <p className="text-sm text-white/80 mt-2 max-w-xl leading-relaxed">
                Esplora la mappa dei produttori locali, scopri prodotti di stagione e sostieni
                la filiera corta del tuo territorio. Senza intermediari.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-[var(--radius-md)] bg-white text-brand-700 font-semibold hover:bg-accent-50 transition shadow-[var(--shadow-sm)]"
              >
                <MapPin className="w-4 h-4" /> Apri la mappa
              </Link>
              <Link
                href="/login?role=farmer"
                className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-[var(--radius-md)] bg-white/10 text-white border border-white/30 font-semibold hover:bg-white/20 transition"
              >
                <Sprout className="w-4 h-4" /> Sei un produttore?
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
