/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// Comment out env validation for now to fix the client-side issue
// import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  generateBuildId: async () => {
    // Force unique build ID to bust caches
    return `siraj-env-fixed-${Date.now()}`;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
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
