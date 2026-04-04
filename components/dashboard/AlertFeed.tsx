"use client";

import { AlertRecord, AIScoredListing } from "@/lib/types";
import { ListingCard } from "./ListingCard";
import { EmptyState } from "./EmptyState";

interface AlertFeedProps {
  alerts: AlertRecord[];
  loading?: boolean;
  bookmarkedZpids?: Set<string>;
  onToggleBookmark?: (listing: AIScoredListing) => void;
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
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2.5 rounded w-10" style={{ background: "#1A2B1C" }} />
          ))}
        </div>
        <div className="h-2.5 rounded w-full" style={{ background: "#1A2B1C" }} />
        <div className="h-2.5 rounded w-4/5" style={{ background: "#1A2B1C" }} />
      </div>
    </div>
  );
}

export function AlertFeed({ alerts, loading, bookmarkedZpids, onToggleBookmark }: AlertFeedProps) {
  return (
    <section aria-label="Alert history">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-5 rounded-full"
            style={{ background: "#39D353" }}
          />
          <h2
            className="font-semibold text-base"
            style={{
              color: "#E6EDF3",
              fontFamily: "var(--font-space-grotesk, sans-serif)",
            }}
          >
            Alert History
          </h2>
        </div>
        <span
          className="text-xs"
          style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
        >
          {alerts.length} total
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="alert-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
          {alerts.map((record, i) => (
            <ListingCard
              key={record.id}
              record={record}
              index={i}
              isBookmarked={bookmarkedZpids?.has(record.listing.id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </section>
  );
}
