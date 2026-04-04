"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bookmark, FlaskConical, Star } from "lucide-react";
import { toast } from "sonner";
import { BookmarkedListing, AIScoredListing } from "@/lib/types";
import { ListingCard } from "@/components/dashboard/ListingCard";
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
          <div
            key={i}
            className="h-2.5 rounded"
            style={{ background: "#1A2B1C", width: `${[100, 80, 60][i - 1]}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    if (!MOCK_ENABLED) return;
    setMockMode(localStorage.getItem(MOCK_KEY) === "true");
  }, []);

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks");
      const json = (await res.json()) as {
        success: boolean;
        data?: BookmarkedListing[];
      };
      if (json.success && json.data) setBookmarks(json.data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (MOCK_ENABLED && mockMode) {
      setBookmarks(getMockBookmarks());
      setLoading(false);
    } else {
      void fetchBookmarks();
    }
  }, [mockMode, fetchBookmarks]);

  function handleToggleBookmark(listing: AIScoredListing) {
    const exists = bookmarks.some((b) => b.listing.id === listing.id);

    if (exists) {
      // Remove
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
      toast("Home removed from bookmarks", {
        icon: <Star size={14} />,
      });
    } else {
      // Add
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

  const bookmarkedZpids = new Set(bookmarks.map((b) => b.listing.id));
  const activeBookmarks = bookmarks.filter((b) => !b.sold);
  const soldBookmarks = bookmarks.filter((b) => b.sold);

  // Convert BookmarkedListing → AlertRecord shape for ListingCard
  function toAlertRecord(bm: BookmarkedListing) {
    return {
      id: bm.listing.id,
      listing: bm.listing,
      sentAt: bm.savedAt,
      emailDelivered: false,
    };
  }

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
              style={{
                fontFamily: "var(--font-space-grotesk, sans-serif)",
                color: "#E6EDF3",
              }}
            >
              Bookmarks
            </h1>
          </div>
          {bookmarks.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "#141C16",
                border: "1px solid #21262D",
                color: "#8B949E",
                fontFamily: "var(--font-inter, sans-serif)",
              }}
            >
              {bookmarks.length} saved
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

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Bookmark size={32} style={{ color: "#30363D" }} className="mb-4" />
          <p
            className="text-base font-semibold mb-1"
            style={{
              color: "#E6EDF3",
              fontFamily: "var(--font-space-grotesk, sans-serif)",
            }}
          >
            No bookmarks yet.
          </p>
          <p
            className="text-sm"
            style={{
              color: "#8B949E",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            Star a listing to save it here for quick viewing.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active bookmarks */}
          {activeBookmarks.length > 0 && (
            <section>
              {soldBookmarks.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                    style={{
                      background: "rgba(57,211,83,0.1)",
                      border: "1px solid rgba(57,211,83,0.2)",
                      color: "#39D353",
                      fontFamily: "var(--font-inter, sans-serif)",
                    }}
                  >
                    ✦ ACTIVE
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: "#484F58",
                      fontFamily: "var(--font-inter, sans-serif)",
                    }}
                  >
                    {activeBookmarks.length} listing{activeBookmarks.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeBookmarks.map((bm, i) => (
                  <motion.div
                    key={bm.listing.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <ListingCard
                      record={toAlertRecord(bm)}
                      index={i}
                      isBookmarked={bookmarkedZpids.has(bm.listing.id)}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Sold bookmarks */}
          {soldBookmarks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                  style={{
                    background: "rgba(180,28,28,0.1)",
                    border: "1px solid rgba(180,28,28,0.25)",
                    color: "#F87171",
                    fontFamily: "var(--font-inter, sans-serif)",
                  }}
                >
                  SOLD
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: "#484F58",
                    fontFamily: "var(--font-inter, sans-serif)",
                  }}
                >
                  {soldBookmarks.length} listing{soldBookmarks.length !== 1 ? "s" : ""} no longer available
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {soldBookmarks.map((bm, i) => (
                  <motion.div
                    key={bm.listing.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <ListingCard
                      record={toAlertRecord(bm)}
                      index={i}
                      isBookmarked={bookmarkedZpids.has(bm.listing.id)}
                      onToggleBookmark={handleToggleBookmark}
                      showSoldBanner
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Mock hint */}
      {MOCK_ENABLED && mockMode && bookmarks.length === 0 && (
        <div
          className="mt-8 rounded-xl p-4 text-center text-xs"
          style={{
            background: "rgba(57,211,83,0.04)",
            border: "1px dashed rgba(57,211,83,0.2)",
            color: "#484F58",
            fontFamily: "var(--font-inter, sans-serif)",
          }}
        >
          In mock mode — star any listing on the Dashboard or Alerts page to save it here.
        </div>
      )}
    </div>
  );
}
