import "~/styles/globals.css";

export const runtime = "nodejs";

import { Cairo } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata = { title: "Siraj", description: "AI tools" };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-[family-name:var(--font-cairo)]">
        <NextTopLoader color="var(--primary)" />

        <Toaster position="top-center" />

        <TRPCReactProvider>{children}</TRPCReactProvider>

        {/* Auto-recover from chunk loading failures */}
        <Script id="recover-chunk-failure" strategy="afterInteractive">{`
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
