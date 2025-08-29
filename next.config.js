/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// Comment out env validation for now to fix the client-side issue
// import "./src/env.js";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "standalone", // fine with next start or server.js
  // NO rewrites for SPA fallback. Let Next serve assets itself.
  async rewrites() {
    return []; // explicit: nothing
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
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
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        // Keep HTML short-lived – avoids stale HTML referencing old chunk hashes
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=15552000; includeSubDomains; preload",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()",
              "autoplay=()",
              "camera=()",
              "display-capture=()",
              "encrypted-media=()",
              "fullscreen=(self)",
              "geolocation=()",
              "gyroscope=()",
              "microphone=()",
              "payment=(self)",
              "usb=()",
              "xr-spatial-tracking=()",
            ].join(", "),
          },
          // Start CSP in Report-Only so we can tune safely
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "script-src 'self' https:",
              "style-src 'self' https: 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' https:",
              "connect-src 'self' https: wss: *.googleapis.com *.firebaseio.com *.gstatic.com",
              "frame-ancestors 'none'",
              "frame-src https://accounts.google.com https://*.firebaseapp.com",
              "object-src 'none'",
              "report-uri /api/csp-report",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Important: don't set assetPrefix unless you intentionally host assets elsewhere
  webpack: (cfg, { isServer }) => {
    if (!isServer) {
      cfg.resolve = cfg.resolve || {};
      cfg.resolve.alias = {
        ...(cfg.resolve.alias || {}),
        "firebase-admin": false,
        "@google-cloud/firestore": false,
      };
    }
    return cfg;
  },
};

export default config;
