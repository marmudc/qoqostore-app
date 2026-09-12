'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        await auth.signOut();
        setError(response.status === 403 ? 'Akun ini bukan akun admin.' : 'Email atau password admin salah.');
        return;
      }

      router.push('/secret-dash-qxq82');
      router.refresh();
    } catch {
      setError('Gagal menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Admin</h1>
          <p className="text-sm text-gray-500">Masukkan kredensial admin untuk melanjutkan.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Email admin Firebase"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />

          <input
            type="password"
            placeholder="Password Firebase"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />

          {error && <div className="text-red-500 text-sm font-semibold text-center bg-red-50 py-2 rounded-md">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-md"
          >
            {isLoading ? 'Memeriksa...' : 'Masuk ke Panel Admin'}
          </button>
        </form>
      </div>
    </main>
  );
}
