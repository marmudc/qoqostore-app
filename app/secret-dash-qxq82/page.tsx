'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mendefinisikan tipe data agar TypeScript tidak error
type OrderItem = {
  variant_name: string;
  qty: number;
  price_at_buy: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_contact: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: Date | null; 
};

export default function DashboardHome() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Membuat query: Ambil koleksi 'orders', urutkan dari yang paling baru (descending)
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    
    // onSnapshot akan "mendengarkan" perubahan data secara real-time
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Konversi Timestamp Firebase ke Date Javascript
        const rawDate = data.created_at as Timestamp;
        const formattedDate = rawDate ? rawDate.toDate() : null;

        return {
          id: doc.id,
          ...data,
          created_at: formattedDate,
        } as Order;
      });

      setOrders(ordersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data pesanan:", error);
      setIsLoading(false);
    });

    // Cleanup listener saat pengguna pindah halaman agar memori tidak bocor
    return () => unsubscribe();
  }, []);

  // Fungsi helper untuk memformat tanggal
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Header Tabel */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Laporan Pesanan Masuk</h1>
        <p className="text-sm text-gray-500 mt-1">Data ini diperbarui secara otomatis (real-time).</p>
      </div>

      {/* Tabel Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Waktu & ID</th>
              <th className="px-6 py-4">Pelanggan</th>
              <th className="px-6 py-4">Detail Barang</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Memuat data pesanan real-time...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Belum ada pesanan yang masuk.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{formatDate(order.created_at)}</div>
                    <div className="text-xs text-gray-400 mt-0.5" title={order.id}>
                      ID: {order.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{order.customer_name}</div>
                    <a 
                      href={`https://wa.me/${order.customer_contact}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                    >
                      Chat WA ↗
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <ul className="list-disc list-inside">
                      {order.items?.map((item, idx) => (
                        <li key={idx} className="truncate max-w-[200px]">
                          {item.qty}x {item.variant_name}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    Rp {order.total_amount?.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      order.status === 'Selesai' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      Proses
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}