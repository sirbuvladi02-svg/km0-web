'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, Phone, ImagePlus, FileText, Loader2, Store, AlertCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui'

export default function FarmerProfile() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [bio, setBio] = useState('')
  
  // 🛡️ TELEFONO DIVISO IN DUE (A prova di errore)
  const [phonePrefix, setPhonePrefix] = useState('+39')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null)
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setFullName(data.full_name || '')
      setFarmName(data.farm_name || '')
      setBio(data.bio || '')
      
      // Quando carichiamo, separiamo il prefisso dal numero!
      const savedPhone = data.phone || ''
      if (savedPhone) {
        const match = savedPhone.match(/^(\+\d{2,3})\s?(.*)$/)
        if (match) {
          setPhonePrefix(match[1])
          setPhoneNumber(match[2])
        } else {
          setPhoneNumber(savedPhone)
        }
      }
      
      setExistingAvatarUrl(data.avatar_url || null)
    }
    setLoading(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // 🔥 VALIDAZIONE SEMPLIFICATA
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim() || fullName.length < 2) {
      newErrors.fullName = 'Inserisci il nome del titolare.'
    }

    if (!farmName.trim() || farmName.length < 2) {
      newErrors.farmName = "Inserisci il nome dell'azienda."
    }

    // Controllo Telefono (Ora controlliamo solo che la lunghezza sia sensata)
    if (phoneNumber) {
      const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '')
      if (cleanedNumber.length < 8 || cleanedNumber.length > 15) {
        newErrors.phone = 'Il numero deve avere tra le 8 e le 15 cifre.'
      }
    }

    if (bio && bio.length > 500) {
      newErrors.bio = `Testo troppo lungo (${bio.length}/500).`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function updateProfile() {
    if (!validateForm()) {
      toast.warning({ title: 'Controlla i campi', description: 'Ci sono degli errori evidenziati in rosso da correggere.' })
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return;

    let finalAvatarUrl = existingAvatarUrl;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `avatar-${user.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile)

      if (uploadError) {
        toast.error({ title: 'Caricamento foto fallito', description: uploadError.message })
        setSaving(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
      finalAvatarUrl = publicUrl
    }

    // 🔗 RIUNIAMO PREFISSO E NUMERO PRIMA DI SALVARE
    const finalPhone = phoneNumber ? `${phonePrefix} ${phoneNumber.replace(/[^0-9]/g, '')}` : '';

    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      farm_name: farmName.trim(),
      bio: bio.trim(),
      phone: finalPhone,
      avatar_url: finalAvatarUrl
    }).eq('id', user.id)

    if (error) {
      toast.error({ title: 'Salvataggio non riuscito', description: error.message })
    } else {
      toast.success({ title: 'Profilo aggiornato', description: 'I clienti vedranno le tue nuove informazioni.' })
      router.push('/farmer/dashboard')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F0F7F0] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-700" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F7F0] p-6 pb-20 font-sans">
      <div className="max-w-2xl mx-auto">
        <Link href="/farmer/dashboard" className="flex items-center text-green-800 font-bold mb-8 hover:-translate-x-1 transition-transform w-fit">
          <ArrowLeft className="w-5 h-5 mr-2" /> Torna alla Dashboard
        </Link>
        
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-green-100">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Il tuo Profilo Aziendale</h1>
            <p className="text-neutral-500 font-medium mt-2">I clienti vedranno queste informazioni per contattarti e fare acquisti.</p>
          </div>
          
          <div className="space-y-8">
            
            {/* FOTO PROFILO */}
            <div className="flex flex-col items-center">
              <div className="relative w-36 h-36 mb-4 group cursor-pointer">
                <div className="w-full h-full rounded-full border-4 border-green-50 overflow-hidden bg-neutral-50 shadow-lg flex items-center justify-center transition-transform group-hover:scale-105">
                  {(imagePreview || existingAvatarUrl) ? (
                    <img src={imagePreview || existingAvatarUrl || ''} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-neutral-300" />
                  )}
                </div>
                <div className="absolute inset-0 bg-neutral-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <ImagePlus className="w-8 h-8 text-white" />
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Tocca per cambiare foto</p>
            </div>

            <hr className="border-neutral-100" />

            {/* NOME TITOLARE E AZIENDA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-2 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600"/> Nome Titolare *
                </label>
                <input 
                  type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Es: Mario Rossi"
                  className={`w-full p-4 bg-neutral-50 border-2 rounded-2xl outline-none font-bold text-neutral-900 placeholder:text-neutral-300 transition-all shadow-sm focus:bg-white focus:ring-4 focus:ring-green-600/10 ${errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-neutral-100 focus:border-green-600'}`}
                />
                {errors.fullName && <p className="text-red-500 text-xs font-bold mt-2 ml-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.fullName}</p>}
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-2 mb-2 flex items-center gap-2">
                  <Store className="w-4 h-4 text-green-600"/> Nome Azienda *
                </label>
                <input 
                  type="text" value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="Es: Cascina Verde"
                  className={`w-full p-4 bg-neutral-50 border-2 rounded-2xl outline-none font-bold text-neutral-900 placeholder:text-neutral-300 transition-all shadow-sm focus:bg-white focus:ring-4 focus:ring-green-600/10 ${errors.farmName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-neutral-100 focus:border-green-600'}`}
                />
                {errors.farmName && <p className="text-red-500 text-xs font-bold mt-2 ml-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.farmName}</p>}
              </div>
            </div>

            {/* CONTATTI (WHATSAPP) ANTI-ERRORE */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-2 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" /> Numero Cellulare (WhatsApp)
              </label>
              
              {/* Contenitore unificato per prefisso e numero */}
              <div className={`flex items-stretch bg-neutral-50 border-2 rounded-2xl transition-all shadow-sm focus-within:bg-white focus-within:ring-4 ${errors.phone ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10' : 'border-neutral-100 focus-within:border-green-600 focus-within:ring-green-600/10'}`}>
                
                {/* Dropdown Bandierina/Prefisso */}
                <div className="relative flex items-center bg-neutral-100/50 border-r-2 border-neutral-100 rounded-l-xl px-2">
                  <select 
                    value={phonePrefix} 
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="bg-transparent font-black text-neutral-600 outline-none appearance-none pr-6 cursor-pointer py-4 pl-2"
                  >
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+41">🇨🇭 +41</option>
                    <option value="+43">🇦🇹 +43</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+49">🇩🇪 +49</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2 pointer-events-none" />
                </div>

                {/* Input Numero Pulisci-Tutto */}
                <input 
                  type="tel" 
                  value={phoneNumber} 
                  // LA MAGIA: Appena l'utente digita una lettera, questa riga la cancella all'istante!
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s]/g, ''))} 
                  placeholder="333 123 4567"
                  className="w-full p-4 bg-transparent outline-none font-bold text-neutral-900 placeholder:text-neutral-300"
                />
              </div>

              {errors.phone ? (
                <p className="text-red-500 text-xs font-bold mt-2 ml-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.phone}</p>
              ) : (
                <p className="text-xs font-medium text-neutral-400 ml-2 mt-2">Seleziona la bandierina e scrivi solo il numero. Serve per farti contattare su WhatsApp.</p>
              )}
            </div>

            {/* BIO AZIENDALE */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-2 mb-2 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-green-600" /> Qualcosa su di te</span>
                <span className={`text-[10px] ${bio.length > 500 ? 'text-red-500 font-bold' : 'text-neutral-400'}`}>{bio.length}/500</span>
              </label>
              <textarea 
                value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Scrivi una breve descrizione dei tuoi prodotti o della tua terra..." rows={4}
                className={`w-full p-4 bg-neutral-50 border-2 rounded-2xl outline-none font-bold text-neutral-900 placeholder:text-neutral-300 transition-all shadow-sm resize-none focus:bg-white focus:ring-4 focus:ring-green-600/10 ${errors.bio ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-neutral-100 focus:border-green-600'}`}
              />
               {errors.bio && <p className="text-red-500 text-xs font-bold mt-2 ml-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bio}</p>}
            </div>
            
            <button 
              onClick={updateProfile} disabled={saving}
              className="w-full bg-green-700 text-white py-6 rounded-2xl font-black text-xl hover:bg-green-800 transition-all shadow-xl hover:shadow-green-700/30 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 mt-6"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />} 
              {saving ? 'Sto salvando...' : 'Salva Profilo'}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}