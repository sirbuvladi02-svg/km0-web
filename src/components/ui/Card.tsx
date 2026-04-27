import { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Padding = 'none' | 'sm' | 'md' | 'lg'
type Elevation = 'flat' | 'sm' | 'md' | 'lg'

const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-6 sm:p-8',
  lg: 'p-8 sm:p-10',
}

const ELEVATION: Record<Elevation, string> = {
  flat: 'shadow-none',
  sm: 'shadow-[var(--shadow-sm)]',
  md: 'shadow-[var(--shadow-md)]',
  lg: 'shadow-[var(--shadow-lg)]',
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding
  elevation?: Elevation
  bordered?: boolean
  interactive?: boolean
  children?: ReactNode
}

export function Card({
  padding = 'md',
  elevation = 'sm',
  bordered = true,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-card rounded-[var(--radius-lg)]',
        PADDING[padding],
        ELEVATION[elevation],
        bordered && 'border border-ink-100',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-brand-200',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function CardHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  ...rest
}: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)} {...rest}>
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500 mb-2">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-ink-900 tracking-tight leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-ink-500 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
