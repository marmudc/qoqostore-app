import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (typeof idToken !== 'string' || !idToken || !adminEmail) {
      return NextResponse.json({ error: 'Konfigurasi login admin belum lengkap.' }, { status: 500 });
    }

    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    if (decodedToken.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });
    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('API Auth Error:', error);
    return NextResponse.json({ error: 'Autentikasi admin gagal.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}