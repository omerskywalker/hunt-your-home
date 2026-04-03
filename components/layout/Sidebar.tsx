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
    <aside
      className="hidden lg:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 z-30"
      style={{ background: "#0D1117", borderRight: "1px solid #21262D" }}
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
            style={{ color: "#080C10", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
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
          style={{ background: "#161B22" }}
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
  );
}
