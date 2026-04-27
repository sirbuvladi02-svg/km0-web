'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import ChangePasswordCard from '@/components/ChangePasswordCard'

export default function AccountSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<'farmer' | 'buyer' | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setEmail(user.email || null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role === 'farmer' ? 'farmer' : 'buyer')
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F7F0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-700 animate-spin" />
      </div>
    )
  }

  const backHref = role === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard'

  return (
    <div className="min-h-screen bg-[#F0F7F0] pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-green-800 font-black uppercase tracking-widest text-xs hover:-translate-x-1 transition-transform mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Torna alla Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green-700 text-white flex items-center justify-center shadow-lg shadow-green-200">
            <SettingsIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900">Impostazioni</h1>
            <p className="text-sm text-neutral-500 font-semibold">{email}</p>
          </div>
        </div>

        <ChangePasswordCard email={email} />
      </div>
    </div>
  )
}
