'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where, getDoc, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';

type Product = { id: string; name: string; group_id: string; base_price: number; description: string; image_url?: string; is_active: boolean; };
type Banner = { id: string; title: string; subtitle: string; image_url: string; button_text: string; button_link: string; is_active: boolean; };
type Announcement = { title: string; content: string; is_active: boolean; };
type Variant = { id: string; name: string; additional_price: number; stock: number; product_id: string; };
type CartItem = { product: Product; variant: Variant; quantity: number; };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  
  // State Pengumuman & Modal Pengumuman
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  // State Keranjang & Modal Keranjang
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isVariantOpen, setIsVariantOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productVariants, setProductVariants] = useState<Variant[]>([]);
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutForm, setCheckoutForm] = useState({ username: '', email: '', password: '', notes: '' });

  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil Produk
        const prodQuery = query(collection(db, 'products'), where('is_active', '==', true));
        const prodSnap = await getDocs(prodQuery);
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);

        // Ambil Banner
        const banQuery = query(collection(db, 'banners'), where('is_active', '==', true));
        const banSnap = await getDocs(banQuery);
        setBanners(banSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[]);

        // Ambil Pengumuman
        const annSnap = await getDoc(doc(db, 'settings', 'announcement'));
        if (annSnap.exists()) {
          const annData = annSnap.data() as Announcement;
          setAnnouncement(annData);
          
          if (annData.is_active && !sessionStorage.getItem('pengumuman_dilihat')) {
            setIsAnnouncementOpen(true);
            sessionStorage.setItem('pengumuman_dilihat', 'true');
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Efek Auto-Slide Banner
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Ambil varian ketika kartu produk dipilih
  const openVariantModal = async (product: Product) => {
    setSelectedProduct(product);
    setIsVariantOpen(true);
    setIsVariantLoading(true);
    try {
      const variantsQuery = query(collection(db, 'variants'), where('product_id', '==', product.id));
      const variantsSnapshot = await getDocs(variantsQuery);
      setProductVariants(variantsSnapshot.docs.map((variantDoc) => ({ id: variantDoc.id, ...variantDoc.data() })) as Variant[]);
    } catch (error) {
      console.error('Gagal mengambil varian:', error);
      setProductVariants([]);
    } finally {
      setIsVariantLoading(false);
    }
  };

  const addToCart = (product: Product, variant: Variant) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.variant.id === variant.id);
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      return [...prevCart, { product, variant, quantity: 1 }];
    });
    setIsVariantOpen(false);
    setIsCheckoutOpen(true);
  };

  const selectVariant = (variant: Variant) => {
    if (!selectedProduct || variant.stock <= 0) return;
    addToCart(selectedProduct, variant);
  };

  // Hitung Total Harga Keranjang
  const totalPrice = cart.reduce((sum, item) => sum + ((item.product.base_price + item.variant.additional_price) * item.quantity), 0);

  const handleCheckoutChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCheckoutForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCheckoutLoading(true);
    setCheckoutError('');

    try {
      const username = checkoutForm.username.trim().toLowerCase();
      const email = checkoutForm.email.trim().toLowerCase();
      const usernameQuery = query(collection(db, 'users'), where('username', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        setCheckoutError('Username sudah digunakan. Silakan pilih username lain.');
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, email, checkoutForm.password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        username,
        name: username,
        email,
        created_at: serverTimestamp(),
      });

      const items = cart.map((item) => ({
        product_id: item.product.id,
        variant_name: `${item.product.name} - ${item.variant.name}`,
        qty: item.quantity,
        price_at_buy: item.product.base_price,
      }));
      const order = await addDoc(collection(db, 'orders'), {
        user_id: credential.user.uid,
        username,
        customer_email: email,
        notes: checkoutForm.notes,
        items,
        total_amount: totalPrice,
        status: 'Menunggu Pembayaran',
        created_at: serverTimestamp(),
      });

      const itemList = items.map((item) => `- ${item.qty}x ${item.variant_name}`).join('%0A');
      const message = `Halo QoQoStore, saya ingin mengonfirmasi pesanan:%0A%0A*ID Pesanan: ${order.id.slice(0, 8)}*%0A%0A${itemList}%0A%0ATotal: *Rp ${totalPrice.toLocaleString('id-ID')}*%0AUsername: ${username}%0ACatatan: ${checkoutForm.notes || '-'}`;
      window.location.href = `https://wa.me/6281234567890?text=${message}`;
    } catch (error) {
      const code = (error as { code?: string }).code;
      setCheckoutError(code === 'auth/email-already-in-use' ? 'Email sudah memiliki akun. Silakan login terlebih dahulu.' : 'Checkout gagal. Periksa data dan coba lagi.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#0e1116] text-white font-sans selection:bg-blue-500/30">
      
      {/* --- HEADER NAVBAR --- */}
      <header className="border-b border-gray-800/60 bg-[#0e1116] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
                 <div className="w-fit h-10 flex items-center">
                   <img src="/logo.png" alt="QoQoStore" className="h-10 w-auto object-contain" />
                 </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <nav className="hidden lg:flex items-center gap-1 bg-[#1a1d27] p-1 rounded-xl border border-gray-800">
              <Link href="/" className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg">Toko</Link>
              <Link href="/pesanan" className="px-4 py-1.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors">Pesanan Saya</Link>
            </nav>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => announcement?.is_active ? setIsAnnouncementOpen(true) : alert('Belum ada pengumuman.')}
                aria-label="Buka pengumuman"
                title="Pengumuman"
                className="hidden sm:flex w-10 h-10 items-center justify-center text-gray-300 bg-[#1a1d27] border border-gray-800 rounded-xl hover:bg-gray-800 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              </button>
              
              {/* TOMBOL KERANJANG DI NAVBAR */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-400 hover:text-white bg-[#1a1d27] border border-gray-800 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              
              <Link href="/akun" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Masuk
              </Link>
            </div>

          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-6">
        
        {/* --- CAROUSEL HERO BANNER --- */}
        <div className="relative w-full h-[280px] rounded-3xl overflow-hidden mb-8 border border-gray-800 bg-[#1a1d27]">
          {banners.length > 0 ? (
            banners.map((banner, index) => (
              <div 
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center ${index === currentSlide ? 'opacity-100 z-20' : 'opacity-0 z-10'}`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
                  style={{ backgroundImage: `url('${banner.image_url}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0e1116] via-[#0e1116]/80 to-transparent"></div>
                
                <div className="relative z-30 px-10 max-w-2xl">
                  <h2 
                    className="text-4xl md:text-5xl font-black italic tracking-tight text-white mb-2 leading-tight uppercase"
                    dangerouslySetInnerHTML={{ __html: banner.title }}
                  />
                  <p className="text-gray-300 font-medium mb-6">{banner.subtitle}</p>
                  <Link href={banner.button_link} className="inline-flex px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl items-center gap-2 transition-colors">
                    {banner.button_text}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </Link>
                </div>
              </div>
            ))
          ) : (
             <div className="absolute inset-0 flex items-center px-10 bg-gradient-to-r from-[#1a1d27] to-[#0e1116]">
               <div className="text-gray-500">Banner belum diatur dari dashboard admin.</div>
             </div>
          )}
          
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-10 z-30 flex gap-2">
              {banners.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-gray-500/50 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* --- GRID PRODUK / KARTU KELOMPOK --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              onClick={() => openVariantModal(product)}
              className="bg-[#151822] rounded-3xl border border-gray-800 overflow-hidden flex flex-col group hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer"
            >
              <div className="relative w-full h-[180px] bg-gray-800 overflow-hidden">
                <img 
                  src={product.image_url || 'https://via.placeholder.com/300'} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 left-3 bg-[#0e1116]/80 border border-gray-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Tersedia</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{product.name}</h3>
                <p className="text-sm text-gray-400 font-medium mb-4 flex-1">{product.description || 'Koleksi eksklusif.'}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-800/60">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mulai Dari</span>
                    <span className="text-lg font-bold text-[#00e676]">Rp {product.base_price?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 group-hover:bg-blue-600 text-blue-400 group-hover:text-white flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {cart.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          aria-label="Buka keranjang"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-blue-600 hover:bg-blue-500 border border-blue-400/40 rounded-2xl shadow-2xl shadow-blue-900/40 text-white transition-all"
        >
          <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </span>
          <span className="text-sm font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)} item</span>
          <span className="h-5 w-px bg-white/30"></span>
          <span className="text-sm font-black">Rp {totalPrice.toLocaleString('id-ID')}</span>
        </button>
      )}

      {isVariantOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e1116]/85 backdrop-blur-sm">
          <div className="bg-[#151822] border border-gray-800 w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-500">Pilih varian</span>
                <h2 className="text-xl font-black text-white mt-1">{selectedProduct.name}</h2>
              </div>
              <button aria-label="Tutup pilihan varian" onClick={() => setIsVariantOpen(false)} className="w-8 h-8 rounded-lg bg-[#1a1d27] border border-gray-800 text-gray-400 hover:text-white">✕</button>
            </div>
            {isVariantLoading ? (
              <div className="py-10 text-center text-gray-400 text-sm">Memuat varian...</div>
            ) : productVariants.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Belum ada varian tersedia.</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {productVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => selectVariant(variant)}
                    disabled={variant.stock <= 0}
                    className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e1116] border border-gray-800 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-colors"
                  >
                    <span>
                      <span className="block text-sm font-bold text-white">{variant.name}</span>
                      <span className="block text-xs text-gray-500 mt-1">Stok: {variant.stock}</span>
                    </span>
                    <span className="text-sm font-black text-[#00e676] whitespace-nowrap">
                      Rp {(selectedProduct.base_price + variant.additional_price).toLocaleString('id-ID')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL KERANJANG BELANJA --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e1116]/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#151822] border border-gray-800 w-full max-w-lg rounded-[24px] shadow-2xl p-6 flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white">Keranjang Belanja</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1d27] border border-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Daftar Produk di Keranjang */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-medium">
                  Keranjang Anda masih kosong.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-[#1a1d27] border border-gray-800/80 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img src={item.product.image_url || 'https://via.placeholder.com/150'} alt="" className="w-12 h-12 object-cover rounded-xl bg-gray-800" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{item.product.name}</h4>
                        <span className="text-xs text-[#00e676] font-semibold">{item.variant.name} · Rp {(item.product.base_price + item.variant.additional_price).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-300">x{item.quantity}</span>
                      <button 
                        onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-1 bg-red-500/10 rounded-lg"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total dan Tombol Checkout */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-400 font-medium">Total Pembayaran:</span>
                  <span className="text-lg font-black text-[#00e676]">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <button 
                  onClick={() => { setIsCartOpen(false); setCheckoutError(''); setIsCheckoutOpen(true); }}
                  className="w-full py-3.5 bg-[#007aff] hover:bg-blue-600 text-white font-bold rounded-[14px] transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,122,255,0.2)]"
                >
                  Lanjut ke Pembayaran
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0e1116]/85 backdrop-blur-sm">
          <div className="bg-[#151822] border border-gray-800 w-full max-w-lg rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-white">Buat Akun & Checkout</h2>
                <p className="text-sm text-gray-400 mt-1">Akun ini dipakai untuk melihat pesanan Anda.</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {checkoutError && <p className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">{checkoutError}</p>}
            <form onSubmit={handleCheckout} className="space-y-4">
              <input name="username" value={checkoutForm.username} onChange={handleCheckoutChange} required minLength={3} placeholder="Username unik" className="qoqo-auth-input" />
              <input name="email" type="email" value={checkoutForm.email} onChange={handleCheckoutChange} required placeholder="Email untuk pemulihan akun" className="qoqo-auth-input" />
              <input name="password" type="password" value={checkoutForm.password} onChange={handleCheckoutChange} required minLength={6} placeholder="Password minimal 6 karakter" className="qoqo-auth-input" />
              <textarea name="notes" value={checkoutForm.notes} onChange={handleCheckoutChange} rows={3} placeholder="Catatan pesanan (opsional)" className="qoqo-auth-input resize-none" />
              <button type="submit" disabled={isCheckoutLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold rounded-2xl">
                {isCheckoutLoading ? 'Membuat pesanan...' : 'Buat Akun & Pesan via WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PENGUMUMAN --- */}
      {isAnnouncementOpen && announcement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e1116]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#151822] border border-gray-800 w-full max-w-[560px] rounded-3xl shadow-2xl p-5 sm:p-6 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a1d27] border border-gray-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-0.5">Pengumuman</span>
                  <h2 className="text-lg sm:text-xl font-black text-white leading-tight">{announcement.title}</h2>
                </div>
              </div>
              <button aria-label="Tutup pengumuman" onClick={() => setIsAnnouncementOpen(false)} className="w-8 h-8 ml-3 shrink-0 flex items-center justify-center rounded-lg bg-[#1a1d27] border border-gray-800 text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="h-px bg-gray-800/80 my-4 w-full"></div>
            <div className="bg-[#0e1116] border border-gray-800/60 rounded-xl p-4 mb-4 shadow-inner">
              <div className="text-gray-300 text-sm leading-6 whitespace-pre-wrap font-medium">{announcement.content}</div>
            </div>
            <button onClick={() => setIsAnnouncementOpen(false)} className="w-full py-3 bg-[#007aff] hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">Saya Mengerti</button>
          </div>
        </div>
      )}

    </main>
  );
}