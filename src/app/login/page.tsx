'use client'
import { useState, useEffect, Suspense, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sprout, Mail, Lock, ArrowLeft, Loader2, User } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<'farmer' | 'buyer'>('buyer')

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'farmer' || roleParam === 'buyer') {
      setRole(roleParam)
    }
  }, [searchParams])

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) alert(error.message)
  }

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      // TENTATIVO DI REGISTRAZIONE
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            full_name: fullName, 
            role: role 
          } 
        }
      })

      if (error) {
        alert("Errore registrazione: " + error.message)
      } else {
        // --- NUOVA LOGICA: Controllo account esistente ---
        // Se identities è vuoto, significa che l'email esiste già nel DB
        if (data.user?.identities?.length === 0) {
          alert("Questo account esiste già! Ti riporto alla pagina di accesso.")
        } else {
          alert("Registrazione completata! Ora puoi accedere.")
        }
        
        // --- PULIZIA E SWITCH ---
        setIsSignUp(false) // Torna alla schermata di Login
        setEmail('')       // Svuota i campi
        setPassword('')
        setFullName('')
      }
    } else {
      // TENTATIVO DI ACCESSO
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      
      if (authError) {
        alert("Credenziali non valide o account non confermato.")
      } else if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        window.location.href = profile?.role === 'farmer' ? '/farmer/dashboard' : '/';
      }
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-md w-full border border-green-100">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
          {isSignUp ? 'Crea Account' : 'Bentornato'}
        </h2>
        <p className="text-neutral-500 font-bold text-sm mt-1 uppercase tracking-widest">
          {isSignUp ? 'Inizia la tua avventura KM0' : 'Accedi al tuo profilo'}
        </p>
      </div>

      <button 
        type="button"
        onClick={loginWithGoogle} 
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-neutral-200 py-4 rounded-2xl font-bold text-neutral-800 hover:bg-neutral-50 mb-8 transition-all shadow-sm active:scale-95"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Continua con Google
      </button>

      <div className="relative mb-8 text-center">
        <span className="bg-white px-4 text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Oppure</span>
        <div className="absolute top-1/2 left-0 right-0 border-t border-neutral-100 -z-10"></div>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <>
            <div className="relative">
              <User className="absolute left-4 top-5 w-5 h-5 text-neutral-400" />
              <input 
                required type="text" placeholder="Nome e Cognome" 
                value={fullName} 
                className="w-full p-5 pl-12 bg-neutral-50 border-2 border-neutral-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 font-bold focus:border-green-700 outline-none transition-all" 
                onChange={(e) => setFullName(e.target.value)} 
              />
            </div>
            <div className="flex gap-3 p-1.5 bg-neutral-100 rounded-2xl">
              <button type="button" onClick={() => setRole('buyer')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition ${role === 'buyer' ? 'bg-white text-green-700 shadow-md' : 'text-neutral-400'}`}>Buyer</button>
              <button type="button" onClick={() => setRole('farmer')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition ${role === 'farmer' ? 'bg-green-700 text-white shadow-md' : 'text-neutral-400'}`}>Farmer</button>
            </div>
          </>
        )}
        
        <div className="relative">
          <Mail className="absolute left-4 top-5 w-5 h-5 text-neutral-400" />
          <input 
            required type="email" placeholder="Email" 
            value={email}
            className="w-full p-5 pl-12 bg-neutral-50 border-2 border-neutral-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 font-bold focus:border-green-700 outline-none transition-all" 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-5 w-5 h-5 text-neutral-400" />
          <input 
            required type="password" placeholder="Password" 
            value={password}
            className="w-full p-5 pl-12 bg-neutral-50 border-2 border-neutral-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 font-bold focus:border-green-700 outline-none transition-all" 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        <button disabled={loading} className="w-full bg-green-700 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-800 transition-all shadow-xl shadow-green-100 flex items-center justify-center active:scale-95">
          {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Registrati ora' : 'Accedi')}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-neutral-50 pt-8">
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-green-700 font-black text-sm uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
          {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F0F7F0] flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/" className="mb-8 flex items-center text-green-800 font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform group">
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Torna alla Home
      </Link>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-700 w-12 h-12" /></div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}