// middleware.ts
import { NextResponse } from "next/server";

const SEC_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  // keep CSP in report-only while tuning; switch to "content-security-policy" to enforce
  "content-security-policy-report-only":
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;",
  "permissions-policy":
    "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()",
};

export function middleware(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Never touch static assets (fast-fail)
  if (
    path.startsWith("/_next/") ||
    path.startsWith("/fonts/") ||
    path.startsWith("/images/") ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    /\.[a-z0-9]+$/i.test(path) // any file with an extension
  ) {
    return NextResponse.next();
  }

  // Only GET/HEAD get headers stamped
  const method = (req.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return NextResponse.next();

  const accept = String(req.headers.get("accept") || "");
  const isApi = path.startsWith("/api/");
  const isHtml =
    !isApi && (accept.includes("text/html") || !/\.[a-z0-9]+$/i.test(path));

  if (!(isApi || isHtml)) return NextResponse.next();

  const res = NextResponse.next();

  // Security headers
  for (const [k, v] of Object.entries(SEC_HEADERS)) res.headers.set(k, v);

  // API responses should never be cached
  if (isApi) res.headers.set("cache-control", "no-store");

  // Vary to keep CDN sane when Accept differs
  const vary = res.headers.get("vary");
  res.headers.set("vary", vary ? `${vary}, Accept` : "Accept");

  // Optional: short debug header while validating (remove later)
  // res.headers.set("x-mw", "1");

  return res;
}

// Match only HTML-ish routes and API; exclude assets at the matcher level too
export const config = {
  matcher: [
    "/api/:path*", // APIs
    // All routes that aren't files or _next/*
    "/((?!_next/|fonts/|images/|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.[a-z0-9]+$).*)",
  ],
};
