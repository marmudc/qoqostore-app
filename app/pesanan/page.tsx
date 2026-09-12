'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function PesananPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1116] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col bg-[#0e1116] text-white font-sans selection:bg-blue-500/30">
        <header className="border-b border-gray-800/60 bg-[#0e1116] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="hidden">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              </div>
              <img src="/logo.png" alt="QoQoStore" className="h-10 w-auto object-contain" />
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-[#151822] border border-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-2 text-white">Kamu Harus Login</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Silakan masuk ke akun Anda terlebih dahulu untuk melihat daftar riwayat pesanan Anda.
            </p>
            <div className="flex flex-col gap-3">
              <Link 
                href="/akun" 
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                Masuk / Login Sekarang
              </Link>
              <Link 
                href="/" 
                className="w-full py-3 bg-[#1a1d27] border border-gray-800 hover:bg-gray-800 text-gray-300 font-bold rounded-2xl transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#0e1116] text-white font-sans selection:bg-blue-500/30">
      <header className="border-b border-gray-800/60 bg-[#0e1116] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="hidden">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <img src="/logo.png" alt="QoQoStore" className="h-10 w-auto object-contain" />
          </Link>
          <Link href="/" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            Kembali ke Toko
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-black mb-2">Pesanan Saya</h1>
        <p className="text-gray-400 text-sm mb-8">Berikut adalah riwayat transaksi yang terhubung dengan akun Anda ({user.email}).</p>

        <div className="bg-[#151822] border border-gray-800 rounded-3xl p-10 text-center">
          <p className="text-gray-500 font-medium">Belum ada riwayat pesanan.</p>
        </div>
      </div>
    </main>
  );
}
