"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Scan, Bell, Clock, Database, Zap, FlaskConical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef } from "react";
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
  isActive?: boolean;
  italic?: boolean;
  delay?: number;
}

const SCAN_STAGES = [
  { until: 12,  text: "Connecting to Zillow..." },
  { until: 30,  text: "Fetching listings..." },
  { until: 50,  text: "Applying filters..." },
  { until: 80,  text: "Scoring matches with Claude AI..." },
  { until: Infinity, text: "Finalizing results..." },
];

function useScanStage(elapsedSecs: number) {
  return SCAN_STAGES.find((s) => elapsedSecs < s.until)!.text;
}

function ScanningBanner({ elapsedSecs }: { elapsedSecs: number }) {
  const stageText = useScanStage(elapsedSecs);
  const pct = Math.min(92, (elapsedSecs / 90) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      style={{ overflow: "hidden" }}
    >
      <div
        style={{
          background: "rgba(57,211,83,0.05)",
          border: "1px solid rgba(57,211,83,0.2)",
          borderRadius: 12,
          padding: "14px 18px",
        }}
      >
        {/* Top row: pulse dot + stage text + elapsed */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Animated pulse dot */}
            <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#39D353",
                  opacity: 0.4,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 2,
                  borderRadius: "50%",
                  background: "#39D353",
                }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.span
                key={stageText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#E6EDF3",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                {stageText}
              </motion.span>
            </AnimatePresence>
          </div>

          <span
            style={{
              fontSize: 11,
              color: "#484F58",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {elapsedSecs}s
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: "rgba(57,211,83,0.12)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #39D353, #58A6FF)",
              borderRadius: 99,
            }}
          />
        </div>

        {/* Stage dots */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {SCAN_STAGES.slice(0, -1).map((stage, i) => {
            const stageBoundary = SCAN_STAGES[i].until;
            const done = elapsedSecs >= stageBoundary;
            const active = !done && (i === 0 || elapsedSecs >= SCAN_STAGES[i - 1].until);
            return (
              <div
                key={stage.text}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: done
                    ? "#39D353"
                    : active
                    ? "rgba(57,211,83,0.5)"
                    : "#21262D",
                  transition: "background 0.4s",
                  flexShrink: 0,
                }}
              />
            );
          })}
          <span
            style={{
              fontSize: 10,
              color: "#484F58",
              fontFamily: "var(--font-inter, sans-serif)",
              marginLeft: 4,
            }}
          >
            typically completes in 60–90s
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, isActive, italic, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-xl flex-1 min-w-0 cursor-default"
      style={{
        background: "#141C16",
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
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const scanStartedAt = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopScanning(success: boolean, matches?: number, found?: number) {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
    setScanning(false);
    setElapsedSecs(0);
    scanStartedAt.current = null;

    if (success) {
      const desc = found !== undefined
        ? `Found ${found} listings · ${matches ?? 0} matched your criteria`
        : "New results are ready";
      toast.success("Scan complete", { description: desc });
      onScanComplete?.();
    } else {
      toast.error("Scan failed", { description: "Check Vercel logs for details" });
    }
  }

  function startPolling(startedAt: number) {
    // Elapsed counter — ticks every second
    timerRef.current = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    // Poll history every 5s until a scan record newer than startedAt appears
    pollRef.current = setInterval(async () => {
      // Safety cutoff at 3 minutes
      if (Date.now() - startedAt > 180_000) {
        stopScanning(false);
        return;
      }
      try {
        const res = await fetch("/api/history");
        if (!res.ok) return;
        const json = await res.json() as {
          success: boolean;
          data?: { stats?: { lastScan?: { runAt: string; matchedListings?: number; listingsFound?: number } } };
        };
        const ls = json.data?.stats?.lastScan;
        if (ls && new Date(ls.runAt).getTime() > startedAt) {
          stopScanning(true, ls.matchedListings, ls.listingsFound);
        }
      } catch {
        // ignore transient fetch errors, keep polling
      }
    }, 5000);
  }

  async function handleScanNow() {
    if (mockMode) {
      toast("Mock mode is on", { description: "Disable mock mode to run a real scan" });
      return;
    }
    const startedAt = Date.now();
    scanStartedAt.current = startedAt;
    setScanning(true);
    setElapsedSecs(0);

    try {
      const res = await fetch("/api/scan-now", { method: "POST" });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) {
        setScanning(false);
        toast.error("Scan failed", { description: json.error ?? "Unknown error" });
        return;
      }
      startPolling(startedAt);
    } catch {
      setScanning(false);
      toast.error("Scan failed", { description: "Network error" });
    }
  }

  const rawLastScan = lastScan
    ? formatDistanceToNow(new Date(lastScan.runAt), { addSuffix: true })
    : "never";
  const lastScanValue =
    rawLastScan === "never"
      ? "never"
      : rawLastScan
          .replace(" minutes", "m").replace(" minute", "m")
          .replace(" hours", "h").replace(" hour", "h")
          .replace(" days", "d").replace(" day", "d")
          .replace(" seconds", "s").replace(" second", "s");
  const lastScanIsNever = !lastScan;

  return (
    <div
      className="rounded-none -mx-6 -mt-6 px-6 py-4 mb-6"
      style={{ background: "#0D1510", borderBottom: "1px solid #21262D" }}
    >
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
        <h1
          className="text-xl sm:text-2xl font-semibold"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          <span style={{ color: "#8B949E" }}>Hunt</span>
          <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
          <span style={{ color: "#39D353" }}>Home</span>
        </h1>

        <div className="flex items-center gap-2 justify-start sm:justify-end">
          {process.env.NEXT_PUBLIC_ENABLE_MOCK === "true" && onToggleMock && (
            <button
              onClick={onToggleMock}
              className="flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                padding: "7px 12px",
                fontFamily: "var(--font-inter, sans-serif)",
                background: mockMode ? "rgba(57,211,83,0.12)" : "#141C16",
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

          <motion.button
            onClick={handleScanNow}
            disabled={scanning}
            whileTap={{ scale: 0.96 }}
            className={mockMode || scanning
              ? "flex items-center gap-1.5 rounded-lg text-sm font-semibold transition-all duration-150 opacity-40 cursor-not-allowed"
              : "btn-scan"}
            style={mockMode || scanning ? {
              background: "#141C16",
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

      {/* Scanning banner */}
      <AnimatePresence>
        {scanning && <ScanningBanner elapsedSecs={elapsedSecs} />}
      </AnimatePresence>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Scan}     label="Scans Today"    value={todayScans}               isActive={todayScans > 0}    delay={0}    />
        <StatCard icon={Bell}     label="New Matches"    value={recentMatches}             isActive={recentMatches > 0} delay={0.07} />
        <StatCard icon={Clock}    label="Last Scan"      value={lastScanValue}             isActive={!lastScanIsNever}  italic={lastScanIsNever} delay={0.14} />
        <StatCard icon={Database} label="Listings Seen"  value={seenCount.toLocaleString()} isActive={seenCount > 0}    delay={0.21} />
      </div>
    </div>
  );
}
