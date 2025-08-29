/** @type {import('next').NextConfig} */
const config = {
  output: "standalone",
  reactStrictMode: true,
  experimental: { turbo: { rules: {} } },
  async headers() {
    return [
      // Immutable static assets
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "x-static", value: "1" }, // debug flag
        ],
      },
      // Image optimizer cache (optional)
      {
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      // APIs: never cache (middleware sets too, but this is fine/harmless)
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      // IMPORTANT: **no** generic HTML rule here anymore.
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
