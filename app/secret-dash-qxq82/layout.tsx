import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-900">
      
      {/* --- SIDEBAR ADMIN --- */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <img src="/logo.png" alt="QoQoStore" className="h-10 w-auto object-contain" />
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            href="/secret-dash-qxq82" 
            className="block px-4 py-2.5 text-sm font-semibold text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            Laporan Pesanan
          </Link>
          <Link 
            href="/secret-dash-qxq82/products" 
            className="block px-4 py-2.5 text-sm font-semibold text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            Kelola Barang & Varian
          </Link>
          <Link 
            href="/secret-dash-qxq82/categories" 
            className="block px-4 py-2.5 text-sm font-semibold text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            Kelola Grup & Kategori
          </Link>
          <Link 
            href="/secret-dash-qxq82/banners" 
            className="block px-4 py-2.5 text-sm font-semibold text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            Kelola Banner (Carousel)
          </Link>
          <Link 
            href="/secret-dash-qxq82/announcement" 
            className="block px-4 py-2.5 text-sm font-semibold text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            Kelola Pengumuman
          </Link>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Link 
            href="/" 
            className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Lihat Toko (Depan)
          </Link>
        </div>
      </aside>

      {/* --- AREA KONTEN UTAMA --- */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
        <div className="p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}