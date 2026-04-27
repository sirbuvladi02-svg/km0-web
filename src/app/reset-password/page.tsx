'use client'

import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [initializing, setInitializing] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      // 1. Controlliamo se c'è un 'code' in query params (flusso PKCE moderno)
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (code) {
        // Scambia il token con la sessione prima di continuare
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('[ResetPassword] Errore scambio code:', error)
          // Togliamo il code dall'URL per non rifarlo
          window.history.replaceState({}, document.title, window.location.pathname)
          setInitializing(false)
          return
        }
        // Togliamo il code dall'URL per non rifarlo a ogni mount
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      // 2. Controllo normale sessione
      const { data } = await supabase.auth.getSession()
      setHasSession(Boolean(data.session))
      setInitializing(false)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session))
      setInitializing(false)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (feedback?.type === 'success') {
      const timeout = setTimeout(() => router.push('/login'), 2500)
      return () => clearTimeout(timeout)
    }
  }, [feedback, router])

  const handleUpdatePassword = async (event: FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    const trimmed = password.trim()
    if (trimmed.length < 6) {
      setFeedback({ type: 'error', text: 'La nuova password deve avere almeno 6 caratteri.' })
      return
    }

    if (trimmed !== confirmPassword.trim()) {
      setFeedback({ type: 'error', text: 'Le password non coincidono.' })
      return
    }

    setUpdating(true)
    const { error } = await supabase.auth.updateUser({ password: trimmed })
    setUpdating(false)

    if (error) {
      console.error('[ResetPassword] updateUser failed', error)
      setFeedback({ type: 'error', text: error.message || 'Impossibile aggiornare la password.' })
      return
    }

    setFeedback({ type: 'success', text: 'Password aggiornata! Tra pochi secondi verrai reindirizzato al login.' })
    setPassword('')
    setConfirmPassword('')
  }

  const renderContent = () => {
    if (initializing) {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
          <p className="text-sm font-semibold text-neutral-500">Verifica del link in corso…</p>
        </div>
      )
    }

    if (!hasSession) {
      return (
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-2xl font-black text-neutral-900">Link non valido o scaduto</h2>
          <p className="text-sm text-neutral-500">
            Apri il link direttamente dall'email "Reset password" che ti abbiamo inviato oppure richiedine uno nuovo dalla pagina di login.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-green-700 text-white font-black uppercase tracking-widest hover:bg-green-800"
          >
            Torna al login
          </Link>
        </div>
      )
    }

    return (
      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <div>
          <label className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-2 block">Nuova password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-5 pl-12 bg-neutral-50 border-2 border-neutral-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 font-bold focus:border-green-700 outline-none transition-all"
              placeholder="********"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-2 block">Conferma password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-5 pl-12 bg-neutral-50 border-2 border-neutral-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 font-bold focus:border-green-700 outline-none transition-all"
              placeholder="********"
            />
          </div>
        </div>

        {feedback && (
          <p
            className={`text-sm font-semibold rounded-2xl px-4 py-3 border flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'text-green-700 bg-green-50 border-green-100'
                : 'text-red-600 bg-red-50 border-red-100'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{feedback.text}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={updating}
          className="w-full bg-green-700 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-800 transition-all shadow-xl shadow-green-100 flex items-center justify-center active:scale-95 disabled:opacity-60"
        >
          {updating ? <Loader2 className="animate-spin" /> : 'Aggiorna password'}
        </button>
      </form>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F7F0] flex flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8 flex items-center text-green-800 font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform group">
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Torna alla Home
      </Link>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-md w-full border border-green-100 text-neutral-900">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
            <Lock className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Reset Password</h1>
          <p className="text-sm text-neutral-500 font-semibold mt-1">Imposta una nuova password per il tuo account KM0.</p>
        </div>

        {renderContent()}
      </div>
    </div>
  )
}
