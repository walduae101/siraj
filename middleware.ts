// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Absolute do-not-touch list + file detection.
 * Even if the matcher fires, we still bail here fast.
 */
const SKIP_PREFIXES = [
  "/_next/",          // includes /_next/static and /_next/image
  "/assets/",
  "/fonts/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];
const HAS_EXT = /\.[^/]+$/i; // any dot extension: .js .css .woff2 .png ...

/**
 * Keep matcher simple: let it run widely,
 * but we hard-skip assets & files inside the handler.
 *
 * Why? Complex negative lookaheads in matcher can be flaky across versions.
 */
export const config = {
  matcher: ["/:path*", "/api/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Belt & braces: never run on static or file-like paths
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p)) || HAS_EXT.test(pathname)) {
    return NextResponse.next();
  }

  // 2) Only stamp for HTML or API
  const isApi = pathname.startsWith("/api/");
  const accept = req.headers.get("accept") || "";
  const wantsHtml =
    accept.includes("text/html") ||
    // Next/RSC data requests sometimes send "application/json" or "text/x-component"
    // If you *only* want browser navigations, keep this strict to text/html.
    false;

  if (!isApi && !wantsHtml) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Debug to prove middleware ran (remove later)
  res.headers.set("x-mw", "1");

  // Security headers only (no Cache-Control here!)
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

  // Vary for HTML detection (helps proxies/CDN when Accept differs)
  const vary = res.headers.get("Vary");
  res.headers.set("Vary", [vary, "Accept"].filter(Boolean).join(", "));

  return res;
}
