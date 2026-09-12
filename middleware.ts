import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cek apakah URL yang dikunjungi adalah area dashboard
  if (request.nextUrl.pathname.startsWith('/secret-dash-qxq82')) {
    const adminAccessPath = '/secret-dash-qxq82/access';

    // Halaman akses admin harus bisa dibuka tanpa session agar login tidak redirect loop.
    if (request.nextUrl.pathname === adminAccessPath) {
      return NextResponse.next();
    }
    
    // Cookie ini dibuat hanya setelah token Firebase diverifikasi oleh API.
    const session = request.cookies.get('admin_session');
    
    // Jika tidak ada cookie, tendang kembali ke halaman login
    if (!session) {
      return NextResponse.redirect(new URL(adminAccessPath, request.url));
    }
  }
  
  // Jika aman, izinkan masuk
  return NextResponse.next();
}

// Konfigurasi agar middleware hanya berjalan di rute dashboard saja
export const config = {
  matcher: ['/secret-dash-qxq82/:path*'],
};