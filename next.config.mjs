/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only caching rules; security headers come from middleware
  async headers() {
    return [
      // Immutable chunks
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "x-static", value: "1" },
        ],
      },
      // Fonts
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // API: belt and suspenders (middleware also sets no-store)
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
