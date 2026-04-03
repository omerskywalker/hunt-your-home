"use client";

import { Bell, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-onyx-950/80 backdrop-blur border-b border-zinc-800 lg:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-md bg-brand flex items-center justify-center">
          <span className="text-white font-bold text-xs">H</span>
        </div>
        <span className="text-sm font-semibold">
          <span className="text-zinc-400">Hunt</span>
          <span className="text-zinc-100">Your</span>
          <span className="text-brand">Home</span>
        </span>
      </div>

      <button
        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
      </button>
    </header>
  );
}
