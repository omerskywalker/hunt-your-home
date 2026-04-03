import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" className={cn("h-full", inter.className, "font-sans", geist.variable)}>
      <body className="min-h-full bg-[#0f0f0f] text-zinc-100 antialiased">
        <Sidebar />
        <div className="lg:ml-56 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
          <footer className="px-4 py-3 border-t border-zinc-800 text-center">
            <span className="text-xs text-zinc-600">
              Powered by HuntYourHome
            </span>
          </footer>
        </div>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid #27272a",
              color: "#f4f4f5",
            },
          }}
        />
      </body>
    </html>
  );
}
