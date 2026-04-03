"use client";

import { Home, Bell, Settings, Activity, ChevronRight } from "lucide-react";
import Link from "next/link";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/", active: true },
  { icon: Bell, label: "Alerts", href: "#alerts" },
  { icon: Activity, label: "Scan History", href: "#history" },
  { icon: Settings, label: "Settings", href: "#settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-zinc-900 border-r border-zinc-800 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold">
              <span className="text-zinc-400">Hunt</span>
              <span className="text-zinc-100">Your</span>
              <span className="text-brand">Home</span>
            </div>
            <div className="text-[10px] text-zinc-600">Frisco, TX Monitor</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
              item.active
                ? "bg-brand/10 text-brand border border-brand/20"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            }`}
          >
            <item.icon
              size={16}
              className={
                item.active
                  ? "text-brand"
                  : "text-zinc-500 group-hover:text-zinc-300"
              }
            />
            {item.label}
            {item.active && (
              <ChevronRight size={12} className="ml-auto text-brand/60" />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-500">Agent active</span>
        </div>
      </div>
    </aside>
  );
}
