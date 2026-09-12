'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type AuthMode = 'login' | 'register' | 'reset';

type UserProfile = {
  username: string;
  name: string;
  email: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ username: '', password: '', email: '', name: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (auth.currentUser) router.replace('/pesanan');
  }, [router]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const email = form.email.trim().toLowerCase();
      const username = form.username.trim().toLowerCase();

      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Link reset password sudah dikirim ke email Anda.');
      } else if (mode === 'register') {
        const usernameSnapshot = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
        if (!usernameSnapshot.empty) {
          setError('Username sudah digunakan. Silakan pilih username lain.');
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email, form.password);
        await setDoc(doc(db, 'users', credential.user.uid), {
          username,
          name: form.name.trim(),
          email,
          created_at: new Date(),
        });
        router.push('/pesanan');
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, form.password);
        const profile = await getDoc(doc(db, 'users', credential.user.uid));
        const profileData = profile.data() as UserProfile | undefined;
        if (profileData) localStorage.setItem('qoqo_user', JSON.stringify({ id: credential.user.uid, ...profileData }));
        router.push('/pesanan');
      }
    } catch (authError) {
      const code = (authError as { code?: string }).code;
      const errors: Record<string, string> = {
        'auth/email-already-in-use': 'Email sudah terdaftar.',
        'auth/invalid-credential': 'Email atau password salah.',
        'auth/invalid-email': 'Format email tidak valid.',
        'auth/weak-password': 'Password minimal 6 karakter.',
        'auth/user-not-found': 'Akun dengan email tersebut tidak ditemukan.',
      };
      setError(errors[code || ''] || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const title = mode === 'register' ? 'Buat Akun Pelanggan' : mode === 'reset' ? 'Reset Password' : 'Masuk ke Akun';

  return (
    <main className="min-h-screen flex flex-col bg-[#0e1116] text-white font-sans">
      <header className="border-b border-gray-800/60 bg-[#0e1116]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-fit h-10 flex items-center justify-center">
              <img src="/logo.png" alt="QoQoStore" className="h-10 w-auto object-contain" />
            </div>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-[#151822] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <h1 className="text-2xl font-black text-center mb-2">{title}</h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            {mode === 'reset' ? 'Masukkan email yang terhubung ke akun Anda.' : 'Gunakan email sebagai pengaman akun dan username sebagai identitas Anda.'}
          </p>

          {error && <p className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm text-center">{error}</p>}
          {message && <p className="mb-4 p-3 rounded-xl bg-green-500/10 text-green-400 text-sm text-center">{message}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Nama lengkap" className="qoqo-auth-input" />
                <input name="username" value={form.username} onChange={handleChange} required minLength={3} placeholder="Username unik" className="qoqo-auth-input" />
              </>
            )}
            {mode !== 'register' && mode !== 'reset' && (
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Email" className="qoqo-auth-input" />
            )}
            {mode === 'reset' && (
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Email akun" className="qoqo-auth-input" />
            )}
            {mode === 'register' && (
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Email untuk pemulihan akun" className="qoqo-auth-input" />
            )}
            {mode !== 'reset' && (
              <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Password minimal 6 karakter" className="qoqo-auth-input" />
            )}
            {mode === 'reset' && (
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold">{isLoading ? 'Mengirim...' : 'Kirim Link Reset'}</button>
            )}
            {mode !== 'reset' && (
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold">{isLoading ? 'Memproses...' : mode === 'register' ? 'Daftar' : 'Masuk'}</button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-gray-400 space-y-2">
            {mode === 'login' && <><p>Belum punya akun? <button onClick={() => setMode('register')} className="text-blue-400 font-bold">Daftar</button></p><p><button onClick={() => setMode('reset')} className="hover:text-white underline">Lupa password?</button></p></>}
            {mode === 'register' && <p>Sudah punya akun? <button onClick={() => setMode('login')} className="text-blue-400 font-bold">Masuk</button></p>}
            {mode === 'reset' && <p><button onClick={() => setMode('login')} className="text-blue-400 font-bold">Kembali ke login</button></p>}
          </div>
        </div>
      </div>
    </main>
  );
}
