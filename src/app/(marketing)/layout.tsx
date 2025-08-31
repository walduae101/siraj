import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "~/styles/globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Siraj — Arabic AI SaaS Platform",
  description: "Advanced AI-powered platform for Arabic content creation, analysis, and automation. Built for the modern Arabic-speaking world.",
  keywords: ["Arabic AI", "SaaS", "Content Creation", "Automation", "AI Platform"],
  authors: [{ name: "Siraj Team" }],
  openGraph: {
    title: "Siraj — Arabic AI SaaS Platform",
    description: "Advanced AI-powered platform for Arabic content creation, analysis, and automation.",
    type: "website",
    locale: "ar_AR",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Siraj — Arabic AI SaaS Platform",
    description: "Advanced AI-powered platform for Arabic content creation, analysis, and automation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="relative">
          {children}
        </div>
      </body>
    </html>
  );
}
