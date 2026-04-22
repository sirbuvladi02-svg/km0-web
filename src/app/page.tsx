'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sprout, ShoppingBag, DollarSign, Clock, MapPin, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import MapWrapper from '@/components/MapWrapper';
import { supabase } from '@/lib/supabase';

export default function App() {
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: productsData } = await supabase.from('products').select('*');
      if (productsData) setProducts(productsData);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(profileData);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900">
      {/* HEADER */}
      <header className="border-b border-neutral-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center shadow-md">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-green-700 tracking-tighter">farm2you</span>
          </Link>

          {loading ? <Loader2 className="animate-spin text-neutral-300" /> : (
            user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                    {profile?.role === 'farmer' ? 'Area Produttore' : 'Benvenuto'}
                  </p>
                  {profile?.role === 'farmer' ? (
                    <Link href="/farmer/dashboard" className="text-sm font-bold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1">
                      <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                    </Link>
                  ) : (
                    <Link href="/buyer/dashboard" className="text-sm font-bold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1">
                      <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                    </Link>
                  )}
                </div>
                <button onClick={handleLogout} className="bg-neutral-100 text-neutral-500 p-2.5 rounded-full hover:bg-red-50 hover:text-red-600 transition shadow-sm">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-neutral-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-neutral-800 transition shadow-lg">
                Accedi / Registrati
              </Link>
            )
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center lg:text-left">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-7xl font-black text-neutral-900 mb-6 leading-[1.1] tracking-tight italic">
                Dal <span className="text-green-700">campo</span> allo <span className="text-green-700">scaffale</span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                Colleghiamo i contadini locali direttamente con ristoranti e botteghe. 
                Prodotti freschi, prezzi giusti, zero intermediari.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href={user ? (profile?.role === 'farmer' ? "/farmer/dashboard" : "#") : "/login?role=farmer"} 
                  className={`bg-green-700 hover:bg-green-800 text-white px-8 py-5 rounded-2xl text-lg font-bold flex items-center justify-center shadow-lg transition transform hover:scale-105 ${user && profile?.role !== 'farmer' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Sprout className="w-5 h-5 mr-2" /> Sono un Contadino
                </Link>
                <Link
                  href={user ? "/buyer/dashboard" : "/login?role=buyer"}
                  className="border-2 border-green-700 text-green-700 hover:bg-green-50 px-8 py-5 rounded-2xl text-lg font-bold flex items-center justify-center transition shadow-sm"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" /> {user ? 'La Mia Dashboard' : 'Sono un Buyer'}
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-white border-8 rotate-2">
                <img src="https://images.unsplash.com/photo-1748342319942-223b99937d4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAPPA - Fix Definitivo Fit */}
      <section id="map" className="py-24 bg-neutral-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-neutral-900 mb-4 tracking-tight uppercase italic">Scopri le Aziende Vicine</h2>
            <p className="text-xl text-green-700 font-bold uppercase tracking-widest text-sm italic">La rivoluzione del KM0 inizia qui</p>
          </div>
          
          {/* Contenitore con bordo spesso per nascondere i tagli della mappa */}
          <div className="bg-white rounded-[4rem] shadow-2xl border-[12px] border-white h-[600px] overflow-hidden relative isolate z-0">
             <MapWrapper locations={products || []} />
          </div>
        </div>
      </section>

      <footer className="bg-neutral-900 text-white py-12 text-center">
        <p className="text-neutral-500 text-xs font-black tracking-[0.3em] uppercase">© 2026 KM0 Project</p>
      </footer>
    </div>
  );
}