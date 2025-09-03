/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const SELF = "'self'";
const DATA = "data:";
const BLOB = "blob:";

// Firebase/Google allowlist needed for Google Sign-In + Firebase Auth REST
const GOOGLE_ACCOUNTS = "https://accounts.google.com";
const GOOGLE_APIS     = "https://*.googleapis.com";
const GOOGLE_STATIC   = "https://*.gstatic.com";
const GOOGLE_TAG      = "https://www.googletagmanager.com"; // only if used; keep allowed for now
const FIREBASEAPP     = "https://*.firebaseapp.com";
const FIREBASEIO      = "https://*.firebaseio.com";
const FIREBASE_INSTALL= "https://firebaseinstallations.googleapis.com";
const SECURETOKEN     = "https://securetoken.googleapis.com";

// Your origins
const ORIGIN_SELF     = SELF;
const ORIGIN_API      = "https://siraj.life"; // adjust if API on separate host

function csp(dev) {
  // Dev needs eval for Turbopack/HMR
  const SCRIPT_SRC = [
    SELF,
    GOOGLE_ACCOUNTS, GOOGLE_STATIC, GOOGLE_APIS, GOOGLE_TAG,
    dev ? "'unsafe-eval'" : null,
  ].filter(Boolean).join(" ");

  const STYLE_SRC = [
    SELF,
    // Tailwind doesn't need inline styles, but Next dev overlays might; allow in dev
    dev ? "'unsafe-inline'" : null,
    GOOGLE_STATIC,
  ].filter(Boolean).join(" ");

  const CONNECT_SRC = [
    SELF,
    ORIGIN_API,
    GOOGLE_ACCOUNTS, GOOGLE_APIS, SECURETOKEN, FIREBASE_INSTALL, FIREBASEIO, FIREBASEAPP,
    GOOGLE_STATIC,
    dev ? "ws://localhost:3000" : null,
    dev ? "http://localhost:3000" : null,
  ].filter(Boolean).join(" ");

  const IMG_SRC = [ SELF, DATA, BLOB, GOOGLE_STATIC, GOOGLE_ACCOUNTS, GOOGLE_APIS ].join(" ");
  const FONT_SRC = [ SELF, DATA, GOOGLE_STATIC ].join(" ");

  // If you embed any iframes, add their origins to frame-src. Google popup uses a browser window, not an iframe.
  const FRAME_SRC = [ GOOGLE_ACCOUNTS ].join(" ");
  const FRAME_ANCESTORS = [ "'none'" ].join(" "); // no embedding of your pages

  // object-src must be none; base-uri self
  const OBJECT_SRC = "'none'";
  const BASE_URI = SELF;

  // Build final policy
  return [
    `default-src ${SELF}`,
    `script-src ${SCRIPT_SRC}`,
    `style-src ${STYLE_SRC}`,
    `img-src ${IMG_SRC}`,
    `font-src ${FONT_SRC}`,
    `connect-src ${CONNECT_SRC}`,
    `frame-src ${FRAME_SRC}`,
    `frame-ancestors ${FRAME_ANCESTORS}`,
    `object-src ${OBJECT_SRC}`,
    `base-uri ${BASE_URI}`,
    // Trusted Types optional; keep report-only first
    // `require-trusted-types-for 'script'`
  ].join("; ");
}

export default {
  reactStrictMode: true,

  async headers() {
    const policy = csp(isDev);
    const security = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "browsing-topics=()" },
    ];

    return [
      // ---- STATIC (immutable, no security headers) - MUST BE FIRST
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          { key: "x-static", value: "1" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ---- API (always no-store + security headers)
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          ...security,
          // Enforce CSP header (no longer report-only)
          { key: "Content-Security-Policy", value: policy + "; report-uri /api/csp-violation;" },
          { key: "Vary", value: "Accept" },
        ],
      },

      // ---- HTML PAGES (catch-all for remaining routes) - force no-store + security headers
      {
        source:
          "/((?!_next/static|_next/image|fonts|api|favicon.ico|robots.txt|sitemap.xml).*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          ...security,
          // Enforce CSP header (no longer report-only)
          { key: "Content-Security-Policy", value: policy + "; report-uri /api/csp-violation;" },
          { key: "Vary", value: "Accept" },
        ],
      },
    ];
  },
};
