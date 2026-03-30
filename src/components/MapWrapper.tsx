'use client' // Questo dice a Next.js: "Ehi, questo componente vive nel browser!"

import dynamic from 'next/dynamic'

// Spostiamo qui il caricamento dinamico
const Map = dynamic(() => import('./Map'), { 
  ssr: false, 
  loading: () => <div className="h-[500px] bg-stone-100 animate-pulse rounded-2xl flex items-center justify-center text-stone-400 font-medium">Caricamento mappa...</div>
})

export default Map;