'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Heart, PlusCircle, LayoutDashboard, Settings, LucideIcon } from 'lucide-react'
import { cn } from '@/components/ui/cn'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  match: (path: string) => boolean
}

function makeItems(role: 'farmer' | 'buyer'): NavItem[] {
  const common: NavItem[] = [
    {
      href: '/',
      label: 'Mappa',
      icon: MapPin,
      match: (p) => p === '/',
    },
  ]

  if (role === 'farmer') {
    return [
      ...common,
      {
        href: '/farmer/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        match: (p) => p.startsWith('/farmer/dashboard'),
      },
      {
        href: '/farmer/add',
        label: 'Aggiungi',
        icon: PlusCircle,
        match: (p) => p.startsWith('/farmer/add'),
      },
      {
        href: '/account/settings',
        label: 'Profilo',
        icon: Settings,
        match: (p) => p.startsWith('/account') || p.startsWith('/farmer/profile'),
      },
    ]
  }

  return [
    ...common,
    {
      href: '/buyer/dashboard',
      label: 'Preferiti',
      icon: Heart,
      match: (p) => p.startsWith('/buyer/dashboard'),
    },
    {
      href: '/account/settings',
      label: 'Profilo',
      icon: Settings,
      match: (p) => p.startsWith('/account'),
    },
  ]
}

interface AppBottomNavProps {
  role: 'farmer' | 'buyer'
}

export function AppBottomNav({ role }: AppBottomNavProps) {
  const pathname = usePathname() || '/'
  const items = makeItems(role)

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-ink-100 bg-surface-card/95 backdrop-blur-md"
      aria-label="Navigazione principale"
    >
      <ul className="max-w-xl mx-auto flex items-stretch justify-between px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.match(pathname)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-[var(--radius-sm)] transition',
                  active ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
                )}
              >
                <Icon
                  className={cn(
                    'w-6 h-6 transition-transform',
                    active && 'scale-110',
                  )}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-wide',
                    active ? 'text-brand-700' : 'text-ink-500',
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="block w-6 h-0.5 rounded-full bg-brand-500 mt-0.5" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
