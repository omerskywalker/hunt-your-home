"use client";

import { motion } from "framer-motion";
import { Scan, Bell, Clock, Database, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { ScanRecord } from "@/lib/types";

interface StatsBarProps {
  todayScans: number;
  recentMatches: number;
  lastScan: ScanRecord | null;
  seenCount: number;
  onScanComplete?: () => void;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: boolean;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, accent, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex-1 min-w-0"
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          accent ? "bg-brand/15" : "bg-zinc-800"
        }`}
      >
        <Icon
          size={16}
          className={accent ? "text-brand" : "text-zinc-400"}
        />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-zinc-500 truncate">{label}</div>
        <div
          className={`text-lg font-semibold leading-tight ${
            accent ? "text-brand" : "text-zinc-100"
          }`}
        >
          {value}
        </div>
      </div>
    </motion.div>
  );
}

export function StatsBar({
  todayScans,
  recentMatches,
  lastScan,
  seenCount,
  onScanComplete,
}: StatsBarProps) {
  const [scanning, setScanning] = useState(false);

  const lastScanLabel = lastScan
    ? formatDistanceToNow(new Date(lastScan.runAt), { addSuffix: true })
    : "Never";

  async function handleScanNow() {
    setScanning(true);
    toast("Scan started...", { description: "Checking Zillow for new listings" });

    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const json = await res.json() as { success: boolean; data?: ScanRecord; error?: string };

      if (json.success && json.data) {
        toast.success(
          `Scan complete: ${json.data.matchedListings} new match${json.data.matchedListings !== 1 ? "es" : ""}`,
          {
            description: `Found ${json.data.listingsFound} listings, ${json.data.newListings} new`,
          }
        );
        onScanComplete?.();
      } else {
        toast.error("Scan failed", { description: json.error ?? "Unknown error" });
      }
    } catch {
      toast.error("Scan failed", { description: "Network error" });
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Wordmark + Scan button row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-zinc-400">Hunt</span>
          <span className="text-zinc-100">Your</span>
          <span className="text-brand">Home</span>
        </h1>
        <button
          onClick={handleScanNow}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-light disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          aria-label="Run manual scan"
        >
          <RefreshCw
            size={14}
            className={scanning ? "animate-spin" : ""}
          />
          {scanning ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <StatCard
          icon={Scan}
          label="Scans Today"
          value={todayScans}
          delay={0}
        />
        <StatCard
          icon={Bell}
          label="New Matches"
          value={recentMatches}
          accent={recentMatches > 0}
          delay={0.05}
        />
        <StatCard
          icon={Clock}
          label="Last Scan"
          value={lastScanLabel}
          delay={0.1}
        />
        <StatCard
          icon={Database}
          label="Listings Seen"
          value={seenCount.toLocaleString()}
          delay={0.15}
        />
      </div>
    </div>
  );
}
