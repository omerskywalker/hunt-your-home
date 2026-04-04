"use client";

import { Bell, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur lg:hidden"
      style={{ background: "rgba(13,17,23,0.9)", borderBottom: "1px solid #21262D" }}
    >
      <button
        onClick={onMenuClick}
        className="p-2 rounded-md transition-colors"
        style={{ color: "#8B949E" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#1A2B1C";
          (e.currentTarget as HTMLButtonElement).style.color = "#E6EDF3";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "#8B949E";
        }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <span
        className="text-sm font-semibold"
        style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
      >
        <span style={{ color: "#8B949E" }}>Hunt</span>
        <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
        <span style={{ color: "#39D353" }}>Home</span>
      </span>

      <button
        className="p-2 rounded-md transition-colors"
        style={{ color: "#8B949E" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#1A2B1C";
          (e.currentTarget as HTMLButtonElement).style.color = "#E6EDF3";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "#8B949E";
        }}
        aria-label="Notifications"
      >
        <Bell size={20} />
      </button>
    </header>
  );
}
