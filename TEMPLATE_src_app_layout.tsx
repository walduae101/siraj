import "~/styles/globals.css";

export const runtime = "nodejs";

import { Inter } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

// =============================================================================
// FONT CONFIGURATION
// =============================================================================
// Choose your preferred font from Google Fonts
// Popular options: Inter, Roboto, Open Sans, Poppins, Montserrat
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

// For RTL languages (Arabic, Hebrew), use:
// import { Cairo } from "next/font/google";
// const cairo = Cairo({ 
//   subsets: ["arabic"], 
//   variable: "--font-cairo",
//   display: "swap",
// });

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================
export const metadata = { 
  title: "{{APP_NAME}}", 
  description: "{{APP_DESCRIPTION}}",
  keywords: ["{{APP_KEYWORDS}}"],
  authors: [{ name: "{{AUTHOR_NAME}}" }],
  creator: "{{AUTHOR_NAME}}",
  publisher: "{{COMPANY_NAME}}",
  robots: "index, follow",
  openGraph: {
    title: "{{APP_NAME}}",
    description: "{{APP_DESCRIPTION}}",
    url: "{{WEBSITE_URL}}",
    siteName: "{{APP_NAME}}",
    images: [
      {
        url: "{{OG_IMAGE_URL}}",
        width: 1200,
        height: 630,
        alt: "{{APP_NAME}}",
      },
    ],
    locale: "{{LOCALE}}",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "{{APP_NAME}}",
    description: "{{APP_DESCRIPTION}}",
    images: ["{{OG_IMAGE_URL}}"],
    creator: "@{{TWITTER_HANDLE}}",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "{{THEME_COLOR}}",
  manifest: "/manifest.json",
};

// =============================================================================
// ROOT LAYOUT COMPONENT
// =============================================================================
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html 
      lang="{{LANGUAGE}}" 
      dir="{{TEXT_DIRECTION}}" 
      className={`${inter.variable}`} 
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//{{FIREBASE_AUTH_DOMAIN}}" />
        
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "{{APP_NAME}}",
              "description": "{{APP_DESCRIPTION}}",
              "url": "{{WEBSITE_URL}}",
              "applicationCategory": "{{APP_CATEGORY}}",
              "operatingSystem": "Any",
              "author": {
                "@type": "Person",
                "name": "{{AUTHOR_NAME}}"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      
      <body className="min-h-screen font-[family-name:var(--font-inter)] antialiased">
        {/* Progress bar for navigation */}
        <NextTopLoader 
          color="var(--primary)" 
          showSpinner={false}
          height={3}
          easing="ease"
          speed={200}
        />

        {/* Toast notifications */}
        <Toaster 
          position="top-center" 
          richColors
          closeButton
          duration={4000}
        />

        {/* Main content */}
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>

        {/* Auto-recover from chunk loading failures */}
        <Script id="recover-chunk-failure" strategy="afterInteractive">
          {`
            window.addEventListener('error', function (e) {
              if (e && e.message && /Loading chunk .* failed/i.test(e.message)) {
                console.log('Chunk loading failed, reloading page...');
                location.reload();
              }
            }, true);
          `}
        </Script>

        {/* Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `}
        </Script>

        {/* Analytics (uncomment and configure as needed) */}
        {/* <Script
          src="https://www.googletagmanager.com/gtag/js?id={{GA_MEASUREMENT_ID}}"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '{{GA_MEASUREMENT_ID}}');
          `}
        </Script> */}
      </body>
    </html>
  );
}

// =============================================================================
// TEMPLATE NOTES
// =============================================================================
// 
// 1. Replace all {{PLACEHOLDER}} values with your actual values
// 2. Choose appropriate font for your app (Inter is recommended for most apps)
// 3. Configure metadata for SEO optimization
// 4. Set up analytics if needed
// 5. Customize theme colors in globals.css
// 6. Add PWA manifest and service worker
// 7. Configure structured data for your specific app type
//
// Language and direction options:
// - English: lang="en", dir="ltr"
// - Arabic: lang="ar", dir="rtl" 
// - Hebrew: lang="he", dir="rtl"
// - Other RTL languages as needed
//
// =============================================================================
