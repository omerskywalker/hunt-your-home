import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hunt-your-home.vercel.app";

export const metadata: Metadata = {
  title: "HuntYourHome — Frisco TX Home Monitor",
  description:
    "AI-powered real estate monitoring for Frisco, TX. Get instant alerts when new homes matching your criteria hit Zillow.",
  keywords: ["real estate", "Frisco TX", "home search", "Zillow", "AI"],
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "HuntYourHome — AI-powered home alerts for Frisco, TX",
    description:
      "Never miss a great listing. Zillow monitored 4× daily, every match scored by AI, alerts straight to your inbox.",
    url: APP_URL,
    siteName: "HuntYourHome",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HuntYourHome — AI-powered home alerts for Frisco, TX",
    description:
      "Never miss a great listing. Zillow monitored 4× daily, every match scored by AI, alerts straight to your inbox.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body
        className="min-h-full antialiased"
        style={{ background: "#080E0A", color: "#E6EDF3", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
      >
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
        <Sidebar />
        <div className="lg:ml-[220px] flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 px-6 py-6 pb-20 lg:pb-6">{children}</main>
          <footer
            className="text-center mt-8 py-8"
            style={{ borderTop: "1px solid #21262D" }}
          >
            <span
              className="text-xs"
              style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              Powered by{" "}
              <span style={{ color: "#39D353", fontWeight: 500 }}>
                HuntYourHome
              </span>
            </span>
          </footer>
        </div>
        <Analytics />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#141C16",
              border: "1px solid #21262D",
              color: "#E6EDF3",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            },
          }}
        />
      </body>
    </html>
  );
}
