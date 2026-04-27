'use client'
import { useState, useEffect, Suspense, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sprout, Mail, Lock, ArrowLeft, Loader2, User } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter() // <-- Aggiunto router di Next.js
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<'farmer' | 'buyer'>('buyer')
  const [authError, setAuthError] = useState<string | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'farmer' || roleParam === 'buyer') {
      setRole(roleParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (isSignUp) {
      setForgotOpen(false)
      setAuthError(null)
    }
  }, [isSignUp])

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
    setAuthError(null)

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
        if (data.user?.identities?.length === 0) {
          alert("Questo account esiste già! Ti riporto alla pagina di accesso.")
        } else {
          alert("Registrazione completata! Ora puoi accedere.")
        }
        
        setIsSignUp(false)
        setEmail('')
        setPassword('')
        setFullName('')
      }
    } else {
      // TENTATIVO DI ACCESSO
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      
      if (authError) {
        setAuthError('Credenziali non valide o account non confermato. Hai dimenticato la password?')
        setForgotOpen(true)
        setForgotEmail(email)
        setForgotFeedback(null)
      } else if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        // --- NUOVA LOGICA: Uso di useRouter per una navigazione più fluida ---
        if (profile?.role === 'farmer') {
          router.push('/farmer/dashboard');
        } else {
          router.push('/')
        }
        router.refresh(); // Forza l'aggiornamento dei dati sulla pagina
      }
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotFeedback({ type: 'error', text: 'Inserisci un email valida.' })
      return
    }

    setForgotLoading(true)
    setForgotFeedback(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      })

      const data = await response.json()
      const text = data.message || data.error || 'Operazione completata.'

      setForgotFeedback({ type: response.ok ? 'success' : 'error', text })
    } catch (error) {
      console.error('[Login] Forgot password request failed', error)
      setForgotFeedback({ type: 'error', text: 'Errore inatteso, riprova tra qualche secondo.' })
    } finally {
      setForgotLoading(false)
    }
  }

  const toggleForgotSection = () => {
    setForgotOpen(prev => {
      const next = !prev
      if (next) {
        setForgotEmail(email)
      } else {
        setForgotFeedback(null)
      }
      return next
    })
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

        {!isSignUp && (
          <div className="flex flex-col gap-2">
            {authError && (
              <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">
                {authError}
              </p>
            )}
            <button
              type="button"
              onClick={toggleForgotSection}
              className="self-end text-xs font-black uppercase tracking-[0.3em] text-green-700 hover:text-green-800"
            >
              Password dimenticata?
            </button>
          </div>
        )}

        <button disabled={loading} className="w-full bg-green-700 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-800 transition-all shadow-xl shadow-green-100 flex items-center justify-center active:scale-95">
          {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Registrati ora' : 'Accedi')}
        </button>
      </form>

      {!isSignUp && forgotOpen && (
        <div className="mt-6 p-5 bg-neutral-50 border border-neutral-100 rounded-3xl space-y-4">
          <div>
            <p className="text-sm font-bold text-neutral-700">Reset password</p>
            <p className="text-xs text-neutral-500">Inserisci la tua email, riceverai un link per impostare una nuova password.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="esempio@mail.com"
              className="flex-1 p-4 bg-white border-2 border-neutral-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 font-medium focus:border-green-700 outline-none transition-all"
            />
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm bg-green-700 text-white hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {forgotLoading ? 'Invio…' : 'Invia Link'}
            </button>
          </div>
          {forgotFeedback && (
            <p className={`text-xs font-semibold ${forgotFeedback.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
              {forgotFeedback.text}
            </p>
          )}
        </div>
      )}

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