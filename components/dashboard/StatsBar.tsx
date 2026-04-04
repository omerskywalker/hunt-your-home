"use client";

import { motion } from "framer-motion";
import { Scan, Bell, Clock, Database, Zap, FlaskConical } from "lucide-react";
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
  mockMode?: boolean;
  onToggleMock?: () => void;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  isActive?: boolean;  // drives accent color + top border
  italic?: boolean;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, isActive, italic, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-xl flex-1 min-w-0 cursor-default"
      style={{
        background: "#161B22",
        border: "1px solid #21262D",
        borderTop: isActive ? "2px solid #39D353" : "2px solid #21262D",
        padding: "16px 20px",
        transition: "border-color 200ms, box-shadow 200ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#30363D";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px #30363D";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = isActive ? "#39D353" : "#21262D";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Icon + label row */}
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} style={{ color: "#484F58", flexShrink: 0 }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: "#8B949E",
            fontFamily: "var(--font-inter, sans-serif)",
          }}
        >
          {label}
        </span>
      </div>
      {/* Value */}
      <div
        style={{
          fontSize: italic ? 16 : 36,
          fontWeight: 700,
          lineHeight: 1,
          color: isActive ? "#39D353" : italic ? "#8B949E" : "#E6EDF3",
          fontFamily: "var(--font-space-grotesk, sans-serif)",
          fontStyle: italic ? "italic" : "normal",
        }}
      >
        {value}
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
  mockMode = false,
  onToggleMock,
}: StatsBarProps) {
  const [scanning, setScanning] = useState(false);

  const rawLastScan = lastScan
    ? formatDistanceToNow(new Date(lastScan.runAt), { addSuffix: true })
    : "never";
  const lastScanValue =
    rawLastScan === "never"
      ? "never"
      : rawLastScan
          .replace(" minutes", "m")
          .replace(" hours", "h")
          .replace(" days", "d")
          .replace(" seconds", "s")
          .replace(" minute", "m")
          .replace(" hour", "h")
          .replace(" day", "d")
          .replace(" second", "s");
  const lastScanIsNever = !lastScan;

  async function handleScanNow() {
    if (mockMode) {
      toast("Mock mode is on", { description: "Disable mock mode to run a real scan" });
      return;
    }
    setScanning(true);
    toast("Scan started...", { description: "Checking Zillow for new listings" });
    try {
      const res = await fetch("/api/scan-now", { method: "POST" });
      const json = await res.json() as { success: boolean; data?: ScanRecord; error?: string };
      if (json.success && json.data) {
        toast.success(
          `Scan complete: ${json.data.matchedListings} new match${json.data.matchedListings !== 1 ? "es" : ""}`,
          { description: `Found ${json.data.listingsFound} listings, ${json.data.newListings} new` }
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
    <div
      className="rounded-none -mx-6 -mt-6 px-6 py-4 mb-6"
      style={{ background: "#0D1117", borderBottom: "1px solid #21262D" }}
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          <span style={{ color: "#8B949E" }}>Hunt</span>
          <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
          <span style={{ color: "#39D353" }}>Home</span>
        </h1>

        <div className="flex items-center gap-2">
          {/* Mock toggle — dev only */}
          {process.env.NEXT_PUBLIC_ENABLE_MOCK === "true" && onToggleMock && (
            <button
              onClick={onToggleMock}
              className="flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                padding: "7px 12px",
                fontFamily: "var(--font-inter, sans-serif)",
                background: mockMode ? "rgba(57,211,83,0.12)" : "#161B22",
                border: mockMode ? "1px solid rgba(57,211,83,0.35)" : "1px solid #30363D",
                color: mockMode ? "#39D353" : "#8B949E",
              }}
              onMouseEnter={(e) => {
                if (!mockMode) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#484F58";
                  (e.currentTarget as HTMLButtonElement).style.color = "#E6EDF3";
                }
              }}
              onMouseLeave={(e) => {
                if (!mockMode) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#30363D";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8B949E";
                }
              }}
              aria-label={mockMode ? "Disable mock mode" : "Enable mock mode"}
              title={mockMode ? "Mock mode ON — showing sample data" : "Mock mode OFF — showing live data"}
            >
              <FlaskConical size={13} />
              Mock {mockMode ? "ON" : "OFF"}
            </button>
          )}

          {/* Scan Now */}
          <motion.button
            onClick={handleScanNow}
            disabled={scanning}
            whileTap={{ scale: 0.96 }}
            className={mockMode || scanning ? "flex items-center gap-1.5 rounded-lg text-sm font-semibold transition-all duration-150 opacity-40 cursor-not-allowed" : "btn-scan"}
            style={mockMode || scanning ? {
              background: "#161B22",
              color: "#484F58",
              padding: "8px 16px",
              fontFamily: "var(--font-inter, sans-serif)",
              border: "1px dashed #484F58",
            } : { fontFamily: "var(--font-inter, sans-serif)" }}
            title={mockMode ? "Disabled in mock mode" : scanning ? "Scan in progress..." : undefined}
            aria-label="Run manual scan"
          >
            <Zap
              size={14}
              fill={scanning || mockMode ? "none" : "currentColor"}
              className={scanning ? "animate-spin" : ""}
            />
            {scanning ? "Scanning..." : "Scan Now"}
          </motion.button>
        </div>
      </div>

      {/* Mock banner */}
      {mockMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4 text-xs"
          style={{
            background: "rgba(57,211,83,0.06)",
            border: "1px solid rgba(57,211,83,0.4)",
            color: "#8B949E",
            fontFamily: "var(--font-inter, sans-serif)",
            boxShadow: "inset 3px 0 0 0 #39D353",
          }}
        >
          <FlaskConical size={12} style={{ color: "#39D353", flexShrink: 0 }} />
          <span>
            <span style={{ color: "#39D353", fontWeight: 600 }}>Mock mode enabled</span>
            {" "}— displaying 5 sample Frisco TX listings (3bd/3ba+, under $650k). No real API calls are being made.
          </span>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3">
        <StatCard
          icon={Scan}
          label="Scans Today"
          value={todayScans}
          isActive={todayScans > 0}
          delay={0}
        />
        <StatCard
          icon={Bell}
          label="New Matches"
          value={recentMatches}
          isActive={recentMatches > 0}
          delay={0.07}
        />
        <StatCard
          icon={Clock}
          label="Last Scan"
          value={lastScanValue}
          isActive={!lastScanIsNever}
          italic={lastScanIsNever}
          delay={0.14}
        />
        <StatCard
          icon={Database}
          label="Listings Seen"
          value={seenCount.toLocaleString()}
          isActive={seenCount > 0}
          delay={0.21}
        />
      </div>
    </div>
  );
}
