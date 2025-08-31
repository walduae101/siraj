import { NextResponse } from 'next/server';
import { admin } from '../../../../server/firebase/admin';

export async function POST(req: Request) {
  const { idToken, expiresIn = 60 * 60 * 24 * 5 * 1000 } = await req.json(); // default 5 days
  const { auth } = admin();
  const cookie = await auth.createSessionCookie(idToken, { expiresIn });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('firebase-session', cookie, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  return res;
}
