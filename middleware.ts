// /middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isHtmlOrApi = (pathname: string) =>
  // HTML pages and app routes (API)
  !pathname.startsWith("/_next/") &&
  !pathname.startsWith("/static/") &&
  !pathname.startsWith("/fonts/") &&
  !pathname.startsWith("/images/") &&
  !pathname.endsWith(".js") &&
  !pathname.endsWith(".css") &&
  !pathname.endsWith(".map") &&
  !pathname.endsWith(".ico") &&
  !pathname.endsWith(".png") &&
  !pathname.endsWith(".jpg") &&
  !pathname.endsWith(".jpeg") &&
  !pathname.endsWith(".svg") &&
  !pathname.endsWith(".webp") &&
  !pathname.endsWith(".woff") &&
  !pathname.endsWith(".woff2");

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // TEMP: prove middleware executed
  res.headers.set("x-mw", "1");

  if (isHtmlOrApi(req.nextUrl.pathname)) {
    // Security headers
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      [
        "accelerometer=()",
        "camera=()",
        "geolocation=()",
        "gyroscope=()",
        "microphone=()",
        "payment=()",
        "usb=()",
      ].join(", "),
    );

    // Start CSP in report-only to avoid breakage; flip to enforced later.
    res.headers.set(
      "Content-Security-Policy-Report-Only",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "img-src 'self' data: https:",
        "font-src 'self' https: data:",
        "style-src 'self' 'unsafe-inline' https:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:", // tighten after audit
        "connect-src 'self' https:",
        "report-uri /api/csp-report",
      ].join("; "),
    );
  }

  return res;
}

// Match everything, middleware itself will skip static bits
export const config = {
  matcher: ["/:path*"],
};
