export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// IMPORTANT: match the client Firebase project exactly
const PROJECT_ID = 'walduae-project-20250809071906';

function admin() {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,   // <-- force the same project on local dev
    });
  }
  return { auth: getAuth() };
}

export async function POST(req: Request) {
  let idToken: string | undefined;
  let expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  try {
    const { idToken: tok, expiresIn: maybe } = await req.json();
    idToken = tok;
    if (typeof maybe === 'number') expiresIn = maybe;
  } catch {
    return NextResponse.json({ ok:false, error:'invalid-json' }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ ok:false, error:'missing-idToken' }, { status: 400 });
  }

  try {
    const { auth } = admin();
    const cookie = await auth.createSessionCookie(idToken, { expiresIn });

    const url = new URL(req.url);
    const isLocalDev = url.host.startsWith('localhost') || url.host.startsWith('127.0.0.1');

            const r = NextResponse.json({ ok:true }, { status: 200 });
        
        const host = new URL(req.url).host;
        const isProd = /\.siraj\.life$/.test(host);
        
        r.cookies.set('firebase-session', cookie, {
          httpOnly: true,
          secure: !isLocalDev, // must be false on localhost
          sameSite: 'lax',
          path: '/',
          ...(isProd ? { domain: '.siraj.life' } : {}),
          maxAge: Math.floor(expiresIn / 1000),
        });
    return r;
  } catch (e: any) {
    // Surface root cause in console and response so we can fix ASAP
    console.error('session-login ERROR', {
      message: e?.message,
      code: e?.code,
      stack: e?.stack?.split('\n').slice(0,3).join('\n'),
      note: 'Check that PROJECT_ID matches client authDomain project and ADC is set locally',
    });
    return NextResponse.json({ ok:false, error: e?.message ?? 'internal-error', code: e?.code ?? null }, { status: 500 });
  }
}
