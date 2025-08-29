// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Paths we never want to touch (static & files)
// We also exclude any URL that ends with a file extension.
const HARD_SKIP_PREFIXES = [
  "/_next/",         // includes /_next/static and /_next/image
  "/assets",
  "/fonts",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];
const FILE_EXT_RE = /\.[^/]+$/i; // .../*.js, *.css, *.woff2, etc.

export const config = {
  // Fast pre-filter: exclude _next & any URL containing a dot (an extension).
  // Also match /api for API headers.
  matcher: [
    "/((?!_next/|.*\\..*).*)",
    "/api/:path*",
  ],
};

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Belt & braces: never run on obvious static or file-like paths.
  if (HARD_SKIP_PREFIXES.some((p) => path.startsWith(p)) || FILE_EXT_RE.test(path)) {
    return NextResponse.next();
  }

  // Run only for HTML or API
  const isApi = path.startsWith("/api/");
  const accept = req.headers.get("accept") ?? "";
  const isHtml = accept.includes("text/html"); // curl: add -H 'Accept: text/html' when testing

  if (!isApi && !isHtml) return NextResponse.next();

  const res = NextResponse.next();

  // Debug header to prove middleware executed (remove later)
  res.headers.set("x-mw", "1");

  // (Do NOT set Cache-Control here. Your pages are already dynamic/no-store from the app config.
  // If middleware accidentally hits an asset, we won't blow away immutable caching.)

  // Security headers
  res.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
  res.headers.set("x-content-type-options", "nosniff");
  res.headers.set("x-frame-options", "DENY");
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "permissions-policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()"
  );
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

  // Help CDN vary HTML by Accept (useful for some clients)
  res.headers.set(
    "Vary",
    ["Accept", req.headers.get("Vary") || ""].filter(Boolean).join(", ")
  );

  return res;
}
