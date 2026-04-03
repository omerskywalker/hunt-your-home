"use client";

import { Bell } from "lucide-react";
import { AlertRecord } from "@/lib/types";
import { ListingCard } from "./ListingCard";
import { EmptyState } from "./EmptyState";

interface AlertFeedProps {
  alerts: AlertRecord[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
      <div className="h-40 bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-4 bg-zinc-800 rounded w-1/5" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 bg-zinc-800 rounded w-12" />
          ))}
        </div>
        <div className="h-3 bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-800 rounded w-4/5" />
      </div>
    </div>
  );
}

export function AlertFeed({ alerts, loading }: AlertFeedProps) {
  return (
    <section aria-label="Alert history">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <Bell size={16} className="text-zinc-500" />
        <h2 className="text-zinc-100 font-semibold">Alert History</h2>
        {alerts.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-medium">
            {alerts.length}
          </span>
        )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {alerts.map((record, i) => (
            <ListingCard key={record.id} record={record} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
