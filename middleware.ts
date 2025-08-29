// middleware.ts (root)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Paths that must *not* pass through middleware (so we don't touch caching)
const STATIC_PREFIXES = [
  "/_next/static",
  "/_next/image",
  "/fonts",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/assets",
];

// Exclude files like *.js, *.css, *.map, *.png, etc.
const FILE_EXT_RE = /\.[a-z0-9]{2,8}$/i;

export const config = {
  // Single negative lookahead matcher is faster than large allowlists
  matcher: ["/((?!_next/static|_next/image|fonts|favicon\\.ico|robots\\.txt|sitemap\\.xml|assets).*)"],
};

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Extra belt-and-braces skip
  if (STATIC_PREFIXES.some((pref) => p.startsWith(pref)) || FILE_EXT_RE.test(p)) {
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
