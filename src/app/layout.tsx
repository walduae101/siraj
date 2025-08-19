import "~/styles/globals.css";

export const runtime = "nodejs";

import { Cairo } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import Snowflake from "~/components/snowflake";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata = { title: "Siraj", description: "AI tools" };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-cairo)]">
        <NextTopLoader color="var(--primary)" />

        {/* <Snowflake /> */}

        <Toaster position="top-center" />

        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
console.log("Siraj v1.0 - Environment Fix");
