'use client'

import { forwardRef, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from './cn'

interface BaseFieldProps {
  label?: string
  hint?: string
  error?: string | null
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

const FIELD_BASE =
  'w-full bg-surface-card text-ink-900 placeholder:text-ink-400 ' +
  'rounded-[var(--radius-md)] border border-ink-100 px-4 py-3.5 text-sm font-medium ' +
  'transition-[border-color,box-shadow,background] duration-150 ' +
  'focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed'

const ERROR_BASE = 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/10'

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, iconLeft, iconRight, className, id, ...rest },
  ref,
) {
  const hasIconLeft = Boolean(iconLeft)
  const hasIconRight = Boolean(iconRight)
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {hasIconLeft && (
          <span className="absolute inset-y-0 left-3 flex items-center text-ink-400">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            FIELD_BASE,
            hasIconLeft && 'pl-11',
            hasIconRight && 'pr-11',
            error && ERROR_BASE,
            className,
          )}
          {...rest}
        />
        {hasIconRight && (
          <span className="absolute inset-y-0 right-3 flex items-center text-ink-400">
            {iconRight}
          </span>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 ml-1 flex items-center gap-1 text-xs font-semibold text-danger-600">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 ml-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
})

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<BaseFieldProps, 'iconLeft' | 'iconRight'> {
  counterMax?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, counterMax, className, id, value, ...rest },
  ref,
) {
  const length = typeof value === 'string' ? value.length : 0
  const counterOver = counterMax ? length > counterMax : false

  return (
    <div className="w-full">
      {(label || counterMax) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label
              htmlFor={id}
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500"
            >
              {label}
            </label>
          )}
          {counterMax && (
            <span
              className={cn(
                'text-[10px] font-semibold',
                counterOver ? 'text-danger-600' : 'text-ink-400',
              )}
            >
              {length}/{counterMax}
            </span>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        id={id}
        value={value}
        className={cn(
          FIELD_BASE,
          'resize-none min-h-[110px]',
          error && ERROR_BASE,
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 ml-1 flex items-center gap-1 text-xs font-semibold text-danger-600">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 ml-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
})
