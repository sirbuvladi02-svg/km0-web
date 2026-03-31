'use client'
import { Tractor } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TractorLoader({ customMessage }: { customMessage?: string }) {
  // Frasi simpatiche casuali
  const messages = [
    "Sto accendendo il motore...",
    "Arando il database...",
    "Raccogliendo i dati freschi...",
    "Preparando i prodotti a KM0...",
    "Scaldando i trattori...",
    "Mappando i campi agricoli..."
  ]
  
  const [message, setMessage] = useState("Caricamento in corso...")

  useEffect(() => {
    // Se non passiamo un messaggio specifico, ne pesca uno a caso!
    if (!customMessage) {
      setMessage(messages[Math.floor(Math.random() * messages.length)])
    } else {
      setMessage(customMessage)
    }
  }, [customMessage])

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      {/* 🎬 CSS ANIMATION (Iniettato localmente per non toccare i file globali) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drive {
          0% { transform: translateX(-250%); }
          100% { transform: translateX(250%); }
        }
        .animate-drive {
          animation: drive 2.5s infinite linear;
        }
        @keyframes bounce-tractor {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-tractor {
          animation: bounce-tractor 0.4s infinite ease-in-out;
        }
        @keyframes dirt {
          0% { opacity: 1; transform: scale(1) translate(0, 0); }
          100% { opacity: 0; transform: scale(0.5) translate(-15px, -5px); }
        }
        .animate-dirt {
          animation: dirt 0.6s infinite;
        }
      `}} />
      
      {/* LA STRADA E IL TRATTORE */}
      <div className="relative w-64 h-16 overflow-hidden flex items-center justify-center border-b-4 border-green-800/10">
        <div className="absolute animate-drive flex items-center text-green-700">
          
          {/* Effetto Terra sollevata */}
          <div className="w-2 h-2 bg-amber-700/40 rounded-full animate-dirt absolute -left-2 bottom-0"></div>
          <div className="w-1.5 h-1.5 bg-amber-700/30 rounded-full animate-dirt absolute -left-4 bottom-1" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-amber-700/20 rounded-full animate-dirt absolute -left-6 bottom-0" style={{ animationDelay: '0.4s' }}></div>
          
          {/* L'icona del trattore che "traballa" sulle buche */}
          <Tractor className="w-12 h-12 animate-bounce-tractor drop-shadow-md" strokeWidth={1.5} />
        </div>
      </div>
      
      {/* IL TESTO */}
      <p className="text-green-700 font-black uppercase tracking-widest text-sm animate-pulse text-center">
        {message}
      </p>
    </div>
  )
}