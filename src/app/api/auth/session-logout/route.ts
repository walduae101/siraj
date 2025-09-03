export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const isLocalDev = url.host.startsWith('localhost') || url.host.startsWith('127.0.0.1');
  
  const r = NextResponse.json({ ok: true });
  r.cookies.set('firebase-session', '', { 
    httpOnly: true, 
    secure: !isLocalDev, // must be false on localhost
    sameSite: 'lax', 
    path: '/', 
    maxAge: 0 
  });
  return r;
}
