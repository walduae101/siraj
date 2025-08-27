import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to ensure static assets are served correctly
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Early return for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/manifest.webmanifest') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next()
  }

  // Continue with normal processing for other routes
  return NextResponse.next()
}

// Configure matcher to exclude static routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
