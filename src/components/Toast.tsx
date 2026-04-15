'use client'
import { useEffect } from 'react'
import { CheckCircle, X, Heart, MessageCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'info' | 'favorite' | 'contact'
  isVisible: boolean
  onClose: () => void
}

export default function Toast({ message, type = 'success', isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    info: <CheckCircle className="w-5 h-5 text-blue-600" />,
    favorite: <Heart className="w-5 h-5 text-red-500 fill-red-500" />,
    contact: <MessageCircle className="w-5 h-5 text-green-600" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200',
    favorite: 'bg-red-50 border-red-200',
    contact: 'bg-green-50 border-green-200'
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[5000] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${bgColors[type]} backdrop-blur-sm`}>
        {icons[type]}
        <span className="font-semibold text-sm text-neutral-800">{message}</span>
        <button 
          onClick={onClose}
          className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
    </div>
  )
}
