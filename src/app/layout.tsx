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
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? crypto.randomUUID();
  
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
    // Next.js 15 new hashes from CSP violations
    "'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo='",
    "'sha256-6JFVn53eP2y6uu4ED8N3Fluvs1cC6thXLVByrR29HdI='",
    "'sha256-sgGmtMyuU8l1b62k/WYaH+61s6webzD1R6EYaf7VNrk='",
    "'sha256-zrApckK9haEMsN2VtfUe5SRgyViomeV0lkbphVN610o='",
    "'sha256-GfpuOQIYdOQhDh1vPRnd0qBZLboXJEEI1j0GGZ8HSm8='",
    "'sha256-iNvXTpkS96fVlLyrSDeg8ZYiQZohI8FsYhgqhslIuLw='",
    "'sha256-7qizNy3jwpibv+xYr7yWqWH2ifUTm8dFzy6iXmReyG0='",
    "'sha256-cVksAsCQvKE5cYAe2Z+/rthIT4k0f6yc8P4j8offdTY='",
    "'sha256-MB11q1OXU5WmWDfWUAUIh/k9h8w2iMuK3VvXXeNpHSQ='",
    "'sha256-yudJhERqBF2msXVfeTC2/b5fU0A48q7d8melYHrrVlk='",
    "'sha256-Dc5zF9AxsEZCg9yTSKGEO2Gs8+Y+lg2KYjsqWD5808o='",
    "'sha256-VxNQWKNqYyId1F2uUDuUWjjcH8F3suJ4cg5IN8lXfIU='",
    "'sha256-zIY8Y820h8XosVidQ3abkK/n0eAxtiE9t3G9TbKLLiU='",
    "'sha256-+VXumNH1oYBUVo9H/3aqsjc5Jgrwam7lmapyZ9g7Nkc='",
    "'sha256-7MI30Py7/yVKmtM9I6yYAVwaqYBuhtK+DG60v5/2ZyQ='",
    "'sha256-4CCc8AlLVRg4eCaLPCdauOnyMDdPZxneK3fKoJ4/RAo='",
    "'sha256-rwz6eh5qG7gbxD+5Zbgv0Dq4WpP1onygK7G8V5uNOYc='",
    "'sha256-el4hxfZM0b/njcZF7tMC6O/MPJtR3zDpxGvXwuBhc7A='",
    "'sha256-tZiGzz0Z+Cx3ROWpOYLtS6RKCNrR6V31lQLrDSvD1tY='",
    "'sha256-1Eafl0sn76R7lKYrkaRuSDhD+cq92dbgm3uTA5ch94Y='",
    "'sha256-EJAIpZdotRTiejWk0EyOHa4Dw8v1YT2uq0bQCKScwD0='",
    "'sha256-ChGON4fOQhW0A095AlLc0XHJtLhJnKRfIECNOtGFEro='",
    "'sha256-9RLQAGUS8fcPPqYckAolDv4i71bQUOYMz7pbC5O7ZgE='",
    "'sha256-HuhXXJ1Sn0miAWxvMDfYJqJlYEhWXDzmH/0ExSHduCw='",
    "'sha256-NmrindTR1E8YVtXFULbkHhg42WZ1zzoVB1T5ptDquV0='",
    "'sha256-AQMglgy6Cg6ACZUxCFJ1H0O9LZ0IOrGPS6/tcnSp2EU='",
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
