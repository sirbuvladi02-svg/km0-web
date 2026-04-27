'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Lock, ShieldCheck, Loader2 } from 'lucide-react'

interface Props {
  email: string | null
  variant?: 'compact' | 'default'
}

export default function ChangePasswordCard({ email, variant = 'default' }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    if (!email) {
      setFeedback({ type: 'error', text: 'Email utente non disponibile. Riprova a effettuare l\'accesso.' })
      return
    }

    if (!currentPassword.trim() || !newPassword.trim()) {
      setFeedback({ type: 'error', text: 'Compila tutti i campi.' })
      return
    }

    if (newPassword.trim().length < 6) {
      setFeedback({ type: 'error', text: 'La nuova password deve avere almeno 6 caratteri.' })
      return
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setFeedback({ type: 'error', text: 'Le password non coincidono.' })
      return
    }

    setLoading(true)

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword
    })

    if (reauthError) {
      setFeedback({ type: 'error', text: 'Password attuale errata.' })
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword.trim() })
    setLoading(false)

    if (updateError) {
      setFeedback({ type: 'error', text: updateError.message || 'Aggiornamento non riuscito. Riprova.' })
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setFeedback({ type: 'success', text: 'Password aggiornata correttamente.' })
  }

  const cardClasses = variant === 'compact'
    ? 'bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm'
    : 'bg-white border border-neutral-100 rounded-[2.5rem] p-8 shadow-xl'

  return (
    <div className={cardClasses}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400">Sicurezza</p>
          <h3 className="text-2xl font-black text-neutral-900">Cambia password</h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2 mb-2 block">Password attuale</label>
          <div className="relative">
            <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-300" />
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="********"
              className="w-full p-4 pl-12 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none font-medium text-neutral-900 placeholder:text-neutral-400"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2 mb-2 block">Nuova password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-300" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nuova password"
                className="w-full p-4 pl-12 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none font-medium text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2 mb-2 block">Conferma nuova password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-300" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti password"
                className="w-full p-4 pl-12 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-green-700 outline-none font-medium text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
          </div>
        </div>

        {feedback && (
          <p
            className={`text-xs font-semibold rounded-2xl px-4 py-3 border ${
              feedback.type === 'success'
                ? 'text-green-700 bg-green-50 border-green-100'
                : 'text-red-600 bg-red-50 border-red-100'
            }`}
          >
            {feedback.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-green-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aggiorna password'}
        </button>
      </form>
    </div>
  )
}
