'use client'

import { HTMLAttributes } from 'react'
import { cn } from './cn'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Shape preset per il blocco scheletro */
  shape?: 'line' | 'rect' | 'circle' | 'pill'
}

const SHAPES: Record<NonNullable<SkeletonProps['shape']>, string> = {
  line: 'h-3 rounded-full',
  rect: 'rounded-[var(--radius-md)]',
  circle: 'rounded-full aspect-square',
  pill: 'h-6 rounded-full',
}

export function Skeleton({ shape = 'rect', className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-ink-100/60',
        SHAPES[shape],
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full animate-[km0-shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />
    </div>
  )
}

/** Card skeleton per la lista prodotti del farmer (dashboard) */
export function ProductRowSkeleton() {
  return (
    <div className="p-5 bg-surface-muted rounded-[var(--radius-lg)] border border-ink-100 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Skeleton shape="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton shape="line" className="w-1/2" />
          <Skeleton shape="line" className="w-1/3" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton shape="circle" className="w-9 h-9" />
        <Skeleton shape="circle" className="w-9 h-9" />
      </div>
    </div>
  )
}

/** Card skeleton per la lista farmer/preferiti del buyer */
export function FarmerCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-[var(--radius-xl)] border border-ink-100 p-5 sm:p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-4">
        <Skeleton shape="rect" className="w-20 h-20" />
        <div className="flex-1 space-y-2.5">
          <Skeleton shape="line" className="w-3/4 h-4" />
          <Skeleton shape="line" className="w-full" />
          <Skeleton shape="line" className="w-2/3" />
          <Skeleton shape="pill" className="w-24 mt-2" />
        </div>
      </div>
      <div className="flex gap-2 mt-5 pt-4 border-t border-ink-100">
        <Skeleton shape="rect" className="h-11 flex-[2]" />
        <Skeleton shape="rect" className="h-11 flex-1" />
      </div>
    </div>
  )
}

/** Card skeleton per i prodotti nella vetrina pubblica */
export function ProductCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-[var(--radius-xl)] border border-ink-100 overflow-hidden shadow-[var(--shadow-sm)]">
      <Skeleton shape="rect" className="w-full h-44 rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton shape="line" className="w-2/3 h-4" />
        <Skeleton shape="line" className="w-1/2" />
        <Skeleton shape="pill" className="w-20" />
      </div>
    </div>
  )
}
