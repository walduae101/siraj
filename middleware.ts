import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(_req: NextRequest) { 
  return NextResponse.next(); 
}

export const config = {
  matcher: [
    '/((?!_next|api|static|favicon.ico|robots.txt|sitemap.xml|assets|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|map|js|css)).*)',
  ],
};
