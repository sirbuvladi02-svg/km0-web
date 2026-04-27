'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Store,
  MapPin,
  Trash2,
  ShoppingBag,
  Phone,
  Navigation,
  MessageCircle,
} from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppBottomNav } from '@/components/layout/AppBottomNav'
import { FarmerCardSkeleton, EmptyState, LinkButton } from '@/components/ui'

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
    bio: string | null
  } | null
}

async function fetchProfilesByIds(ids: string[]) {
  if (!ids || ids.length === 0) return {} as Record<string, any>

  const params = new URLSearchParams()
  params.set('ids', ids.join(','))

  const response = await fetch(`/api/profiles?${params.toString()}`)
  if (!response.ok) {
    const body = await response.text()
    console.error('[BuyerDashboard] API profili non disponibile:', response.status, body)
    return {} as Record<string, any>
  }

  const json = await response.json()
  return (json?.profiles || {}) as Record<string, any>
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
          profilesMap = await fetchProfilesByIds(farmerIds)
          console.log('[BuyerDashboard] Profili caricati da API:', Object.keys(profilesMap))
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


  return (
    <div className="min-h-screen bg-surface-app pb-24 md:pb-0">
      <AppHeader eyebrow="Area acquirente" title="I miei preferiti" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">I Miei Preferiti</h1>
            <p className="text-sm text-ink-500 mt-1">Le aziende che hai salvato dalla mappa</p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Heart className="w-3.5 h-3.5" /> {favorites.length} salvate
          </span>
        </div>
        {/* SEZIONE PREFERITI */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <FarmerCardSkeleton key={i} />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            tone="brand"
            icon={<Heart className="w-8 h-8" />}
            title="Nessun preferito ancora"
            description="Esplora la mappa e salva le aziende che ti interessano. Le ritroverài qui per contattarle in un tap."
            action={
              <LinkButton href="/" iconLeft={<MapPin className="w-4 h-4" />}>
                Vai alla mappa
              </LinkButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {favorites.map((fav, index) => {
              const profile = fav.profiles
              const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.farm_name || profile?.full_name || 'F'}&background=15803d&color=fff&size=200`
              const waPhone = formatPhoneForWA(profile?.phone || '')

              return (
                <div 
                  key={fav.id}
                  className="bg-white rounded-[2.5rem] shadow-lg border border-neutral-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all animate-slide-up"
                  style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
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
            className="inline-flex items-center gap-2 bg-surface-card border border-ink-100 text-ink-700 px-5 py-3 rounded-[var(--radius-md)] font-semibold hover:border-brand-300 hover:text-brand-700 transition"
          >
            <Navigation className="w-4 h-4" />
            Torna alla Mappa
          </Link>
        </div>
      </div>

      <AppBottomNav role="buyer" />
    </div>
  )
}
