'use client'

import { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-[var(--shadow-glow)]',
  secondary:
    'bg-surface-card text-ink-900 border border-ink-100 hover:border-brand-300 hover:bg-brand-50/40',
  ghost:
    'bg-transparent text-ink-700 hover:bg-ink-50 hover:text-ink-900',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
  whatsapp:
    'bg-whatsapp-500 text-white hover:bg-whatsapp-600 shadow-[0_12px_28px_-10px_rgba(37,211,102,0.5)]',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm rounded-[var(--radius-sm)]',
  md: 'h-12 px-6 text-sm rounded-[var(--radius-md)]',
  lg: 'h-14 px-7 text-base rounded-[var(--radius-md)]',
  icon: 'h-11 w-11 rounded-full',
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-tight ' +
  'transition-[transform,box-shadow,background,color] duration-150 ' +
  'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] ' +
  'focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    fullWidth,
    iconLeft,
    iconRight,
    className,
    disabled,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(BASE, VARIANT[variant], SIZE[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : iconLeft}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </button>
  )
})

type LinkButtonProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string }

export function LinkButton({
  variant = 'primary',
  size = 'md',
  fullWidth,
  iconLeft,
  iconRight,
  className,
  href,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANT[variant], SIZE[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {iconLeft}
      {children && <span>{children}</span>}
      {iconRight}
    </Link>
  )
}
