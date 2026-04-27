'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  LayoutDashboard, PlusCircle, ShoppingBasket, 
  Trash2, Package, Loader2, Sprout, LogOut, ArrowLeft, User, Pencil, ImagePlus, Settings
} from 'lucide-react'
import Link from 'next/link'

type EditFormState = {
  id: string
  product_name: string
  price: string
  category: string
  description: string
  imagePreview: string | null
  imageFile: File | null
}

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

const EMPTY_EDIT_FORM: EditFormState = {
  id: '',
  product_name: '',
  price: '',
  category: CATEGORIES[0].id,
  description: '',
  imagePreview: null,
  imageFile: null
}

export default function FarmerDashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_EDIT_FORM)
  const [savingEdit, setSavingEdit] = useState(false)

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

  // FUNZIONE PER ELIMINARE IL PRODOTTO
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

  const openEditModal = (product: any) => {
    setEditForm({
      id: product.id,
      product_name: product.product_name || '',
      price: product.price ? String(product.price) : '',
      category: product.category || CATEGORIES[0].id,
      description: product.description || '',
      imagePreview: product.image_url || null,
      imageFile: null
    })
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditForm(EMPTY_EDIT_FORM)
    setSavingEdit(false)
  }

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setEditForm(prev => ({ ...prev, imageFile: file, imagePreview: URL.createObjectURL(file) }))
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.id) return

    const trimmedName = editForm.product_name.trim()
    const parsedPrice = parseFloat(editForm.price)
    if (!trimmedName) {
      alert('Inserisci un nome prodotto valido')
      return
    }
    if (Number.isNaN(parsedPrice)) {
      alert('Inserisci un prezzo valido')
      return
    }

    setSavingEdit(true)
    let imageUrl = editForm.imagePreview

    if (editForm.imageFile) {
      const fileExt = editForm.imageFile.name.split('.').pop()
      const fileName = `${editForm.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, editForm.imageFile)
      if (uploadError) {
        alert('Errore caricamento immagine: ' + uploadError.message)
        setSavingEdit(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
      imageUrl = publicUrl
    }

    const updates = {
      product_name: trimmedName,
      price: parsedPrice,
      category: editForm.category,
      description: editForm.description.trim() || null,
      image_url: imageUrl
    }

    const { error } = await supabase.from('products').update(updates).eq('id', editForm.id)
    if (error) {
      alert('Errore durante il salvataggio: ' + error.message)
      setSavingEdit(false)
      return
    }

    setProducts(prev => prev.map(p => p.id === editForm.id ? { ...p, ...updates } : p))
    closeEditModal()
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
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-neutral-400 hidden sm:block uppercase tracking-widest">
              {userEmail?.split('@')[0]}
            </span>
            <Link
              href="/account/settings"
              className="bg-neutral-100 text-neutral-500 p-2.5 rounded-full hover:bg-green-50 hover:text-green-700 transition shadow-sm"
              title="Impostazioni"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="bg-neutral-100 text-neutral-500 p-2.5 rounded-full hover:bg-red-50 hover:text-red-600 transition shadow-sm" title="Esci">
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
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-3 text-neutral-300 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all"
                        title="Modifica prodotto"
                      >
                        <Pencil className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(p.id)}
                        className="p-3 text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                        title="Elimina prodotto"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
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

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white w-full max-w-xl rounded-[3rem] p-8 md:p-12 shadow-2xl border border-green-50 space-y-6 relative text-neutral-900"
          >
            <button
              type="button"
              onClick={closeEditModal}
              className="absolute top-6 right-6 text-neutral-300 hover:text-neutral-600"
            >
              &#10006;
            </button>

            <div className="text-center">
              <h3 className="text-3xl font-black tracking-tight">Modifica prodotto</h3>
              <p className="text-sm text-neutral-400 font-bold uppercase tracking-[0.2em] mt-2">
                Mantieni lo stile della tua vetrina
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2 mb-2 flex items-center gap-2">
                <ImagePlus className="w-3 h-3" /> Foto Prodotto
              </label>
              <div className="relative w-full h-32 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl overflow-hidden hover:border-green-500 transition-colors group cursor-pointer flex flex-col items-center justify-center">
                {editForm.imagePreview ? (
                  <img src={editForm.imagePreview} alt="Anteprima prodotto" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-400 flex flex-col items-center">
                    <ImagePlus className="w-8 h-8 mb-1 group-hover:text-green-600 transition-colors" />
                    <span className="text-sm font-bold">Clicca per caricare</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleEditImageChange}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2 mb-2 block">Categoria</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 font-bold cursor-pointer appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2 mb-2 block">Nome Specifico</label>
              <input
                type="text"
                value={editForm.product_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, product_name: e.target.value }))}
                placeholder="Es: Mele Fuji Bio"
                className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 placeholder:text-neutral-300 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2 mb-2 block">Prezzo al KG (€)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Es: 2.50"
                className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 placeholder:text-neutral-300 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2 mb-2 block">Descrizione prodotto</label>
              <textarea
                rows={4}
                maxLength={400}
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Es: Coltivato senza pesticidi, raccolto ogni mattina."
                className="w-full p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none transition-all text-neutral-900 placeholder:text-neutral-300 font-medium resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="flex-1 py-4 rounded-2xl border-2 border-neutral-200 text-neutral-500 font-bold bg-white"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex-1 py-4 rounded-2xl bg-green-700 text-white font-black hover:bg-green-800 transition disabled:opacity-50"
              >
                {savingEdit ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}