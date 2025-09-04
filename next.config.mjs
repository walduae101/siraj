/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

export default {
  reactStrictMode: true,
  
  // Turbopack configuration to fix connection issues
  experimental: {
    turbo: {
      // Reduce memory usage and improve stability
      memoryLimit: 4096,
      // Disable some experimental features that might cause connection issues
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  async headers() {
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
          { key: "Vary", value: "Accept" },
        ],
      },
    ];
  },
};
