// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// quick path guards
const STATIC_PREFIXES = [
  "/_next/static",
  "/_next/image",
  "/assets",
  "/fonts",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];
const FILE_EXT_RE = /\.[a-z0-9]{2,8}$/i;

export const config = {
  // exclude static at the matcher (fast path)
  matcher: ["/((?!_next/static|_next/image|assets|fonts|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)"],
};

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // extra belt & braces skip
  if (STATIC_PREFIXES.some((p) => path.startsWith(p)) || FILE_EXT_RE.test(path)) {
    return NextResponse.next();
  }

  // only stamp on HTML or API (skip opaque fetches, images, etc.)
  const accept = req.headers.get("accept") ?? "";
  const isHtml = accept.includes("text/html");
  const isApi = path.startsWith("/api/");
  if (!isHtml && !isApi) return NextResponse.next();

  const res = NextResponse.next();

  // verification header
  res.headers.set("x-mw", "1");

  // SECURITY HEADERS (do NOT touch Cache-Control here)
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

  return res;
}
