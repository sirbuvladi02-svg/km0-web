'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Heart, 
  Store, 
  MapPin, 
  ArrowLeft, 
  Trash2, 
  ShoppingBag, 
  Phone,
  Navigation,
  MessageCircle
} from 'lucide-react'

interface FavoriteWithProfile {
  id: string
  farmer_id: string
  created_at: string
  profiles: {
    id: string
    full_name: string
    farm_name: string
    avatar_url: string | null
    phone: string | null
    whatsapp: string | null
    bio: string | null
  } | null
}

export default function BuyerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [favorites, setFavorites] = useState<FavoriteWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [contactHistory, setContactHistory] = useState<any[]>([])

  useEffect(() => {
    async function loadDashboard() {
      // Verifica autenticazione
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Carica preferiti
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('id, farmer_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (favError) {
        console.error('[BuyerDashboard] Errore caricamento preferiti:', favError)
      }

      console.log('[BuyerDashboard] Preferiti caricati:', favData?.length || 0, 'IDs:', favData?.map(f => f.farmer_id))

      // Carica profili separatamente per ogni farmer_id
      let enrichedFavorites: any[] = []
      if (favData && favData.length > 0) {
        const farmerIds = [...new Set(favData.map(f => f.farmer_id).filter(Boolean))]
        let profilesMap: Record<string, any> = {}

        if (farmerIds.length > 0) {
          const { data: profilesData, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', farmerIds)

          if (profError) {
            console.error('[BuyerDashboard] Errore caricamento profili:', profError)
          }

          if (profilesData) {
            profilesMap = Object.fromEntries(profilesData.map(p => [p.id, p]))
            console.log('[BuyerDashboard] Profili trovati:', Object.keys(profilesMap))
          }
        }

        enrichedFavorites = favData.map(fav => ({
          ...fav,
          profiles: profilesMap[fav.farmer_id] || null
        }))
      }

      setFavorites(enrichedFavorites)

      // Carica storico contatti (simulato - in produzione usare tabella contact_history)
      const { data: contacts } = await supabase
        .from('contact_clicks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (contacts) {
        setContactHistory(contacts)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from('favorites').delete().eq('id', favoriteId)
    setFavorites(favorites.filter(f => f.id !== favoriteId))
  }

  const formatPhoneForWA = (phone: string) => {
    if (!phone) return null
    let cleaned = phone.replace(/\D/g, '')
    if (!cleaned.startsWith('39') && cleaned.length >= 9) cleaned = '39' + cleaned
    return cleaned
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F7F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Heart className="w-12 h-12 text-green-700" />
          <span className="text-green-700 font-bold uppercase tracking-widest text-sm">Caricamento...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F7F0] pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="flex items-center justify-center w-10 h-10 bg-neutral-100 rounded-full hover:bg-green-100 hover:text-green-700 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900">I Miei Preferiti</h1>
                <p className="text-sm text-neutral-500">Le tue aziende salvate</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                {favorites.length} salvati
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* SEZIONE PREFERITI */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-neutral-100 shadow-lg">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-neutral-400" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Nessun preferito</h2>
            <p className="text-neutral-500 mb-6">Esplora la mappa e salva le aziende che ti interessano</p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 transition-all"
            >
              <MapPin className="w-4 h-4" />
              Vai alla Mappa
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {favorites.map((fav) => {
              const profile = fav.profiles
              const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.farm_name || profile?.full_name || 'F'}&background=15803d&color=fff&size=200`
              const waPhone = formatPhoneForWA(profile?.phone || profile?.whatsapp || '')

              return (
                <div 
                  key={fav.id}
                  className="bg-white rounded-[2.5rem] shadow-lg border border-neutral-100 overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-green-100">
                        <img 
                          src={avatarUrl} 
                          alt={profile?.farm_name || 'Azienda'} 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-black text-lg text-neutral-900 leading-tight truncate">
                            {profile?.farm_name || profile?.full_name || 'Azienda Agricola'}
                          </h3>
                          <button
                            onClick={() => removeFavorite(fav.id)}
                            className="shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                            title="Rimuovi dai preferiti"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {profile?.bio && (
                          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{profile.bio}</p>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            <ShoppingBag className="w-3 h-3" />
                            Vedi prodotti
                          </span>
                          <span className="text-xs text-neutral-400">
                            Salvato il {new Date(fav.created_at).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Azioni */}
                    <div className="flex gap-2 mt-5 pt-4 border-t border-neutral-100">
                      <Link 
                        href={`/farmer/${fav.farmer_id}`}
                        className="flex-[2] bg-green-600 text-white text-center font-bold py-3 rounded-2xl text-sm hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Store className="w-4 h-4" />
                        Vetrina
                      </Link>

                      {waPhone ? (
                        <a 
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent('Ciao! Ho trovato la tua azienda su KM0 e sarei interessato a saperne di più.')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#25D366] text-white text-center font-bold py-3 rounded-2xl text-sm hover:bg-[#20bd5a] transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      ) : (
                        <button 
                          disabled
                          className="flex-1 bg-neutral-100 text-neutral-400 text-center font-bold py-3 rounded-2xl text-sm cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          N/D
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SEZIONE CONTATTI RECENTI (se presenti) */}
        {contactHistory.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-black text-neutral-900 mb-5 flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              Contatti Recenti
            </h2>
            <div className="bg-white rounded-[2.5rem] shadow-lg border border-neutral-100 p-5">
              <div className="space-y-3">
                {contactHistory.map((contact, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-neutral-900">
                        Contatto WhatsApp
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(contact.created_at).toLocaleString('it-IT')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-white border-2 border-neutral-200 text-neutral-700 px-5 py-3 rounded-2xl font-bold hover:border-green-500 hover:text-green-700 transition-all"
          >
            <Navigation className="w-4 h-4" />
            Torna alla Mappa
          </Link>
        </div>
      </div>
    </div>
  )
}
