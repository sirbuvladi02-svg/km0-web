'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  LayoutDashboard, PlusCircle, ShoppingBasket, 
  Trash2, Package, Loader2, Sprout, LogOut, ArrowLeft, User
} from 'lucide-react'
import Link from 'next/link'

export default function FarmerDashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMyProducts() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserEmail(user.email || null)
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`farmer_id.eq.${user.id},user_id.eq.${user.id}`) 

        if (data) setProducts(data)
        if (error) console.error("Errore query:", error.message)
      }
      setLoading(false)
    }
    fetchMyProducts()
  }, [])

  // 🗑️ FUNZIONE PER ELIMINARE IL PRODOTTO
  const deleteProduct = async (id: string) => {
    const conferma = window.confirm("Sei sicuro di voler eliminare questo prodotto?")
    if (!conferma) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Errore durante l'eliminazione: " + error.message)
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-green-700 tracking-tighter">farm2you</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-neutral-400 hidden sm:block uppercase tracking-widest">
              {userEmail?.split('@')[0]}
            </span>
            <button onClick={handleLogout} className="bg-neutral-100 text-neutral-500 p-2.5 rounded-full hover:bg-red-50 hover:text-red-600 transition shadow-sm">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-8">
        <Link href="/" className="inline-flex items-center text-green-700 font-black text-xs uppercase tracking-widest mb-8 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla Home
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-black text-neutral-900 flex items-center gap-3 italic">
            <LayoutDashboard className="w-10 h-10 text-green-700" />
            DASHBOARD PRODUTTORE
          </h1>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* MENU AZIONI A SINISTRA */}
          <div className="flex flex-col gap-6">
            
            {/* Tasto Aggiungi Prodotto */}
            <Link href="/farmer/add" className="bg-green-700 p-8 rounded-[2.5rem] text-white flex flex-col items-center justify-center shadow-xl hover:bg-green-800 transition-all group flex-1 min-h-[200px]">
              <PlusCircle className="w-14 h-14 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-black uppercase tracking-tighter text-center leading-none">Aggiungi<br/>Prodotto</h2>
            </Link>

            {/* Tasto Profilo Azienda */}
            <Link href="/farmer/profile" className="bg-white border-2 border-neutral-100 p-8 rounded-[2.5rem] text-neutral-700 flex flex-col items-center justify-center shadow-xl hover:border-green-500 hover:text-green-700 transition-all group flex-1 min-h-[200px]">
              <User className="w-14 h-14 mb-4 text-neutral-300 group-hover:text-green-600 group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-black uppercase tracking-tighter text-center leading-none">Profilo<br/>Azienda</h2>
            </Link>

          </div>

          {/* LISTA PRODOTTI */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-neutral-100">
            <div className="flex items-center justify-between mb-8 border-b border-neutral-100 pb-4">
              <h2 className="text-2xl font-black text-neutral-900 uppercase italic">I Miei Prodotti</h2>
              <span className="bg-green-700 text-white px-4 py-1 rounded-full text-sm font-black">{products.length}</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-700 w-10 h-10" /></div>
            ) : products.length > 0 ? (
              <div className="space-y-4">
                {products.map((p) => (
                  <div key={p.id} className="p-5 bg-neutral-50 rounded-3xl border-2 border-neutral-50 flex justify-between items-center hover:border-green-200 transition-colors group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-green-700 transition-colors">
                        <Package className="text-green-700 w-6 h-6 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-black text-neutral-900 uppercase text-lg leading-tight">{p.product_name}</h3>
                        <p className="text-sm text-green-700 font-bold italic">€ {p.price} - {p.category}</p>
                      </div>
                    </div>
                    
                    {/* 🗑️ BOTTONE ELIMINA */}
                    <button 
                      onClick={() => deleteProduct(p.id)}
                      className="p-3 text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                      title="Elimina prodotto"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                <p className="text-neutral-400 font-black uppercase text-sm tracking-widest">Nessun prodotto trovato</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}