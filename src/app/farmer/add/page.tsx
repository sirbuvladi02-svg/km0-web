'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sprout, ArrowLeft, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AddProduct() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState({ lat: 45.4642, lng: 9.1900 }) // Default: Milano
  const [geoStatus, setGeoStatus] = useState('Rilevamento posizione in corso...')
  const router = useRouter()

  // 1. Chiediamo la posizione all'utente con Alta Precisione
  useEffect(() => {
    const gpsOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setGeoStatus('Posizione GPS acquisita con successo!')
        },
        (error) => {
          console.warn("Errore GPS: ", error);
          setGeoStatus('Posizione non trovata (usiamo Milano di default)')
        },
        gpsOptions
      )
    } else {
      setGeoStatus('Il tuo browser non supporta il GPS')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 2. RECUPERIAMO L'UTENTE LOGGATO
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Devi essere loggato per pubblicare un prodotto!");
      setLoading(false);
      router.push('/login');
      return;
    }

    // 3. INSERIAMO IL PRODOTTO COLLEGATO ALL'UTENTE
    const { error } = await supabase.from('products').insert([
      { 
        product_name: name, 
        price: parseFloat(price), 
        lat: coords.lat, 
        lng: coords.lng,
        user_id: user.id 
      }
    ])

    if (error) {
      alert("Errore nel caricamento: " + error.message)
    } else {
      alert("Successo! Il tuo prodotto è ora sulla mappa.")
      router.push('/') 
      router.refresh() 
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F0F7F0] flex flex-col items-center justify-center p-6 font-sans text-neutral-900">
      
      {/* Torna indietro */}
      <Link href="/" className="mb-8 flex items-center text-green-800 font-bold hover:scale-105 transition-transform group">
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> 
        Torna alla Mappa
      </Link>
      
      {/* Box del Modulo */}
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-md w-full space-y-8 border border-green-100">
        
        <div className="text-center">
          <div className="w-20 h-20 bg-green-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100 rotate-3">
            <Sprout className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-neutral-900 tracking-tight">Vendi Prodotto</h2>
          <div className="flex items-center justify-center gap-2 mt-3 text-green-600 font-bold text-xs bg-green-50 py-2 px-4 rounded-full w-fit mx-auto">
            <MapPin className="w-4 h-4 shrink-0" /> <span className="truncate max-w-[200px]">{geoStatus}</span>
          </div>
        </div>

        <div className="space-y-5">
          {/* Nome Prodotto */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-4 mb-2 block font-sans">Cosa vendi?</label>
            <input 
              required 
              type="text" 
              placeholder="Es: Mele Bio della Valtellina" 
              className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 placeholder:text-neutral-300 font-medium"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Prezzo */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-4 mb-2 block font-sans">Prezzo al KG (€)</label>
            <input 
              required 
              type="number" 
              step="0.01" 
              placeholder="Es: 2.50" 
              className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 placeholder:text-neutral-300 font-medium"
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Bottone Invio */}
        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-green-700 text-white py-6 rounded-2xl font-black text-xl hover:bg-green-800 transition-all shadow-xl shadow-green-200 active:scale-95 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            'Pubblica sulla Mappa'
          )}
        </button>
      </form>
    </div>
  )
}