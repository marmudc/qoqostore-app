import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Menginisialisasi font Inter dengan variasi Latin
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QoQoStore - Belanja Mudah & Cepat',
  description: 'Marketplace sederhana tanpa ribet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}