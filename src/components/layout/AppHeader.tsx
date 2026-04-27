'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { Sprout, Settings, LogOut, LayoutDashboard, LogIn, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/components/ui/cn'

interface AppHeaderProps {
  eyebrow?: string
  title?: string
  description?: string
  subtitle?: ReactNode
  actions?: ReactNode
  showBackToHome?: boolean
  sticky?: boolean
}

type Profile = { role?: 'farmer' | 'buyer' | null } | null

export function AppHeader({
  eyebrow,
  title,
  description,
  subtitle,
  actions,
  sticky = true,
}: AppHeaderProps) {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>(null)

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return
      if (!user) {
        setEmail(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setEmail(user.email || null)
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!isMounted) return
      setProfile(data as Profile)
      setLoading(false)
    }

    loadUser()
    const { data: listener } = supabase.auth.onAuthStateChange(() => loadUser())

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const dashboardHref =
    profile?.role === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard'

  return (
    <header
      className={cn(
        'w-full border-b border-ink-100 bg-surface-card/95 backdrop-blur-md z-40',
        sticky && 'sticky top-0',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
          aria-label="Torna alla home"
        >
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-brand-600 flex items-center justify-center shadow-[var(--shadow-sm)] group-hover:bg-brand-700 transition-colors">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:block font-bold text-lg tracking-tight text-ink-900">
            farm<span className="text-brand-600">2you</span>
          </span>
        </Link>

        {(eyebrow || title || subtitle) && (
          <div className="hidden md:flex flex-col min-w-0 flex-1 mx-4">
            {eyebrow && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                {eyebrow}
              </span>
            )}
            {title && (
              <span className="text-sm font-semibold text-ink-800 truncate">{title}</span>
            )}
            {!title && subtitle}
            {title && description && (
              <span className="text-xs text-ink-500 truncate">{description}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {actions}

          {loading ? (
            <Loader2 className="w-5 h-5 text-ink-300 animate-spin" />
          ) : email ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-ink-700 hover:text-brand-700 transition"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>

              <Link
                href="/account/settings"
                className="w-10 h-10 rounded-full bg-ink-50 text-ink-500 hover:bg-brand-50 hover:text-brand-700 transition flex items-center justify-center"
                aria-label="Impostazioni account"
              >
                <Settings className="w-5 h-5" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-10 h-10 rounded-full bg-ink-50 text-ink-500 hover:bg-danger-50 hover:text-danger-600 transition flex items-center justify-center"
                aria-label="Esci"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 transition shadow-[var(--shadow-sm)]"
            >
              <LogIn className="w-4 h-4" /> Accedi
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
