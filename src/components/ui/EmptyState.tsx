import { ReactNode } from 'react'
import { cn } from './cn'

interface EmptyStateProps {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: 'neutral' | 'brand'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-12',
        'rounded-[var(--radius-lg)] border border-dashed',
        tone === 'brand'
          ? 'bg-brand-50/40 border-brand-200 text-ink-800'
          : 'bg-surface-muted border-ink-200 text-ink-700',
        className,
      )}
    >
      <div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-4',
          tone === 'brand'
            ? 'bg-brand-100 text-brand-700'
            : 'bg-surface-card text-ink-400 shadow-[var(--shadow-xs)]',
        )}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-ink-900 tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-ink-500 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
