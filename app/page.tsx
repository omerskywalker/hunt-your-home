"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { AlertRecord, ScanRecord, UserPreferences, BookmarkedListing, AIScoredListing } from "@/lib/types";
import { MOCK_ALERTS, MOCK_STATS } from "@/lib/mock-data";

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

const MOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";
const MOCK_STORAGE_KEY = "hyh_mock_mode";
const MOCK_BOOKMARKS_KEY = "hyh_bookmarks";

function getMockBookmarks(): BookmarkedListing[] {
  try {
    const raw = localStorage.getItem(MOCK_BOOKMARKS_KEY);
    return raw ? (JSON.parse(raw) as BookmarkedListing[]) : [];
  } catch {
    return [];
  }
}

function saveMockBookmarks(bms: BookmarkedListing[]): void {
  localStorage.setItem(MOCK_BOOKMARKS_KEY, JSON.stringify(bms));
}

export default function HomePage() {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkedListing[]>([]);

  // Persist mock mode to localStorage — only in dev
  useEffect(() => {
    if (!MOCK_ENABLED) return;
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored === "true") setMockMode(true);
  }, []);

  function toggleMockMode() {
    if (!MOCK_ENABLED) return;
    setMockMode((prev) => {
      const next = !prev;
      localStorage.setItem(MOCK_STORAGE_KEY, String(next));
      return next;
    });
  }

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

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks");
      const json = await res.json() as { success: boolean; data?: BookmarkedListing[] };
      if (json.success && json.data) setBookmarks(json.data);
    } catch {
      // fail silently
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
    void fetchPrefs();
  }, [fetchHistory, fetchPrefs]);

  // Load bookmarks whenever mock mode resolves
  useEffect(() => {
    if (MOCK_ENABLED && mockMode) {
      setBookmarks(getMockBookmarks());
    } else {
      void fetchBookmarks();
    }
  }, [mockMode, fetchBookmarks]);

  function handleToggleBookmark(listing: AIScoredListing) {
    const exists = bookmarks.some((b) => b.listing.id === listing.id);

    if (exists) {
      const updated = bookmarks.filter((b) => b.listing.id !== listing.id);
      setBookmarks(updated);
      if (MOCK_ENABLED && mockMode) {
        saveMockBookmarks(updated);
      } else {
        void fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zpid: listing.id }),
        });
      }
      toast("Home removed from bookmarks", { icon: <Star size={14} /> });
    } else {
      const newBm: BookmarkedListing = {
        listing,
        savedAt: new Date().toISOString(),
        sold: false,
      };
      const updated = [...bookmarks, newBm];
      setBookmarks(updated);
      if (MOCK_ENABLED && mockMode) {
        saveMockBookmarks(updated);
      } else {
        void fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing }),
        });
      }
      toast("Home saved ✦", {
        icon: <Star size={14} fill="#39D353" stroke="#39D353" />,
      });
    }
  }

  // Compute sold zpids to filter from feed
  const soldZpids = new Set(
    bookmarks.filter((b) => b.sold).map((b) => b.listing.id)
  );
  const bookmarkedZpids = new Set(bookmarks.map((b) => b.listing.id));

  const rawAlerts: AlertRecord[] = (MOCK_ENABLED && mockMode)
    ? MOCK_ALERTS
    : (historyData?.alerts ?? []);

  // Filter out sold listings from the main feed
  const displayAlerts = rawAlerts.filter((r) => !soldZpids.has(r.listing.id));

  const displayStats = (MOCK_ENABLED && mockMode)
    ? MOCK_STATS
    : (historyData?.stats ?? {
        todayScans: 0,
        seenCount: 0,
        lastScan: null,
        totalAlerts: 0,
        recentMatches: 0,
      });

  const isLoadingAlerts = (MOCK_ENABLED && mockMode) ? false : loadingHistory;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Bar */}
      <StatsBar
        todayScans={displayStats.todayScans}
        recentMatches={displayStats.recentMatches}
        lastScan={displayStats.lastScan}
        seenCount={displayStats.seenCount}
        onScanComplete={fetchHistory}
        mockMode={mockMode}
        onToggleMock={toggleMockMode}
      />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Alert Feed */}
        <div className="flex-1 min-w-0">
          <AlertFeed
            alerts={displayAlerts}
            loading={isLoadingAlerts}
            bookmarkedZpids={bookmarkedZpids}
            onToggleBookmark={handleToggleBookmark}
          />
        </div>

        {/* Right: Filter Panel */}
        <div className="w-full lg:w-[320px] lg:flex-shrink-0">
          {loadingPrefs ? (
            <div
              className="rounded-xl p-5 space-y-4 animate-pulse"
              style={{ background: "#141C16", border: "1px solid #21262D" }}
            >
              <div className="h-4 rounded w-1/2" style={{ background: "#1A2B1C" }} />
              <div className="h-3 rounded w-3/4" style={{ background: "#1A2B1C" }} />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 rounded" style={{ background: "#1A2B1C" }} />
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
