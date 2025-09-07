import "~/styles/globals.css";

export const runtime = "nodejs";

import { Cairo } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { ToastProvider } from "~/components/ui/Toast";
import { TRPCReactProvider } from "~/trpc/react";
import { headers } from 'next/headers';
import { buildCsp } from "~/server/security/csp";

const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata = { title: "Siraj", description: "AI tools" };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? crypto.randomUUID();
  
  // CSP with dev/prod differentiation
  const isDev = process.env.NODE_ENV !== 'production';
  
  // In development: use 'unsafe-inline' (no nonce to avoid conflict)
  // In production: use nonce-based CSP (strict security)
  const scriptSrc = isDev 
    ? `'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.googleapis.com https://apis.google.com https://*.gstatic.com https://www.gstatic.com https://*.firebaseapp.com https://*.firebaseio.com https://firebaseinstallations.googleapis.com https://securetoken.googleapis.com`
    : `'self' 'nonce-${nonce}' https://accounts.google.com https://*.googleapis.com https://apis.google.com https://*.gstatic.com https://www.gstatic.com https://*.firebaseapp.com https://*.firebaseio.com https://firebaseinstallations.googleapis.com https://securetoken.googleapis.com`;
  
  const csp = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' ${isDev ? "'unsafe-inline'" : ""} https://*.gstatic.com https://www.gstatic.com; connect-src 'self' https://accounts.google.com https://*.googleapis.com https://apis.google.com https://*.gstatic.com https://www.gstatic.com https://*.firebaseapp.com https://*.firebaseio.com https://firebaseinstallations.googleapis.com https://securetoken.googleapis.com ${isDev ? "ws://localhost:3000 http://localhost:3000" : ""}; img-src 'self' data: blob: https://*.gstatic.com https://www.gstatic.com https://accounts.google.com https://*.googleapis.com https://*.googleusercontent.com; font-src 'self' data: https://*.gstatic.com https://www.gstatic.com; frame-src https://accounts.google.com https://*.firebaseapp.com; object-src 'none'; base-uri 'self'`;
  
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`} suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
      </head>
      <body className="min-h-screen font-[family-name:var(--font-cairo)]">
        <NextTopLoader color="var(--primary)" />

        <ToastProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ToastProvider>

        {/* Auto-recover from chunk loading failures */}
        <Script id="recover-chunk-failure" strategy="afterInteractive" {...(isDev ? {} : { nonce })}>{`
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
