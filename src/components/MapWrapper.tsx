'use client'

import dynamic from 'next/dynamic'

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-stone-100 animate-pulse rounded-2xl flex items-center justify-center text-stone-400 font-medium">Caricamento mappa...</div>
})

export default function MapWrapper(props: any) {
  return <Map {...props} />
}