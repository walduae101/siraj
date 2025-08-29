// middleware.ts (root)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  // Only match specific paths that need security headers
  matcher: [
    // Match HTML pages (root and common routes)
    "/",
    "/dashboard",
    "/account",
    "/login",
    "/register",
    "/api/:path*",
  ],
};

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Only apply middleware to HTML pages and API routes
  if (!p.startsWith("/api/") && p !== "/" && !p.startsWith("/dashboard") && !p.startsWith("/account") && !p.startsWith("/login") && !p.startsWith("/register")) {
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
