'use client'

import { ReactNode } from 'react'
import { ToastProvider } from './Toast'
import { DialogProvider } from './ConfirmDialog'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DialogProvider>{children}</DialogProvider>
    </ToastProvider>
  )
}
