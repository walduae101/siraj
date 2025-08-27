/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// Comment out env validation for now to fix the client-side issue
// import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  // Remove custom build ID to use default Next.js behavior
  // generateBuildId: async () => {
  //   return `siraj-static-fix-${Date.now()}`;
  // },

  async rewrites() {
    return [
      // never rewrite Next's internal assets
      { source: '/_next/:path*', destination: '/_next/:path*' },
    ];
  },

  async headers() {
    return [
      {
        // Apply headers to all routes EXCEPT Next.js static assets and common static files
        source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|assets|public).*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
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
