import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function admin() {
  if (!getApps().length) initializeApp({ credential: applicationDefault() });
  return { auth: getAuth() };
}

export async function POST(req: Request) {
  const { idToken, expiresIn = 60 * 60 * 24 * 5 * 1000 } = await req.json();
  const { auth } = admin();
  const cookie = await auth.createSessionCookie(idToken, { expiresIn });
  
  const url = new URL(req.url);
  const host = url.host || '';
  const isLocalDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  const r = NextResponse.json({ ok: true });
  // In dev (http), do NOT set secure, otherwise cookie won't be stored by the browser.
  const cookieOpts = {
    httpOnly: true,
    secure: !isLocalDev,      // ← ONLY secure in production/https
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.floor(expiresIn / 1000),
  };
  r.cookies.set('firebase-session', cookie, cookieOpts);
  return r;
}
