"use client";

import { useState, useEffect, useCallback } from "react";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { AlertRecord, ScanRecord, UserPreferences } from "@/lib/types";

interface HistoryData {
  alerts: AlertRecord[];
  stats: {
    todayScans: number;
    seenCount: number;
    lastScan: ScanRecord | null;
    totalAlerts: number;
    recentMatches: number;
  };
}

interface PrefsData {
  data: UserPreferences;
}

export default function HomePage() {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      const json = await res.json() as { success: boolean; data: HistoryData };
      if (json.success) setHistoryData(json.data);
    } catch {
      // fail silently — show empty state
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/preferences");
      const json = await res.json() as PrefsData;
      if (json.data) setPrefs(json.data);
    } catch {
      // fail silently — use defaults
    } finally {
      setLoadingPrefs(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
    void fetchPrefs();
  }, [fetchHistory, fetchPrefs]);

  const stats = historyData?.stats ?? {
    todayScans: 0,
    seenCount: 0,
    lastScan: null,
    totalAlerts: 0,
    recentMatches: 0,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Bar */}
      <StatsBar
        todayScans={stats.todayScans}
        recentMatches={stats.recentMatches}
        lastScan={stats.lastScan}
        seenCount={stats.seenCount}
        onScanComplete={fetchHistory}
      />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Alert Feed (~60%) */}
        <div className="flex-1 min-w-0">
          <AlertFeed
            alerts={historyData?.alerts ?? []}
            loading={loadingHistory}
          />
        </div>

        {/* Right: Filter Panel (~40%) */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0">
          {loadingPrefs ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-1/2" />
              <div className="h-3 bg-zinc-800 rounded w-3/4" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-zinc-800 rounded" />
                ))}
              </div>
            </div>
          ) : (
            <FilterPanel
              initialPrefs={prefs ?? undefined}
              onPrefsChange={(updated) => {
                setPrefs(updated);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
