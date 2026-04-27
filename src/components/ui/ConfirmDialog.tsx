'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from './cn'

type DialogTone = 'neutral' | 'danger' | 'success'

interface ConfirmInput {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
  hideCancel?: boolean
}

interface DialogContextValue {
  confirm: (input: ConfirmInput) => Promise<boolean>
  notify: (input: Omit<ConfirmInput, 'cancelLabel'>) => Promise<void>
}

const DialogContext = createContext<DialogContextValue | null>(null)

interface DialogState extends ConfirmInput {
  resolve: (value: boolean) => void
}

const TONE_ICON: Record<DialogTone, ReactNode> = {
  neutral: <AlertTriangle className="w-6 h-6 text-warning-500" />,
  danger: <AlertTriangle className="w-6 h-6 text-danger-500" />,
  success: <AlertTriangle className="w-6 h-6 text-success-500" />,
}

const TONE_BG: Record<DialogTone, string> = {
  neutral: 'bg-warning-50',
  danger: 'bg-danger-50',
  success: 'bg-success-50',
}

const TONE_BUTTON: Record<DialogTone, 'primary' | 'danger'> = {
  neutral: 'primary',
  danger: 'danger',
  success: 'primary',
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const close = useCallback((value: boolean) => {
    setState(prev => {
      if (prev) prev.resolve(value)
      return null
    })
  }, [])

  useEffect(() => {
    if (!state) return
    previousFocus.current = (document.activeElement as HTMLElement) || null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(false)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        close(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previousFocus.current?.focus()
    }
  }, [state, close])

  const confirm = useCallback((input: ConfirmInput) => {
    return new Promise<boolean>(resolve => {
      setState({ ...input, resolve })
    })
  }, [])

  const notify = useCallback(
    async (input: Omit<ConfirmInput, 'cancelLabel'>) => {
      await new Promise<boolean>(resolve => {
        setState({ ...input, hideCancel: true, resolve })
      })
    },
    [],
  )

  const value = useMemo<DialogContextValue>(() => ({ confirm, notify }), [confirm, notify])

  return (
    <DialogContext.Provider value={value}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[var(--color-surface-overlay)] backdrop-blur-sm animate-fade-in"
          onClick={() => close(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-md rounded-[var(--radius-xl)] bg-surface-card shadow-[var(--shadow-lg)] border border-ink-100 p-6 sm:p-7 animate-pop-in"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => close(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ink-50 text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition flex items-center justify-center"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  TONE_BG[state.tone || 'neutral'],
                )}
              >
                {TONE_ICON[state.tone || 'neutral']}
              </div>
              <div className="flex-1 pt-0.5">
                <h2 className="text-lg font-bold text-ink-900 leading-tight">{state.title}</h2>
                {state.description && (
                  <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">{state.description}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              {!state.hideCancel && (
                <Button
                  variant="ghost"
                  onClick={() => close(false)}
                  className="sm:min-w-[120px]"
                >
                  {state.cancelLabel || 'Annulla'}
                </Button>
              )}
              <Button
                variant={TONE_BUTTON[state.tone || 'neutral']}
                onClick={() => close(true)}
                className="sm:min-w-[140px]"
              >
                {state.confirmLabel || 'Conferma'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useConfirm(): DialogContextValue {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useConfirm deve essere usato dentro <DialogProvider>')
  return ctx
}
