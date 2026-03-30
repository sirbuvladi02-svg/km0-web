'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, Tractor, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function FarmerProfile() {
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [farmName, setFarmName] = useState('')
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
    }
    setLoading(false)
  }

  async function updateProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      farm_name: farmName,
      updated_at: new Date(),
    }).eq('id', user?.id)

    if (error) alert(error.message)
    else alert("Profilo aggiornato!")
  }

  return (
    <div className="min-h-screen bg-[#F0F7F0] p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/farmer/dashboard" className="flex items-center text-green-800 font-bold mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" /> Torna alla Dashboard
        </Link>
        
        <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-green-100">
          <h1 className="text-3xl font-black text-neutral-900 mb-8">Il tuo Profilo Aziendale</h1>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400 ml-4 mb-2 block">Nome Titolare</label>
              <input 
                type="text" value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400 ml-4 mb-2 block">Nome Azienda Agricola</label>
              <input 
                type="text" value={farmName} 
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Es: Cascina Verde"
                className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none"
              />
            </div>
            
            <button 
              onClick={updateProfile}
              className="w-full bg-green-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-100 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Salva Modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}