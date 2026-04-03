import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";

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

export const metadata: Metadata = {
  title: "HuntYourHome — Frisco TX Home Monitor",
  description:
    "AI-powered real estate monitoring for Frisco, TX. Get instant alerts when new homes matching your criteria hit Zillow.",
  keywords: ["real estate", "Frisco TX", "home search", "Zillow", "AI"],
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
        style={{ background: "#080C10", color: "#E6EDF3", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
      >
        <Sidebar />
        <div className="lg:ml-[220px] flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 px-6 py-6">{children}</main>
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
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#161B22",
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
