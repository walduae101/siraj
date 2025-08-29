// middleware.ts (root)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  // Only match HTML pages and API routes, exclude all static assets
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     * - assets (static assets)
     * - files with extensions (.js, .css, .png, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|assets|.*\\.[a-z0-9]{2,8}$).*)",
  ],
};

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Double-check: if this is a static asset, skip middleware entirely
  if (
    p.startsWith("/_next/") ||
    p.startsWith("/fonts/") ||
    p.startsWith("/assets/") ||
    p === "/favicon.ico" ||
    p === "/robots.txt" ||
    p === "/sitemap.xml" ||
    /\.[a-z0-9]{2,8}$/i.test(p)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Verification header so we can prove middleware execution
  res.headers.set("x-mw", "1");

  // SECURITY HEADERS — stamp on HTML/API *only*
  res.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
  res.headers.set("x-content-type-options", "nosniff");
  res.headers.set("x-frame-options", "DENY");
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "permissions-policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()"
  );

  // Keep CSP in Report-Only until we tune reports
  res.headers.set(
    "content-security-policy-report-only",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' https: data:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "connect-src 'self' https:",
      "report-uri /api/csp-report",
    ].join("; ")
  );

  // IMPORTANT: Do NOT set Cache-Control here. Let Next.js headers() handle caching.
  return res;
}
