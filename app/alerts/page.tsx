"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, FlaskConical, Star, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { AlertRecord, BookmarkedListing, AIScoredListing } from "@/lib/types";
import { ListingCard } from "@/components/dashboard/ListingCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ComparisonDrawer } from "@/components/dashboard/ComparisonDrawer";
import { MOCK_ALERTS } from "@/lib/mock-data";

const MOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";
const MOCK_KEY = "hyh_mock_mode";
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

function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{ background: "#141C16", border: "1px solid #21262D" }}
    >
      <div className="h-40" style={{ background: "#1A2B1C" }} />
      <div className="p-4 space-y-3">
        <div className="flex justify-between gap-2">
          <div className="h-3.5 rounded w-3/4" style={{ background: "#1A2B1C" }} />
          <div className="h-3.5 rounded w-1/5" style={{ background: "#1A2B1C" }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-2.5 rounded" style={{ background: "#1A2B1C", width: `${[100, 80, 60][i - 1]}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkedListing[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<AIScoredListing[]>([]);
  const [showComparisonDrawer, setShowComparisonDrawer] = useState(false);

  useEffect(() => {
    if (!MOCK_ENABLED) return;
    setMockMode(localStorage.getItem(MOCK_KEY) === "true");
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      const json = await res.json() as { success: boolean; data?: { alerts: AlertRecord[] } };
      if (json.success && json.data) setAlerts(json.data.alerts);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
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
    if (MOCK_ENABLED && mockMode) {
      setAlerts(MOCK_ALERTS);
      setBookmarks(getMockBookmarks());
      setLoading(false);
    } else {
      void fetchAlerts();
      void fetchBookmarks();
    }
  }, [mockMode, fetchAlerts, fetchBookmarks]);

  function handleToggleComparison(listing: AIScoredListing) {
    const isSelected = selectedForComparison.some((l) => l.id === listing.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedForComparison(prev => prev.filter(l => l.id !== listing.id));
    } else {
      // Add to selection (max 3)
      setSelectedForComparison(prev => {
        if (prev.length >= 3) {
          toast("Maximum 3 homes can be compared", { icon: <BarChart3 size={14} /> });
          return prev;
        }
        return [...prev, listing];
      });
    }
  }

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

  const soldZpids = new Set(bookmarks.filter((b) => b.sold).map((b) => b.listing.id));
  const bookmarkedZpids = new Set(bookmarks.map((b) => b.listing.id));

  // Filter sold from display
  const visibleAlerts = alerts.filter((a) => !soldZpids.has(a.listing.id));
  const hotAlerts = visibleAlerts.filter((a) => a.listing.alertTier === "HOT");
  const matchAlerts = visibleAlerts.filter((a) => a.listing.alertTier !== "HOT");

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div
        className="-mx-6 -mt-6 px-6 py-4 mb-6 flex items-center justify-between"
        style={{ background: "#0D1510", borderBottom: "1px solid #21262D" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: "#39D353" }} />
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "#E6EDF3" }}
            >
              Alert History
            </h1>
          </div>
          {visibleAlerts.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "#141C16",
                border: "1px solid #21262D",
                color: "#8B949E",
                fontFamily: "var(--font-inter, sans-serif)",
              }}
            >
              {visibleAlerts.length} total
            </span>
          )}
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

      {/* Compare button (shown when 2-3 selected) */}
      {selectedForComparison.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bottom-8 left-1/2 z-40"
          style={{ transform: "translateX(-50%)" }}
        >
          <button
            onClick={() => setShowComparisonDrawer(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-lg transition-all duration-200"
            style={{
              background: "#39D353",
              color: "#080E0A",
              fontFamily: "var(--font-inter, sans-serif)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = "scale(1.05)";
              el.style.boxShadow = "0 8px 32px rgba(57,211,83,0.4)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = "scale(1)";
              el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
            }}
          >
            <BarChart3 size={18} />
            Compare {selectedForComparison.length} Homes
          </button>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : visibleAlerts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {/* HOT alerts */}
          {hotAlerts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                  style={{
                    background: "rgba(255,107,53,0.1)",
                    border: "1px solid rgba(255,107,53,0.2)",
                    color: "#FF6B35",
                    fontFamily: "var(--font-inter, sans-serif)",
                  }}
                >
                  🔥 HOT
                </span>
                <span
                  className="text-xs"
                  style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
                >
                  {hotAlerts.length} listing{hotAlerts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotAlerts.map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <ListingCard
                      record={record}
                      index={i}
                      isBookmarked={bookmarkedZpids.has(record.listing.id)}
                      onToggleBookmark={handleToggleBookmark}
                      showComparisonCheckbox={true}
                      isSelectedForComparison={selectedForComparison.some(l => l.id === record.listing.id)}
                      onToggleComparison={handleToggleComparison}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* MATCH alerts */}
          {matchAlerts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                  style={{
                    background: "rgba(88,166,255,0.1)",
                    border: "1px solid rgba(88,166,255,0.2)",
                    color: "#58A6FF",
                    fontFamily: "var(--font-inter, sans-serif)",
                  }}
                >
                  ✦ MATCH
                </span>
                <span
                  className="text-xs"
                  style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
                >
                  {matchAlerts.length} listing{matchAlerts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchAlerts.map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <ListingCard
                      record={record}
                      index={i}
                      isBookmarked={bookmarkedZpids.has(record.listing.id)}
                      onToggleBookmark={handleToggleBookmark}
                      showComparisonCheckbox={true}
                      isSelectedForComparison={selectedForComparison.some(l => l.id === record.listing.id)}
                      onToggleComparison={handleToggleComparison}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Comparison Drawer */}
      <ComparisonDrawer
        isOpen={showComparisonDrawer}
        onClose={() => setShowComparisonDrawer(false)}
        listings={selectedForComparison}
      />
    </div>
  );
}
