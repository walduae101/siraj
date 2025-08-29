// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  // Match HTML pages and API routes, exclude static assets
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (data files)
     * - favicon.ico (favicon file)
     * - assets (static assets)
     * - fonts (font files)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico|assets|fonts|robots.txt|sitemap.xml).*)",
  ],
};

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

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
