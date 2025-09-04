import "~/styles/globals.css";

export const runtime = "nodejs";

import { Cairo } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";
import { headers } from 'next/headers';

const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata = { title: "Siraj", description: "AI tools" };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = headers().get('x-nonce') ?? crypto.randomUUID();
  
  // CSP with hashes for Next.js inline scripts
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Common Next.js inline script hashes (these are the ones causing violations)
  const nextJsHashes = [
    "'sha256-Q+8tPsjVtiDsjF/Cv8FMOpg2Yg91oKFKDAJat1PPb2g='",
    "'sha256-LlrUtn1+zcbQj7EGsF5SI+dbsCcWFnZ+Savb805p27M='",
    "'sha256-+gr4pY72uPNVbRWj+vPrCO4gOXDEowIFB9ETXWfSnPc='",
    "'sha256-EdyC9k3Zxv9eEyHlnUEGCk73AregNGudaDZZ1hySZZU='",
    "'sha256-mcLDReJ2nRjw1UsVgLaUtwUWUQr4M5WqGEO8j4wFA9U='",
    "'sha256-8Szy7RAFKRJNmypdhtqKLOS5pyemhznqAeCni3JuyoA='",
    "'sha256-Q4cWE3kG7VBJfk2EkeT3jSTnFyZ9yGx2GAXgT78fy7I='",
    "'sha256-hG5l9cOV1cYRIsM/9/9Hc4FvQa7Zv0a7WtPTmjvdj3w='",
    "'sha256-MkFypNLTgV8O901QY6bJpwGrE1xdxYslvf4+cduo6ps='",
    "'sha256-ZNN34wYBGWaU3vvZ+6MQV2k+cKrwfyC/q5c7oL623gM='",
    "'sha256-HKW6dK+OgU2osTTOnEKmK9B5SX1Al8zcuhkInPkHOfI='",
    // New hashes from the latest violations
    "'sha256-n0z7/zLTfcwmOTjeyhND2sF/Zap0ZWuhHs8VevP4VDU='",
    "'sha256-zA4dw7xdujOZYlKNayKvStDSWaYvOAssuGmlYLeL/io='",
    "'sha256-XBtxbfc8eZtK65hFyfpsLrqThspWzHp7hbZgiYaJwWg='",
    "'sha256-gxHZhsP4R8rezV8yEvWBVQ4xTW8NdEcjmVtgQtpRWNk='",
    "'sha256-WPp7CjV3Cb1Sp3foXKpsNQcKmC+v6EGaRPJdkEPD7sA='",
    // Additional hashes from current violations
    "'sha256-S71R71kNuNO/ECzgeATpxjNo+z5pdtE2Qw9mYRizrr8='",
    "'sha256-Kg0tRgS4JeGg0H8l63R5wivnF/P7FGpz5CZLDZ32SFQ='",
    "'sha256-PDMh4Q7juhHHrT0OzEUIVqSxNfJWo0qBuOekj12doeA='",
    "'sha256-x/PUBjJwebM4PPpjyGFdRTUAihcSHYG7GUhQA4A/1sw='",
  ];

  const SCRIPT_SRC = [
    "'self'",
    `'nonce-${nonce}'`,
    ...nextJsHashes,
    "https://accounts.google.com",
    "https://*.googleapis.com",
    "https://*.gstatic.com",
    "https://*.firebaseapp.com",
    "https://*.firebaseio.com",
    "https://firebaseinstallations.googleapis.com",
    "https://securetoken.googleapis.com",
    isDev ? "'unsafe-eval'" : null,
  ].filter(Boolean).join(" ");

  const STYLE_SRC = [
    "'self'",
    "https://*.gstatic.com",
    isDev ? "'unsafe-inline'" : null,
  ].filter(Boolean).join(" ");

  const CONNECT_SRC = [
    "'self'",
    "https://siraj.life",
    "https://accounts.google.com",
    "https://*.googleapis.com",
    "https://*.gstatic.com",
    "https://*.firebaseapp.com",
    "https://*.firebaseio.com",
    "https://firebaseinstallations.googleapis.com",
    "https://securetoken.googleapis.com",
    // Enhanced WebSocket support for development
    isDev ? "ws://localhost:3000" : null,
    isDev ? "wss://localhost:3000" : null,
    isDev ? "http://localhost:3000" : null,
    isDev ? "https://localhost:3000" : null,
    // Additional WebSocket patterns for Turbopack
    isDev ? "ws://localhost:*" : null,
    isDev ? "wss://localhost:*" : null,
  ].filter(Boolean).join(" ");

  const IMG_SRC = "'self' data: blob: https://*.gstatic.com https://accounts.google.com https://*.googleapis.com";
  const FONT_SRC = "'self' data: https://*.gstatic.com";
  const FRAME_SRC = "https://accounts.google.com";

  const DIRECTIVES = [
    `default-src 'self'`,
    `script-src ${SCRIPT_SRC}`,
    `style-src ${STYLE_SRC}`,
    `connect-src ${CONNECT_SRC}`,
    `img-src ${IMG_SRC}`,
    `font-src ${FONT_SRC}`,
    `frame-src ${FRAME_SRC}`,
    `object-src 'none'`,
    `base-uri 'self'`,
  ];

  const csp = DIRECTIVES.join("; ");
  
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`} suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
      </head>
      <body className="min-h-screen font-[family-name:var(--font-cairo)]">
        <NextTopLoader color="var(--primary)" />

        <Toaster position="top-center" />

        <TRPCReactProvider>{children}</TRPCReactProvider>

        {/* Auto-recover from chunk loading failures */}
        <Script id="recover-chunk-failure" strategy="afterInteractive" nonce={nonce}>{`
          window.addEventListener('error', function (e) {
            if (e && e.message && /Loading chunk .* failed/i.test(e.message)) {
              location.reload();
            }
          }, true);
        `}</Script>
      </body>
    </html>
  );
}
console.log("Siraj v1.0 - Environment Fix");
