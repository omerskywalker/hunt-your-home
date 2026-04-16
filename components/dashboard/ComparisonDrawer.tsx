"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Home } from "lucide-react";
import Image from "next/image";
import { AIScoredListing } from "@/lib/types";

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  listings: AIScoredListing[];
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function calculatePricePerSqft(listing: AIScoredListing): number | null {
  if (listing.pricePerSqft) return listing.pricePerSqft;
  return listing.sqft > 0 ? Math.round(listing.price / listing.sqft) : null;
}

function ComparisonColumn({ listing }: { listing: AIScoredListing }) {
  const shortAddress = listing.address.replace(/,\s*Frisco,?\s*TX\s*\d*/i, "").trim();
  const pricePerSqft = calculatePricePerSqft(listing);
  const photoUrl = listing.photos?.[0];

  return (
    <div className="flex-1 min-w-0">
      {/* Photo */}
      <div
        className="relative h-48 overflow-hidden rounded-lg mb-4"
        style={{ background: "#1A2B1C" }}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={listing.address}
            fill
            className="object-cover"
            sizes="400px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: "#21262D" }}
            >
              <Home size={20} style={{ color: "#8B949E" }} />
            </div>
          </div>
        )}
      </div>

      {/* Address */}
      <h3
        className="text-lg font-semibold mb-4 leading-tight"
        style={{
          color: "#E6EDF3",
          fontFamily: "var(--font-space-grotesk, sans-serif)",
        }}
      >
        {shortAddress}
      </h3>

      {/* Comparison data */}
      <div className="space-y-3">
        <ComparisonRow label="Price" value={formatCurrency(listing.price)} />
        <ComparisonRow 
          label="Price/sqft" 
          value={pricePerSqft ? `$${pricePerSqft}` : "—"} 
        />
        <ComparisonRow label="Beds" value={listing.beds.toString()} />
        <ComparisonRow label="Baths" value={listing.baths.toString()} />
        <ComparisonRow label="Sqft" value={listing.sqft.toLocaleString()} />
        <ComparisonRow label="Year Built" value={listing.yearBuilt.toString()} />
        <ComparisonRow 
          label="HOA" 
          value={listing.hoaMonthly ? `$${listing.hoaMonthly}/mo` : "—"} 
        />
        <ComparisonRow label="AI Score" value={`${listing.aiScore}/10`} />
        
        {/* Top 2 highlights */}
        <div>
          <div
            className="text-sm font-medium mb-2"
            style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            Highlights
          </div>
          <div className="space-y-1">
            {listing.aiHighlights.slice(0, 2).map((highlight, i) => (
              <div
                key={i}
                className="text-xs px-2 py-1 rounded-md"
                style={{
                  background: "rgba(57,211,83,0.06)",
                  border: "1px solid rgba(57,211,83,0.15)",
                  color: "#39D353",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                {highlight}
              </div>
            ))}
            {listing.aiHighlights.length === 0 && (
              <div
                className="text-xs"
                style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                No highlights
              </div>
            )}
          </div>
        </div>

        {/* Top concern */}
        <div>
          <div
            className="text-sm font-medium mb-2"
            style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            Top Concern
          </div>
          <div
            className="text-xs px-2 py-1 rounded-md"
            style={{
              background: listing.aiConcerns.length > 0 ? "rgba(255,107,53,0.06)" : "rgba(72,79,88,0.06)",
              border: listing.aiConcerns.length > 0 ? "1px solid rgba(255,107,53,0.15)" : "1px solid rgba(72,79,88,0.15)",
              color: listing.aiConcerns.length > 0 ? "#FF6B35" : "#484F58",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            {listing.aiConcerns.length > 0 ? listing.aiConcerns[0] : "No concerns"}
          </div>
        </div>
      </div>

      {/* Zillow link */}
      <div className="mt-6 pt-4" style={{ borderTop: "1px solid #21262D" }}>
        <a
          href={listing.zillowUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-150"
          style={{ 
            color: "#006AFF", 
            fontFamily: "var(--font-inter, sans-serif)",
            background: "rgba(0,106,255,0.06)",
            border: "1px solid rgba(0,106,255,0.15)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = "rgba(0,106,255,0.1)";
            el.style.color = "#0041D9";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = "rgba(0,106,255,0.06)";
            el.style.color = "#006AFF";
          }}
        >
          View on Zillow
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

function ComparisonRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span
        className="text-sm"
        style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}
      >
        {value}
      </span>
    </div>
  );
}

export function ComparisonDrawer({ isOpen, onClose, listings }: ComparisonDrawerProps) {
  if (listings.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-6xl overflow-auto"
            style={{ background: "#0D1510" }}
          >
            <div className="sticky top-0 z-10 p-4" style={{ background: "#0D1510", borderBottom: "1px solid #21262D" }}>
              <div className="flex items-center justify-between">
                <h2
                  className="text-xl font-semibold"
                  style={{
                    color: "#E6EDF3",
                    fontFamily: "var(--font-space-grotesk, sans-serif)",
                  }}
                >
                  Compare Homes ({listings.length})
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
                  style={{ 
                    background: "#141C16", 
                    border: "1px solid #21262D",
                    color: "#8B949E",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = "#1A2B1C";
                    el.style.borderColor = "#30363D";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = "#141C16";
                    el.style.borderColor = "#21262D";
                  }}
                  aria-label="Close comparison"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${listings.length}, 1fr)` }}>
                {listings.map((listing) => (
                  <ComparisonColumn key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}