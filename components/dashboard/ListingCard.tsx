"use client";

import { motion } from "framer-motion";
import { ExternalLink, Bed, Bath, Maximize2, Calendar, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { AlertRecord, AIScoredListing } from "@/lib/types";
import { formatPriceDrop } from "@/lib/storage";

interface ListingCardProps {
  record: AlertRecord;
  index?: number;
  isBookmarked?: boolean;
  onToggleBookmark?: (listing: AIScoredListing) => void;
  showSoldBanner?: boolean;
}

function ScoreBadge({ score, tier }: { score: number; tier: "HOT" | "MATCH" }) {
  const isHot = tier === "HOT";
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold min-h-[22px]"
      style={{
        background: "rgba(8,12,16,0.82)",
        backdropFilter: "blur(6px)",
        borderColor: isHot ? "rgba(57,211,83,0.5)" : "rgba(88,166,255,0.5)",
        color: isHot ? "#39D353" : "#58A6FF",
      }}
    >
      <span
        className="font-normal text-[9px] uppercase tracking-wide"
        style={{ opacity: 0.7, fontFamily: "var(--font-inter, sans-serif)" }}
      >
        AI
      </span>
      <span style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 12 }}>
        {score}/10
      </span>
    </div>
  );
}

function TierBadge({ tier }: { tier: "HOT" | "MATCH" }) {
  return tier === "HOT" ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
      style={{
        background: "rgba(8,12,16,0.82)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,107,53,0.55)",
        color: "#FF6B35",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      🔥 HOT
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
      style={{
        background: "rgba(8,12,16,0.82)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(88,166,255,0.55)",
        color: "#58A6FF",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      MATCH
    </span>
  );
}

function PriceDropBadge({ amount }: { amount: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
      style={{
        background: "rgba(8,12,16,0.82)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(34,197,94,0.55)",
        color: "#22C55E",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      🔻 {formatPriceDrop(amount)}
    </span>
  );
}

export function ListingCard({
  record,
  index = 0,
  isBookmarked = false,
  onToggleBookmark,
  showSoldBanner = false,
}: ListingCardProps) {
  const { listing, sentAt } = record;
  const photoUrl = listing.photos?.[0];
  const shortAddress = listing.address.replace(/,\s*Frisco,?\s*TX\s*\d*/i, "").trim();
  const timeAgo = formatDistanceToNow(new Date(sentAt), { addSuffix: true });
  const pricePerSqft =
    listing.pricePerSqft ??
    (listing.sqft > 0 ? Math.round(listing.price / listing.sqft) : null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.07 }}
      className="rounded-xl overflow-hidden group"
      style={{
        background: "#141C16",
        border: "1px solid #21262D",
        transition: "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
        opacity: showSoldBanner ? 0.85 : 1,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "#30363D";
        el.style.transform = "translateY(-1px)";
        el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "#21262D";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
      aria-label={`Listing: ${listing.address}`}
    >
      {/* Photo */}
      <div
        className="relative h-40 overflow-hidden"
        style={{ background: "#1A2B1C" }}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={listing.address}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "#21262D" }}
            >
              <span className="text-lg">🏠</span>
            </div>
          </div>
        )}
        {/* Bottom gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(22,27,34,0.7) 0%, transparent 50%)",
          }}
        />

        {/* SOLD banner */}
        {showSoldBanner && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(180,28,28,0.82)", zIndex: 10 }}
          >
            <span
              className="font-black tracking-widest text-white text-xl"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", letterSpacing: "0.12em" }}
            >
              HOME SOLD
            </span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1.5" style={{ zIndex: 5 }}>
          <TierBadge tier={listing.alertTier} />
          {listing.priceDrop && (
            <PriceDropBadge amount={listing.priceDrop.amount} />
          )}
        </div>
        <div className="absolute top-2 right-2" style={{ zIndex: 5 }}>
          <ScoreBadge score={listing.aiScore} tier={listing.alertTier} />
        </div>

        {/* Bookmark star */}
        {onToggleBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(listing);
            }}
            className="absolute bottom-2 right-2"
            style={{ zIndex: 5 }}
            aria-label={isBookmarked ? "Remove bookmark" : "Save home"}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: isBookmarked
                  ? "rgba(57,211,83,0.2)"
                  : "rgba(13,17,23,0.7)",
                border: isBookmarked
                  ? "1px solid rgba(57,211,83,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(4px)",
                transition: "background 200ms ease, border-color 200ms ease",
              }}
            >
              <Star
                size={13}
                fill={isBookmarked ? "#39D353" : "none"}
                stroke={isBookmarked ? "#39D353" : "#8B949E"}
                strokeWidth={2}
              />
            </motion.div>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Address & Price */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <h3
            className="text-sm font-medium truncate flex-1"
            style={{
              color: "#E6EDF3",
              fontFamily: "var(--font-space-grotesk, sans-serif)",
            }}
          >
            {shortAddress}
          </h3>
          <div className="shrink-0 text-right">
            <div
              className="font-black text-2xl"
              style={{
                color: "#E6EDF3",
                fontFamily: "var(--font-price, var(--font-space-grotesk), sans-serif)",
                letterSpacing: "-0.02em",
              }}
            >
              ${listing.price.toLocaleString()}
            </div>
            {pricePerSqft && (
              <div
                className="text-xs"
                style={{
                  color: "#8B949E",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                ${pricePerSqft}/sqft
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center text-xs mb-2.5"
          style={{ fontFamily: "var(--font-inter, sans-serif)" }}
        >
          <span className="flex items-center gap-1 text-content-secondary">
            <Bed size={12} className="text-content-muted w-3 h-3" />
            {listing.beds} bd
          </span>
          <span className="text-content-muted mx-0.5 select-none" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-content-secondary">
            <Bath size={12} className="text-content-muted w-3 h-3" />
            {listing.baths} ba
          </span>
          <span className="text-content-muted mx-0.5 select-none" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-content-secondary">
            <Maximize2 size={12} className="text-content-muted w-3 h-3" />
            {listing.sqft.toLocaleString()} sqft
          </span>
          <span className="text-content-muted mx-0.5 select-none" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-content-secondary">
            <Calendar size={12} className="text-content-muted w-3 h-3" />
            {listing.yearBuilt}
          </span>
        </div>

        {/* AI Reason */}
        <p
          className="text-xs leading-relaxed line-clamp-2 mb-3"
          style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
        >
          {listing.aiReason}
        </p>

        {/* Highlights */}
        {listing.aiHighlights.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.aiHighlights.slice(0, 3).map((h, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{
                  background: "rgba(57,211,83,0.06)",
                  border: "1px solid rgba(57,211,83,0.15)",
                  color: "#39D353",
                  fontFamily: "var(--font-inter, sans-serif)",
                  opacity: 0.85,
                }}
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2.5"
          style={{ borderTop: "1px solid #21262D" }}
        >
          <span
            className="text-[11px]"
            style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            {timeAgo}
          </span>
          <a
            href={listing.zillowUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium transition-colors duration-150 underline-offset-2 hover:underline"
            style={{ color: "#006AFF", fontFamily: "var(--font-inter, sans-serif)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#0041D9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#006AFF")}
            aria-label={`View ${listing.address} on Zillow`}
          >
            View on Zillow
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </motion.article>
  );
}
