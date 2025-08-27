// middleware.ts (root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  // Exclude all Next assets & images, API, and common static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Runtime guard: if somehow matched, let these pass unmodified
  if (
    p.startsWith('/_next/') ||
    p.startsWith('/api/') ||
    p === '/favicon.ico' ||
    p === '/robots.txt' ||
    p === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}
