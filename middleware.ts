import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  // Exclude Next assets, images, api, and common static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/.*).*)',
  ],
};

export default function middleware(req: NextRequest) {
  // Double guard (runtime) — in case matcher is changed later
  const p = req.nextUrl.pathname;
  if (
    p.startsWith('/_next/') ||
    p.startsWith('/api/') ||
    p === '/favicon.ico' ||
    p === '/robots.txt' ||
    p === '/sitemap.xml'
  ) return NextResponse.next();

  // …any real middleware logic…
  return NextResponse.next();
}
