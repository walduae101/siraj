// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Absolute skips
const HARD_SKIP_PREFIXES = [
  "/_next/",         // covers static + image + data
  "/assets",
  "/fonts",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];
const FILE_EXT_RE = /\.(?:js|mjs|css|map|json|png|jpe?g|gif|svg|webp|ico|woff2?)$/i;

export const config = {
  // Fast-path skip for anything under _next/ etc.
  matcher: [
    "/((?!_next/|assets|fonts|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
    "/api/:path*",
  ],
};

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Belt & braces: early return if it looks like a static file
  if (HARD_SKIP_PREFIXES.some((p) => path.startsWith(p)) || FILE_EXT_RE.test(path)) {
    return NextResponse.next();
  }

  const accept = req.headers.get("accept") ?? "";
  const isHtml = accept.includes("text/html");
  const isApi = path.startsWith("/api/");
  if (!isHtml && !isApi) return NextResponse.next();

  const res = NextResponse.next();

  // Verification header (remove later)
  res.headers.set("x-mw", "1");

  // Security headers ONLY (do not touch Cache-Control here)
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
