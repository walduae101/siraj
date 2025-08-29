// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SKIP_PREFIXES = [
  "/_next/",          // static + image optimizer
  "/assets/",
  "/fonts/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];
const HAS_EXT = /\.[^/]+$/i; // .js .css .woff2 .png ...

export const config = {
  // Keep this simple; we'll hard-skip inside handler.
  matcher: ["/:path*", "/api/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // HARD SKIP: assets and anything that looks like a file
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p)) || HAS_EXT.test(pathname)) {
    return NextResponse.next();
  }

  // Only stamp for HTML (browser navigations) or API
  const isApi = pathname.startsWith("/api/");
  const accept = req.headers.get("accept") || "";
  const wantsHtml = accept.includes("text/html");

  if (!isApi && !wantsHtml) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Prove middleware executed (remove later)
  res.headers.set("x-mw", "1");
  res.headers.set("x-mw-version", "5");
  res.headers.set("x-mw-path", pathname);
  res.headers.set("x-mw-accept", accept);
  res.headers.set("x-mw-is-api", isApi.toString());
  res.headers.set("x-mw-wants-html", wantsHtml.toString());

  // Security headers only
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

  // Help proxies/CDN segregate HTML vs. non-HTML
  const vary = res.headers.get("Vary");
  res.headers.set("Vary", [vary, "Accept"].filter(Boolean).join(", "));

  return res;
}
