import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to handle non-static requests only
export function middleware(req: NextRequest) {
  // All static assets are excluded by matcher, so this only runs for app routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    // exclude all static/infra paths from middleware
    '/((?!_next|api|static|favicon.ico|robots.txt|sitemap.xml|assets|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|map)).*)',
  ],
}
