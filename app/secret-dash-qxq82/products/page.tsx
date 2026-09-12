'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Variant = {
  id?: string;
  name: string;
  additional_price: number;
  stock: number;
  product_id?: string;
};

type Product = {
  id: string;
  name: string;
  group_id: string;
  base_price: number;
  description: string;
  image_url?: string;
  image_source_type?: 'upload' | 'url';
  is_active: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State Form Barang
  const [productForm, setProductForm] = useState({ 
    name: '', 
    group_id: '', 
    description: '', 
    base_price: 0, 
    image_url: '',
    image_source_type: 'upload' as 'upload' | 'url',
    is_active: true 
  });
  
  // State Varian untuk Produk
  const [variants, setVariants] = useState<Variant[]>([
    { name: 'Varian Utama', additional_price: 0, stock: 10 }
  ]);

  const fetchData = async () => {
    try {
      const prodSnap = await getDocs(collection(db, 'products'));
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);

      const catSnap = await getDocs(query(collection(db, 'categories'), where('is_active', '==', true)));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProductForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  // Auto-kompres gambar ke Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.7;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > 900 * 1024 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        setProductForm(prev => ({ ...prev, image_url: dataUrl }));
      };
    };
  };

  const handleVariantChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [name]: type === 'number' ? Number(value) : value };
    setVariants(newVariants);
  };

  const addVariant = () => setVariants([...variants, { name: '', additional_price: 0, stock: 10 }]);
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));

  const openAddModal = () => {
    setEditingId(null);
    setProductForm({ 
      name: '', 
      group_id: '', 
      description: '', 
      base_price: 0, 
      image_url: '', 
      image_source_type: 'upload',
      is_active: true 
    });
    setVariants([{ name: 'Varian Utama', additional_price: 0, stock: 10 }]);
    setIsModalOpen(true);
  };

  const openEditModal = async (product: Product) => {
    setEditingId(product.id);
    setProductForm({
      name: product.name || '',
      group_id: product.group_id || '',
      description: product.description || '',
      base_price: product.base_price || 0,
      image_url: product.image_url || '',
      image_source_type: 'url',
      is_active: product.is_active ?? true
    });

    // Ambil data varian terkait produk ini dari Firestore
    try {
      const q = query(collection(db, 'variants'), where('product_id', '==', product.id));
      const querySnapshot = await getDocs(q);
      const fetchedVariants = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Variant[];

      if (fetchedVariants.length > 0) {
        setVariants(fetchedVariants);
      } else {
        setVariants([{ name: 'Varian Utama', additional_price: 0, stock: 10 }]);
      }
    } catch (error) {
      console.error("Gagal mengambil varian:", error);
      setVariants([{ name: 'Varian Utama', additional_price: 0, stock: 10 }]);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        // --- MODE EDIT ---
        await updateDoc(doc(db, 'products', editingId), productForm);

        // Perbarui varian: Hapus varian lama yang terkait produk ini lalu buat ulang atau update
        // Cara paling rapi untuk skala kecil: hapus semua varian lama produk ini di DB lalu buat baru sesuai state
        const oldVariantsQuery = query(collection(db, 'variants'), where('product_id', '==', editingId));
        const oldSnap = await getDocs(oldVariantsQuery);
        const deletePromises = oldSnap.docs.map(d => deleteDoc(doc(db, 'variants', d.id)));
        await Promise.all(deletePromises);

        const newVariantPromises = variants.map(variant => 
          addDoc(collection(db, 'variants'), { 
            name: variant.name,
            additional_price: Number(variant.additional_price) || 0,
            stock: Number(variant.stock) || 0,
            product_id: editingId 
          })
        );
        await Promise.all(newVariantPromises);

        alert('Produk dan varian berhasil diperbarui!');
      } else {
        // --- MODE TAMBAH BARU ---
        const productRef = await addDoc(collection(db, 'products'), productForm);
        const variantPromises = variants.map(variant => 
          addDoc(collection(db, 'variants'), { 
            name: variant.name,
            additional_price: Number(variant.additional_price) || 0,
            stock: Number(variant.stock) || 0,
            product_id: productRef.id 
          })
        );
        await Promise.all(variantPromises);
        alert('Berhasil! Produk, varian, dan stok ditambahkan.');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      alert('Gagal menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus produk ini beserta variannya?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchData();
      } catch (error) {
        alert('Gagal menghapus produk.');
      }
    }
  };

  return (
    <div className="qoqo-card">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Barang</h1>
        </div>
        <button onClick={openAddModal} className="qoqo-btn-primary">+ Tambah Barang</button>
      </div>

      <div className="overflow-x-auto">
        <table className="qoqo-table">
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Nama Barang</th>
              <th>Kategori</th>
              <th>Harga Dasar</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Belum ada produk tersimpan di database.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <img 
                      src={product.image_url || 'https://via.placeholder.com/150'} 
                      alt={product.name} 
                      className="w-12 h-12 object-cover rounded-lg bg-gray-100 border"
                    />
                  </td>
                  <td className="font-semibold text-gray-900">{product.name}</td>
                  <td>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium uppercase">
                      {product.group_id || 'Umum'}
                    </span>
                  </td>
                  <td className="font-bold text-gray-900">Rp {product.base_price?.toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="text-right space-x-3">
                    <button onClick={() => openEditModal(product)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="text-sm font-semibold text-red-600 hover:text-red-800">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL TAMBAH / EDIT BARANG & VARIAN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden my-auto">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Produk & Varian' : 'Tambah Barang Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-200 rounded-full p-2">✕</button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. DETAIL UTAMA */}
                <section>
                  <h3 className="qoqo-label border-b pb-2 mb-4 text-lg">1. Detail Utama</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="qoqo-label">Nama Barang</label>
                      <input type="text" name="name" required value={productForm.name} onChange={handleProductChange} className="qoqo-input" placeholder="Misal: Akun Roblox..." />
                    </div>
                    <div>
                      <label className="qoqo-label">Kategori</label>
                      <select name="group_id" required value={productForm.group_id} onChange={handleProductChange} className="qoqo-input">
                        <option value="">Pilih Kategori...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="qoqo-label">Harga Dasar (Rp)</label>
                      <input type="number" name="base_price" required min="0" value={productForm.base_price} onChange={handleProductChange} className="qoqo-input md:w-1/2" />
                    </div>

                    {/* OPSI GAMBAR: UPLOAD ATAU LINK */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="qoqo-label mb-0">Gambar Produk</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setProductForm(prev => ({ ...prev, image_source_type: 'upload' }))}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${productForm.image_source_type !== 'url' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductForm(prev => ({ ...prev, image_source_type: 'url' }))}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${productForm.image_source_type === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                          >
                            Gunakan Link URL
                          </button>
                        </div>
                      </div>

                      {productForm.image_source_type === 'url' ? (
                        <input type="url" name="image_url" value={productForm.image_url} onChange={handleProductChange} className="qoqo-input" placeholder="https://..." />
                      ) : (
                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer border border-gray-300 rounded-lg" />
                      )}

                      {productForm.image_url && (
                        <img src={productForm.image_url} alt="Pratinjau" className="w-20 h-20 object-cover rounded-xl border mt-2 bg-gray-50" />
                      )}
                    </div>

                    <div className="md:col-span-2 flex items-center gap-3 pt-2">
                      <input type="checkbox" name="is_active" id="is_active_check" checked={productForm.is_active} onChange={(e) => setProductForm(prev => ({ ...prev, is_active: e.target.checked }))} className="w-5 h-5 text-blue-600 rounded" />
                      <label htmlFor="is_active_check" className="text-sm font-semibold text-gray-700 cursor-pointer">Tampilkan produk di halaman toko utama</label>
                    </div>
                  </div>
                </section>

                {/* 2. VARIAN & STOK (Kini aktif di mode Tambah maupun Edit) */}
                <section className="bg-gray-50 -mx-6 px-6 py-6 border-t border-b border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="qoqo-label text-lg mb-0">2. Varian & Stok</h3>
                    <button type="button" onClick={addVariant} className="qoqo-btn-secondary text-xs py-1.5">+ Baris Varian</button>
                  </div>
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex flex-col md:flex-row items-end gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex-1 w-full">
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Nama Varian</label>
                          <input type="text" name="name" required value={variant.name} onChange={(e) => handleVariantChange(index, e)} className="qoqo-input py-2 text-sm" placeholder="Misal: 400 Robux / Level Max" />
                        </div>
                        <div className="flex-1 w-full">
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">+ Harga (Rp)</label>
                          <input type="number" name="additional_price" min="0" value={variant.additional_price} onChange={(e) => handleVariantChange(index, e)} className="qoqo-input py-2 text-sm" />
                        </div>
                        <div className="w-full md:w-28">
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Stok</label>
                          <input type="number" name="stock" min="0" required value={variant.stock} onChange={(e) => handleVariantChange(index, e)} className="qoqo-input py-2 text-sm" />
                        </div>
                        {variants.length > 1 && (
                          <button type="button" onClick={() => removeVariant(index)} className="px-3 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Hapus</button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="qoqo-btn-secondary">Batal</button>
              <button type="submit" form="product-form" disabled={isLoading} className="qoqo-btn-primary">
                {isLoading ? 'Menyimpan...' : (editingId ? 'Perbarui Produk' : 'Simpan Barang')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}