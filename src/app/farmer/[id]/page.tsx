'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPin, Store, Phone, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function FarmerProfile() {
  const params = useParams()
  const id = params.id as string
  
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFarmerData() {
      if (!id) return;

      // 1. Recuperiamo il nome del contadino dalla tabella profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      setProfile(profileData || { full_name: 'Azienda Agricola' });

      // 2. Recuperiamo tutti i suoi prodotti
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', id);
        
      setProducts(productsData || []);
      setLoading(false);
    }

    loadFarmerData();
  }, [id]);

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

  // Generiamo immagini fisse per copertina e avatar basate sull'ID per coerenza visiva
  const coverUrl = `https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=400&fit=crop&q=80`;
  const avatarUrl = `https://loremflickr.com/200/200/farmer,face/all?lock=${id.slice(0,5)}`;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 font-sans">
      
      {/* COPERTINA (HERO BANNER) */}
      <div className="relative w-full h-64 md:h-80 bg-neutral-900 overflow-hidden">
        <img src={coverUrl} alt="Copertina Fattoria" className="w-full h-full object-cover opacity-60" />
        <Link href="/" className="absolute top-6 left-6 z-10 flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-green-800 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SCHEDA CONTADINO (Sovrapposta alla copertina) */}
        <div className="relative -mt-24 mb-12 bg-white rounded-[3rem] p-8 shadow-2xl border border-neutral-100 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          
          <div className="w-40 h-40 bg-white rounded-full p-2 shrink-0 shadow-xl z-10">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-green-50 bg-green-100">
              <img src={avatarUrl} alt="Profilo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="bg-green-100 text-green-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">Produttore Verificato</span>
            </div>
            <h1 className="text-4xl font-black text-neutral-900 tracking-tight">{profile?.full_name}</h1>
            <p className="text-neutral-500 font-medium mt-1 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4" /> Km0 Partner • Sulla piattaforma dal 2024
            </p>
          </div>

          <div className="w-full md:w-auto flex gap-3 pb-4">
            <button className="flex-1 md:flex-none bg-neutral-900 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-transform active:scale-95 shadow-lg">
              <Mail className="w-5 h-5" /> Contatta
            </button>
          </div>
        </div>

        {/* SEZIONE PRODOTTI */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-neutral-900">I nostri prodotti ({products.length})</h2>
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
              // Niente immagini finte: o c'è la foto reale, o sfondo bianco
              const imgUrl = product.image_url;

              return (
                <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-neutral-100 hover:shadow-xl transition-shadow group">
                  <div className="aspect-square relative overflow-hidden bg-white border-b border-neutral-50 flex items-center justify-center">
                    
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-300 group-hover:scale-105 transition-transform duration-500">
                        <Store className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs font-bold uppercase tracking-widest">Senza Foto</span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-black text-sm text-green-700 shadow-sm border border-white">
                      €{product.price} / kg
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-xl text-neutral-900 mb-1 capitalize">{product.product_name}</h3>
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">
                      {product.category || 'Prodotto agricolo'}
                    </p>
                    <button className="w-full bg-green-50 text-green-700 font-bold py-3 rounded-xl hover:bg-green-700 hover:text-white transition-colors">
                      Richiedi Disponibilità
                    </button>
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