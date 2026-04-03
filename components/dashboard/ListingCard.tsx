"use client";

import { motion } from "framer-motion";
import { ExternalLink, Bed, Bath, Maximize2, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { AlertRecord } from "@/lib/types";

interface ListingCardProps {
  record: AlertRecord;
  index?: number;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-brand/15 text-brand border-brand/30"
      : score >= 6
      ? "bg-zinc-700/50 text-zinc-300 border-zinc-600"
      : "bg-zinc-800/50 text-zinc-500 border-zinc-700";

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${color}`}
    >
      <span className="text-[10px] font-normal opacity-70">AI</span>
      {score}
      <span className="text-[10px] font-normal opacity-70">/10</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: "HOT" | "MATCH" }) {
  return tier === "HOT" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/30 text-[11px] font-semibold">
      🔥 HOT
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-700/40 text-zinc-300 border border-zinc-700 text-[11px] font-semibold">
      ✦ MATCH
    </span>
  );
}

export function ListingCard({ record, index = 0 }: ListingCardProps) {
  const { listing, sentAt } = record;
  const photoUrl = listing.photos?.[0];
  const timeAgo = formatDistanceToNow(new Date(sentAt), { addSuffix: true });
  const pricePerSqft =
    listing.pricePerSqft ??
    (listing.sqft > 0 ? Math.round(listing.price / listing.sqft) : null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group"
      aria-label={`Listing: ${listing.address}`}
    >
      {/* Photo */}
      <div className="relative h-40 bg-zinc-800 overflow-hidden">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={listing.address}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
              <span className="text-zinc-500 text-xl">🏠</span>
            </div>
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <TierBadge tier={listing.alertTier} />
        </div>
        <div className="absolute top-2 right-2">
          <ScoreBadge score={listing.aiScore} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Address & Price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-zinc-100 font-semibold text-sm leading-snug line-clamp-2 flex-1">
            {listing.address}
          </h3>
          <div className="shrink-0 text-right">
            <div className="text-brand font-bold text-base">
              ${listing.price.toLocaleString()}
            </div>
            {pricePerSqft && (
              <div className="text-zinc-500 text-xs">${pricePerSqft}/sqft</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
          <span className="flex items-center gap-1">
            <Bed size={12} className="text-zinc-600" />
            {listing.beds} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath size={12} className="text-zinc-600" />
            {listing.baths} ba
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 size={12} className="text-zinc-600" />
            {listing.sqft.toLocaleString()} sqft
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} className="text-zinc-600" />
            {listing.yearBuilt}
          </span>
        </div>

        {/* AI Reason */}
        <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 mb-3">
          {listing.aiReason}
        </p>

        {/* Highlights */}
        {listing.aiHighlights.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.aiHighlights.slice(0, 3).map((h, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 bg-green-950/40 text-green-400 border border-green-900/50 rounded"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-600">{timeAgo}</span>
          <a
            href={listing.zillowUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-brand hover:text-brand-light font-medium transition-colors"
            aria-label={`View ${listing.address} on Zillow`}
          >
            View on Zillow
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </motion.article>
  );
}
