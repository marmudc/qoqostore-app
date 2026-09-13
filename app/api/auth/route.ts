import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const idToken = body && typeof body === 'object' && 'idToken' in body ? body.idToken : null;
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!adminEmail) {
      console.error('API Auth Error: ADMIN_EMAIL is not configured.');
      return NextResponse.json({ error: 'Konfigurasi login admin belum lengkap.' }, { status: 503 });
    }

    if (typeof idToken !== 'string' || !idToken.trim()) {
      return NextResponse.json({ error: 'Token login tidak valid.' }, { status: 400 });
    }

    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken.trim());

    if (decodedToken.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const sessionCookie = await auth.createSessionCookie(idToken.trim(), {
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