'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ManageAnnouncement() {
  const [isLoading, setIsLoading] = useState(false);
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    is_active: false
  });

  // Ambil data pengumuman saat ini (Kita gunakan ID dokumen statis 'main')
  useEffect(() => {
    const fetchAnnouncement = async () => {
      const docRef = doc(db, 'settings', 'announcement');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAnnouncement(docSnap.data() as any);
      }
    };
    fetchAnnouncement();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setAnnouncement(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setAnnouncement(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Gunakan setDoc agar jika dokumen belum ada, ia akan membuatnya
      await setDoc(doc(db, 'settings', 'announcement'), announcement, { merge: true });
      alert('Pengumuman berhasil diperbarui!');
    } catch (error) {
      alert('Gagal menyimpan pengumuman.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="qoqo-card max-w-2xl">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Kelola Pengumuman</h1>
        <p className="text-sm text-gray-500 mt-1">Atur teks popup yang muncul saat pertama kali web dibuka.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="qoqo-label">Judul Pengumuman</label>
          <input 
            type="text" name="title" required
            value={announcement.title} onChange={handleChange} 
            className="qoqo-input" placeholder="Contoh: INFO UPDATE RESMI!" 
          />
        </div>
        
        <div>
          <label className="qoqo-label">Isi Pesan</label>
          <textarea 
            name="content" required rows={5}
            value={announcement.content} onChange={handleChange} 
            className="qoqo-input" placeholder="Ketik pengumuman di sini..." 
          />
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <input 
            type="checkbox" name="is_active" id="is_active"
            checked={announcement.is_active} onChange={handleChange} 
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
          />
          <label htmlFor="is_active" className="font-semibold text-gray-800 cursor-pointer">
            Aktifkan Popup Pengumuman
          </label>
        </div>

        <button type="submit" disabled={isLoading} className="qoqo-btn-primary w-full">
          {isLoading ? 'Menyimpan...' : 'Simpan Pengumuman'}
        </button>
      </form>
    </div>
  );
}