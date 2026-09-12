'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type CategoryGroup = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
};

export default function ManageCategories() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State Form Kategori
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true
  });

  // Ambil Data Kategori dari Firebase
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CategoryGroup[];
      setCategories(data);
    } catch (error) {
      console.error("Gagal memuat kategori:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        // Auto-generate slug dari nama jika mengisi nama
        if (name === 'name') {
          updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addDoc(collection(db, 'categories'), formData);
      alert('Grup Kategori berhasil ditambahkan!');
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', description: '', is_active: true });
      fetchCategories();
    } catch (error) {
      console.error("Error:", error);
      alert('Gagal menyimpan kategori.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus kategori ini?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        fetchCategories();
      } catch (error) {
        alert('Gagal menghapus kategori.');
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'categories', id), { is_active: !currentStatus });
      fetchCategories();
    } catch (error) {
      alert('Gagal mengubah status.');
    }
  };

  return (
    <div className="qoqo-card">
      
      {/* Header Halaman */}
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Grup & Kategori</h1>
          <p className="text-sm text-gray-500 mt-1">Atur daftar kategori game atau layanan produk di toko Anda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="qoqo-btn-primary"
        >
          + Tambah Kategori
        </button>
      </div>

      {/* Tabel Data Kategori */}
      <div className="overflow-x-auto">
        <table className="qoqo-table">
          <thead>
            <tr>
              <th>Nama Kategori</th>
              <th>Slug (URL)</th>
              <th>Deskripsi</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Belum ada kategori yang ditambahkan.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="font-semibold text-gray-900">{cat.name}</td>
                  <td>
                    <code className="text-xs bg-gray-100 text-blue-600 px-2 py-1 rounded font-mono">
                      /category/{cat.slug}
                    </code>
                  </td>
                  <td className="text-gray-500 max-w-xs truncate">{cat.description || '-'}</td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(cat.id, cat.is_active)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                        cat.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {cat.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL TAMBAH KATEGORI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Grup Kategori</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="qoqo-label">Nama Kategori</label>
                <input 
                  type="text" name="name" required 
                  value={formData.name} onChange={handleChange} 
                  className="qoqo-input" placeholder="Misal: Gift Item / Joki" 
                />
              </div>

              <div>
                <label className="qoqo-label">Slug (Otomatis dari Nama)</label>
                <input 
                  type="text" name="slug" required 
                  value={formData.slug} onChange={handleChange} 
                  className="qoqo-input bg-gray-50 font-mono text-sm" placeholder="gift-item" 
                />
              </div>

              <div>
                <label className="qoqo-label">Deskripsi (Opsional)</label>
                <textarea 
                  name="description" rows={3}
                  value={formData.description} onChange={handleChange} 
                  className="qoqo-input" placeholder="Keterangan singkat kategori..." 
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" name="is_active" id="modal_active"
                  checked={formData.is_active} onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
                />
                <label htmlFor="modal_active" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Aktifkan kategori ini langsung di toko
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)} 
                  className="qoqo-btn-secondary"
                >
                  Batal
                </button>
                <button 
                  type="submit" disabled={isLoading} 
                  className="qoqo-btn-primary"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}