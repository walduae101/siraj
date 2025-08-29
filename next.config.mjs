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
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      { // Next image loader responses
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      // API: never cache
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      // HTML: no-store (match only when the client expects HTML)
      {
        source: "/:path*",
        has: [{ type: "header", key: "Accept", value: ".*text/html.*" }],
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
