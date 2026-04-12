"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, FlaskConical, CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ScanRecord } from "@/lib/types";
import { MOCK_SCAN_HISTORY } from "@/lib/mock-data";

const MOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";
const MOCK_KEY = "hyh_mock_mode";

function StatPill({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-bold text-lg leading-none"
        style={{
          color: accent && value > 0 ? "#39D353" : "#E6EDF3",
          fontFamily: "var(--font-space-grotesk, sans-serif)",
        }}
      >
        {value}
      </span>
      <span
        className="text-[10px] uppercase tracking-widest"
        style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
      >
        {label}
      </span>
    </div>
  );
}

function ScanRow({ scan, index }: { scan: ScanRecord; index: number }) {
  const router = useRouter();
  const hasMatches = scan.matchedListings > 0;
  const timeAgo = formatDistanceToNow(new Date(scan.runAt), { addSuffix: true });
  const timeExact = format(new Date(scan.runAt), "MMM d, h:mm a");
  const durationSec = (scan.durationMs / 1000).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="flex items-center gap-4 rounded-xl px-5 py-4"
      style={{
        background: "#141C16",
        border: `1px solid ${hasMatches ? "rgba(57,211,83,0.2)" : "#21262D"}`,
        borderTop: hasMatches ? "2px solid #39D353" : "2px solid #21262D",
      }}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {hasMatches ? (
          <CheckCircle2 size={18} style={{ color: "#39D353" }} />
        ) : (
          <XCircle size={16} style={{ color: "#484F58" }} />
        )}
      </div>

      {/* Time */}
      <div className="min-w-[140px]">
        <div
          className="text-sm font-medium"
          style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}
        >
          {timeAgo}
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
        >
          {timeExact}
        </div>
      </div>

      {/* Stats */}
      <div
        className="flex items-center gap-6 flex-1"
        style={{ borderLeft: "1px solid #21262D", paddingLeft: 24 }}
      >
        <StatPill value={scan.listingsFound} label="Found" />
        <StatPill value={scan.newListings} label="New" accent />
        <StatPill value={scan.matchedListings} label="Matched" accent />
        <StatPill value={scan.alertsSent} label="Alerted" accent />
      </div>

      {/* Duration */}
      <div
        className="shrink-0 flex items-center gap-1 text-xs"
        style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
      >
        <Clock size={11} />
        {durationSec}s
      </div>

      {/* Debug button */}
      <button
        onClick={() => router.push(`/history/${scan.id}`)}
        className="shrink-0 p-2 rounded-lg hover:bg-opacity-50 transition-colors"
        style={{ background: "rgba(255,255,255,0.05)" }}
        title="Debug scan funnel"
      >
        <Search size={14} style={{ color: "#8B949E" }} />
      </button>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    if (!MOCK_ENABLED) return;
    setMockMode(localStorage.getItem(MOCK_KEY) === "true");
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      const json = await res.json() as { success: boolean; data?: { scans: ScanRecord[] } };
      if (json.success && json.data) setScans(json.data.scans);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (MOCK_ENABLED && mockMode) {
      setScans(MOCK_SCAN_HISTORY);
      setLoading(false);
    } else {
      void fetchHistory();
    }
  }, [mockMode, fetchHistory]);

  // Aggregate stats
  const totalFound    = scans.reduce((s, r) => s + r.listingsFound, 0);
  const totalNew      = scans.reduce((s, r) => s + r.newListings, 0);
  const totalMatched  = scans.reduce((s, r) => s + r.matchedListings, 0);
  const totalAlerted  = scans.reduce((s, r) => s + r.alertsSent, 0);
  const avgDurationMs = scans.length
    ? Math.round(scans.reduce((s, r) => s + r.durationMs, 0) / scans.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div
        className="-mx-6 -mt-6 px-6 py-4 mb-6 flex items-center justify-between"
        style={{ background: "#0D1510", borderBottom: "1px solid #21262D" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#39D353" }} />
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "#E6EDF3" }}
          >
            Scan History
          </h1>
        </div>

        {MOCK_ENABLED && mockMode && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
            style={{
              background: "rgba(57,211,83,0.06)",
              border: "1px solid rgba(57,211,83,0.2)",
              color: "#39D353",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            <FlaskConical size={12} />
            Mock mode
          </div>
        )}
      </div>

      {/* Summary cards */}
      {!loading && scans.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total Scans",      value: scans.length,    accent: false },
            { label: "Listings Checked", value: totalFound,      accent: false },
            { label: "New Seen",         value: totalNew,        accent: true  },
            { label: "Matched",          value: totalMatched,    accent: true  },
            { label: "Alerts Sent",      value: totalAlerted,    accent: true  },
          ].map(({ label, value, accent }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="rounded-xl px-4 py-3 flex flex-col gap-1"
              style={{
                background: "#141C16",
                border: `1px solid #21262D`,
                borderTop: accent && value > 0 ? "2px solid #39D353" : "2px solid #21262D",
              }}
            >
              <span
                className="text-2xl font-bold"
                style={{
                  color: accent && value > 0 ? "#39D353" : "#E6EDF3",
                  fontFamily: "var(--font-space-grotesk, sans-serif)",
                }}
              >
                {value}
              </span>
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Avg duration note */}
      {!loading && scans.length > 0 && (
        <div
          className="flex items-center gap-1.5 mb-4 text-xs"
          style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
        >
          <Activity size={11} />
          {scans.length} scans — avg {(avgDurationMs / 1000).toFixed(1)}s per run
        </div>
      )}

      {/* Scan list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ background: "#141C16", border: "1px solid #21262D" }}
            />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Activity size={32} style={{ color: "#30363D" }} className="mb-4" />
          <p
            className="text-base font-semibold mb-1"
            style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            No scans yet.
          </p>
          <p
            className="text-sm"
            style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            Scans run automatically 4× daily. History will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {scans.map((scan, i) => (
            <ScanRow key={scan.id} scan={scan} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
