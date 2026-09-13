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
    const errorCode = error instanceof Error ? error.message : 'UNKNOWN';
    const firebaseErrorCode = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    console.error('API Auth Error:', firebaseErrorCode || errorCode, error);

    if (errorCode === 'FIREBASE_ADMIN_CONFIG_INCOMPLETE' || errorCode === 'FIREBASE_ADMIN_PRIVATE_KEY_INVALID') {
      return NextResponse.json({ error: 'Konfigurasi Firebase Admin di server tidak valid.' }, { status: 503 });
    }

    if (firebaseErrorCode.startsWith('auth/id-token') || firebaseErrorCode === 'auth/argument-error') {
      return NextResponse.json({ error: 'Token Firebase tidak valid atau sudah kedaluwarsa.' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Autentikasi admin gagal.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}