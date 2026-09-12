'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
};

export default function ManageBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newBanner, setNewBanner] = useState({
    title: '', subtitle: '', image_url: '', button_text: 'Buka Game', button_link: '/checkout', is_active: true
  });

  // Fetch Banners
  const fetchBanners = async () => {
    const querySnapshot = await getDocs(collection(db, 'banners'));
    setBanners(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBanner(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewBanner({ title: '', subtitle: '', image_url: '', button_text: 'Buka Game', button_link: '/checkout', is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingId(banner.id);
    setNewBanner({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      button_text: banner.button_text,
      button_link: banner.button_link,
      is_active: banner.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'banners', editingId), newBanner);
      } else {
        await addDoc(collection(db, 'banners'), newBanner);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewBanner({ title: '', subtitle: '', image_url: '', button_text: 'Buka Game', button_link: '/checkout', is_active: true });
      fetchBanners();
    } catch (error) {
      alert('Gagal menyimpan banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Hapus banner ini?')) {
      await deleteDoc(doc(db, 'banners', id));
      fetchBanners();
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'banners', id), { is_active: !currentStatus });
    fetchBanners();
  };

  return (
    <div className="qoqo-card">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Banner Carousel</h1>
          <p className="text-sm text-gray-500 mt-1">Atur gambar yang muncul bergeser di halaman depan.</p>
        </div>
        <button onClick={openAddModal} className="qoqo-btn-primary">+ Tambah Banner</button>
      </div>

      <div className="overflow-x-auto">
        <table className="qoqo-table">
          <thead>
            <tr>
              <th>Pratinjau</th>
              <th>Judul</th>
              <th>Tombol</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {banners.map(b => (
              <tr key={b.id}>
                <td>
                  <img src={b.image_url} alt="Banner" className="w-24 h-12 object-cover rounded-md bg-gray-200" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'} />
                </td>
                <td className="font-semibold text-gray-900">{b.title}</td>
                <td>{b.button_text} <br/><span className="text-xs text-gray-400">{b.button_link}</span></td>
                <td>
                  <button onClick={() => toggleStatus(b.id, b.is_active)} className={`px-2.5 py-1 rounded-md text-xs font-bold ${b.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {b.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="text-right space-x-2">
                  <button onClick={() => openEditModal(b)} className="text-sm font-semibold text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(b.id)} className="text-sm font-semibold text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold mb-6 border-b pb-2">{editingId ? 'Edit Banner' : 'Tambah Banner'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="qoqo-label">Judul Utama (Mendukung HTML dasar seperti &lt;br/&gt;)</label><input required name="title" value={newBanner.title} onChange={handleChange} className="qoqo-input" placeholder="Update CDID..." /></div>
              <div><label className="qoqo-label">Sub Judul (Kecil di bawah judul)</label><input name="subtitle" value={newBanner.subtitle} onChange={handleChange} className="qoqo-input" placeholder="CDID." /></div>
              <div><label className="qoqo-label">URL Gambar (Link eksternal)</label><input required name="image_url" value={newBanner.image_url} onChange={handleChange} className="qoqo-input" placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="qoqo-label">Teks Tombol</label><input required name="button_text" value={newBanner.button_text} onChange={handleChange} className="qoqo-input" /></div>
                <div><label className="qoqo-label">Link Tombol</label><input required name="button_link" value={newBanner.button_link} onChange={handleChange} className="qoqo-input" /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="qoqo-btn-secondary">Batal</button>
                <button type="submit" disabled={isLoading} className="qoqo-btn-primary">{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}