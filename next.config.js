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
        // Keep HTML short-lived – avoids stale HTML referencing old chunk hashes
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
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
