/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // =============================================================================
  // SECURITY HEADERS CONFIGURATION
  // =============================================================================
  // These headers provide enterprise-grade security for your app
  async headers() {
    return [
      // ---- STATIC ASSETS (immutable, no security headers) - MUST BE FIRST
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
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ---- API ROUTES (always no-store + security headers)
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self' https://{{DOMAIN}} https://*.{{DOMAIN}}; frame-src 'self' https://{{DOMAIN}} https://*.{{DOMAIN}} https://*.firebaseapp.com https://*.googleapis.com; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;`,
          },
          { key: "Vary", value: "Accept" },
        ],
      },

      // ---- HTML PAGES (catch-all for remaining routes) - force no-store + security headers
      {
        source:
          "/((?!_next/static|_next/image|fonts|images|api|favicon.ico|robots.txt|sitemap.xml).*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self' https://{{DOMAIN}} https://*.{{DOMAIN}}; frame-src 'self' https://{{DOMAIN}} https://*.{{DOMAIN}} https://*.firebaseapp.com https://*.googleapis.com; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;`,
          },
          { key: "Vary", value: "Accept" },
        ],
      },
    ];
  },

  // =============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // =============================================================================
  experimental: {
    // Enable modern React features
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
    
    // Enable server actions
    serverActions: {
      allowedOrigins: ["{{DOMAIN}}", "*.{{DOMAIN}}"],
    },
  },

  // =============================================================================
  // IMAGE OPTIMIZATION
  // =============================================================================
  images: {
    // Configure allowed image domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "{{DOMAIN}}",
      },
      {
        protocol: "https",
        hostname: "*.firebaseapp.com",
      },
      {
        protocol: "https",
        hostname: "*.googleapis.com",
      },
      // Add your custom image domains here
      // {
      //   protocol: "https",
      //   hostname: "your-cdn.com",
      // },
    ],
    
    // Enable modern image formats
    formats: ["image/webp", "image/avif"],
    
    // Responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // =============================================================================
  // BUNDLE ANALYSIS
  // =============================================================================
  // Uncomment to analyze bundle size
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     };
  //   }
  //   return config;
  // },

  // =============================================================================
  // ENVIRONMENT VARIABLES
  // =============================================================================
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // =============================================================================
  // REDIRECTS & REWRITES
  // =============================================================================
  async redirects() {
    return [
      // Redirect www to non-www (SEO best practice)
      {
        source: "/www/:path*",
        destination: "/:path*",
        permanent: true,
      },
      // Add your custom redirects here
      // {
      //   source: "/old-page",
      //   destination: "/new-page",
      //   permanent: true,
      // },
    ];
  },

  async rewrites() {
    return [
      // Add your custom rewrites here
      // {
      //   source: "/api/legacy/:path*",
      //   destination: "/api/v2/:path*",
      // },
    ];
  },

  // =============================================================================
  // PWA CONFIGURATION
  // =============================================================================
  // Uncomment to enable PWA features
  // pwa: {
  //   dest: "public",
  //   register: true,
  //   skipWaiting: true,
  // },

  // =============================================================================
  // COMPILER OPTIONS
  // =============================================================================
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
    
    // Enable styled components (if using)
    // styledComponents: true,
  },

  // =============================================================================
  // OUTPUT CONFIGURATION
  // =============================================================================
  // Uncomment for static export
  // output: "export",
  
  // Uncomment for trailing slash
  // trailingSlash: true,

  // =============================================================================
  // TEMPLATE NOTES
  // =============================================================================
  // 
  // 1. Replace {{DOMAIN}} with your actual domain
  // 2. Customize image domains for your CDN
  // 3. Add custom redirects and rewrites
  // 4. Enable PWA if needed
  // 5. Configure bundle analysis for optimization
  //
  // Security headers are pre-configured for enterprise use
  // Performance optimizations are enabled by default
  // Image optimization supports modern formats
  //
  // =============================================================================
};

export default nextConfig;
