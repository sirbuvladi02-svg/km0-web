'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sprout, ArrowLeft, MapPin, Loader2, Tag, ImagePlus } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { id: 'vegetables', label: 'Ortaggi e Verdure', emoji: '🥬' },
  { id: 'fruit', label: 'Frutta', emoji: '🍎' },
  { id: 'cheese', label: 'Formaggi e Latticini', emoji: '🧀' },
  { id: 'meat', label: 'Carne e Salumi', emoji: '🥩' },
  { id: 'eggs', label: 'Uova', emoji: '🥚' },
  { id: 'honey', label: 'Miele e Confetture', emoji: '🍯' },
  { id: 'wine', label: 'Vino e Olio', emoji: '🍷' },
  { id: 'farm', label: 'Altro (Generico)', emoji: '🌾' }
]

export default function AddProduct() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('vegetables')
  const [imageFile, setImageFile] = useState<File | null>(null) // <-- Nuovo stato per l'immagine
  const [imagePreview, setImagePreview] = useState<string | null>(null) // <-- Per mostrare l'anteprima
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState({ lat: 45.4642, lng: 9.1900 }) 
  const [geoStatus, setGeoStatus] = useState('Rilevamento posizione in corso...')
  const router = useRouter()

  useEffect(() => {
    const gpsOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setGeoStatus('Posizione GPS acquisita!')
        },
        () => setGeoStatus('Posizione non trovata (Milano default)'),
        gpsOptions
      )
    }
  }, [])

  // Gestione della selezione dell'immagine
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file)) // Crea un'anteprima locale
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Devi essere loggato!");
      setLoading(false);
      router.push('/login');
      return;
    }

    let uploadedImageUrl: string | null = null;

    // 🔥 MAGIA DELLO STORAGE: Carichiamo l'immagine se è stata selezionata
    if (imageFile) {
      // Creiamo un nome unico per il file per evitare sovrascritture
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Errore nel caricamento dell'immagine: " + uploadError.message);
        setLoading(false);
        return;
      }

      // Recuperiamo il link pubblico dell'immagine appena caricata
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);
        
      uploadedImageUrl = publicUrl;
    }

    // SALVIAMO IL PRODOTTO NEL DATABASE CON L'URL DELL'IMMAGINE
    const { error } = await supabase.from('products').insert([
      { 
        product_name: name, 
        price: parseFloat(price), 
        category: category, 
        lat: coords.lat, 
        lng: coords.lng,
        user_id: user.id,
        image_url: uploadedImageUrl // <-- Salviamo il link qui!
      }
    ])

    if (error) {
      alert("Errore: " + error.message)
    } else {
      router.push('/') 
      router.refresh() 
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F0F7F0] flex flex-col items-center justify-center p-6 font-sans text-neutral-900">
      <Link href="/" className="mb-8 flex items-center text-green-800 font-bold hover:scale-105 transition-transform group">
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Torna alla Mappa
      </Link>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-md w-full space-y-6 border border-green-100">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <Sprout className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Vendi Prodotto</h2>
          <div className="flex items-center justify-center gap-2 mt-3 text-green-600 font-bold text-xs bg-green-50 py-2 px-4 rounded-full w-fit mx-auto">
            <MapPin className="w-4 h-4 shrink-0" /> <span className="truncate max-w-[200px]">{geoStatus}</span>
          </div>
        </div>

        {/* 📸 SEZIONE CARICAMENTO IMMAGINE */}
        <div>
           <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-4 mb-2 flex items-center gap-2">
            <ImagePlus className="w-3 h-3"/> Foto Prodotto
          </label>
          <div className="relative w-full h-32 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl overflow-hidden hover:border-green-500 transition-colors group cursor-pointer flex flex-col items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Anteprima" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-neutral-400 flex flex-col items-center">
                <ImagePlus className="w-8 h-8 mb-1 group-hover:text-green-600 transition-colors" />
                <span className="text-sm font-bold">Clicca per caricare</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-4 mb-2 flex items-center gap-2"><Tag className="w-3 h-3"/> Categoria</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 font-bold cursor-pointer appearance-none"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
            ))}
          </select>
        </div>

        {/* Nome */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-4 mb-2 block">Nome Specifico</label>
          <input required type="text" placeholder="Es: Mele Fuji Bio" onChange={(e) => setName(e.target.value)}
            className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 placeholder:text-neutral-300 font-medium" />
        </div>

        {/* Prezzo */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-4 mb-2 block">Prezzo al KG (€)</label>
          <input required type="number" step="0.01" placeholder="Es: 2.50" onChange={(e) => setPrice(e.target.value)}
            className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 placeholder:text-neutral-300 font-medium" />
        </div>

        <button disabled={loading} type="submit" className="w-full bg-green-700 text-white py-6 rounded-2xl font-black text-xl hover:bg-green-800 transition-all shadow-xl active:scale-95 flex justify-center">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Pubblica'}
        </button>
      </form>
    </div>
  )
}