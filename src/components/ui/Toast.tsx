'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from './cn'

type ToastTone = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  tone: ToastTone
  title: string
  description?: string
  duration?: number
}

interface ToastInput {
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toast: (tone: ToastTone, input: ToastInput) => void
  success: (input: ToastInput) => void
  error: (input: ToastInput) => void
  warning: (input: ToastInput) => void
  info: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_STYLES: Record<ToastTone, { bg: string; border: string; icon: ReactNode; text: string }> = {
  success: {
    bg: 'bg-success-50',
    border: 'border-success-500/30',
    text: 'text-success-700',
    icon: <CheckCircle2 className="w-5 h-5 text-success-500" />,
  },
  error: {
    bg: 'bg-danger-50',
    border: 'border-danger-500/30',
    text: 'text-danger-700',
    icon: <AlertCircle className="w-5 h-5 text-danger-500" />,
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-500/40',
    text: 'text-warning-600',
    icon: <AlertTriangle className="w-5 h-5 text-warning-500" />,
  },
  info: {
    bg: 'bg-info-50',
    border: 'border-info-500/30',
    text: 'text-info-600',
    icon: <Info className="w-5 h-5 text-info-500" />,
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, input: ToastInput) => {
      counter.current += 1
      const id = `toast-${Date.now()}-${counter.current}`
      const item: ToastItem = {
        id,
        tone,
        title: input.title,
        description: input.description,
        duration: input.duration ?? 4000,
      }
      setItems(prev => [...prev, item])
      if (item.duration && item.duration > 0) {
        setTimeout(() => remove(id), item.duration)
      }
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (input) => push('success', input),
      error: (input) => push('error', input),
      warning: (input) => push('warning', input),
      info: (input) => push('info', input),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-3 px-4 pb-6 sm:items-end sm:right-6 sm:left-auto sm:bottom-6">
        {items.map(item => {
          const styles = TONE_STYLES[item.tone]
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto w-full max-w-sm rounded-[var(--radius-lg)] border bg-surface-card shadow-[var(--shadow-md)] p-4 flex items-start gap-3 animate-slide-up',
                styles.bg,
                styles.border,
              )}
            >
              <span className="mt-0.5 shrink-0">{styles.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-sm leading-tight', styles.text)}>{item.title}</p>
                {item.description && (
                  <p className="text-xs text-ink-600 mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-ink-400 hover:text-ink-700 transition"
                aria-label="Chiudi notifica"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve essere usato dentro <ToastProvider>')
  }
  return ctx
}
