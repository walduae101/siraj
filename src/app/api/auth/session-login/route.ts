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
  const r = NextResponse.json({ ok: true });
  r.cookies.set('firebase-session', cookie, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: expiresIn / 1000,
  });
  return r;
}
