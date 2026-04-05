"use client";

import { Home, Bell, Settings, Activity, Bookmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home,     label: "Dashboard",    href: "/" },
  { icon: Bell,     label: "Alerts",       href: "/alerts" },
  { icon: Bookmark, label: "Bookmarks",    href: "/bookmarks" },
  { icon: Activity, label: "Scan History", href: "/history" },
  { icon: Settings, label: "Settings",     href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 z-30"
        style={{ background: "#0D1510", borderRight: "1px solid #21262D" }}
      >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4"
        style={{ height: 64, borderBottom: "1px solid #21262D" }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "#39D353" }}
        >
          <span
            className="text-xs font-bold"
            style={{ color: "#080E0A", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            H
          </span>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", textDecoration: "none" }}
        >
          <span style={{ color: "#8B949E" }}>Hunt</span>
          <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
          <span style={{ color: "#39D353" }}>Home</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item, i) => {
          const active = pathname === item.href;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.055, duration: 0.2 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-2.5 py-2 rounded-md text-sm transition-colors duration-150"
                style={
                  active
                    ? {
                        color: "#E6EDF3",
                        background: "transparent",
                        borderLeft: "2px solid #39D353",
                        paddingLeft: "calc(0.75rem - 2px)",
                        paddingRight: "0.75rem",
                      }
                    : {
                        color: "#8B949E",
                        borderLeft: "2px solid transparent",
                        paddingLeft: "calc(0.75rem - 2px)",
                        paddingRight: "0.75rem",
                      }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(28,36,48,0.5)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#E6EDF3";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#8B949E";
                  }
                }}
              >
                <item.icon
                  size={16}
                  style={{ color: active ? "#39D353" : "#484F58" }}
                />
                <span style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 14 }}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

        {/* Status pill */}
        <div className="px-4 py-5">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{ background: "#141C16" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#39D353", boxShadow: "0 0 4px #39D353" }}
            />
            <span
              className="text-[11px]"
              style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              agent active
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{ background: "#0D1510", borderTop: "1px solid #21262D" }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item, i) => {
            const active = pathname === item.href;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035, duration: 0.2 }}
                className="flex-1"
              >
                <Link
                  href={item.href}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center transition-colors duration-150 min-h-[48px] justify-center"
                  style={{
                    color: active ? "#E6EDF3" : "#8B949E",
                    background: active ? "rgba(57,211,83,0.1)" : "transparent",
                  }}
                  onTouchStart={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(28,36,48,0.5)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#E6EDF3";
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#8B949E";
                    }
                  }}
                >
                  <item.icon
                    size={18}
                    style={{ color: active ? "#39D353" : "#484F58" }}
                  />
                  <span 
                    style={{ 
                      fontFamily: "var(--font-inter, sans-serif)", 
                      fontSize: 10,
                      fontWeight: active ? 600 : 400,
                      lineHeight: 1.2
                    }}
                  >
                    {item.label === "Scan History" ? "History" : item.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
