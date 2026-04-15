"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ExternalLink, 
  Bed, 
  Bath, 
  Maximize2, 
  Calendar, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { AlertRecord, PriceHistoryEntry, AIScoredListing } from "@/lib/types";
import { MOCK_ALERTS } from "@/lib/mock-data";

const MOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";
const MOCK_KEY = "hyh_mock_mode";

function PhotoCarousel({ photos, address }: { photos: string[]; address: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos.length) {
    return (
      <div 
        className="h-96 flex items-center justify-center"
        style={{ background: "#1A2B1C" }}
      >
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center"
          style={{ background: "#21262D" }}
        >
          <span className="text-3xl">🏠</span>
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
  };

  return (
    <div className="relative h-96 overflow-hidden rounded-xl">
      <Image
        src={photos[currentIndex]}
        alt={`${address} - Photo ${currentIndex + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 800px"
        unoptimized
      />
      
      {photos.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ 
              background: "rgba(13,17,23,0.8)", 
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)"
            }}
          >
            <ChevronLeft size={20} style={{ color: "#E6EDF3" }} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ 
              background: "rgba(13,17,23,0.8)", 
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)"
            }}
          >
            <ChevronRight size={20} style={{ color: "#E6EDF3" }} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  background: index === currentIndex ? "#39D353" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ScoreBadge({ score, tier }: { score: number; tier: "HOT" | "MATCH" }) {
  const isHot = tier === "HOT";
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold"
      style={{
        background: "rgba(8,12,16,0.82)",
        backdropFilter: "blur(6px)",
        borderColor: isHot ? "rgba(57,211,83,0.5)" : "rgba(88,166,255,0.5)",
        color: isHot ? "#39D353" : "#58A6FF",
      }}
    >
      <span
        className="font-normal text-xs uppercase tracking-wide"
        style={{ opacity: 0.7, fontFamily: "var(--font-inter, sans-serif)" }}
      >
        AI Score
      </span>
      <span style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16 }}>
        {score}/10
      </span>
    </div>
  );
}

function TierBadge({ tier }: { tier: "HOT" | "MATCH" }) {
  return tier === "HOT" ? (
    <span
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold tracking-wider"
      style={{
        background: "rgba(8,12,16,0.82)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,107,53,0.55)",
        color: "#FF6B35",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      🔥 HOT LISTING
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold tracking-wider"
      style={{
        background: "rgba(8,12,16,0.82)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(88,166,255,0.55)",
        color: "#58A6FF",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      ✦ MATCH
    </span>
  );
}

function PriceHistoryChart({ data }: { data: PriceHistoryEntry[] }) {
  if (!data.length) return null;

  const chartData = data.map(entry => ({
    date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price: entry.price,
  }));

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#8B949E" }}
          />
          <YAxis 
            hide 
          />
          <Tooltip
            contentStyle={{
              background: "#141C16",
              border: "1px solid #21262D",
              borderRadius: "8px",
              color: "#E6EDF3",
              fontSize: "12px",
            }}
            formatter={(value) => [`$${(value as number).toLocaleString()}`, "Price"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#39D353"
            strokeWidth={2}
            dot={{ fill: "#39D353", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 4, stroke: "#39D353", strokeWidth: 2, fill: "#141C16" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zpid = params.zpid as string;
  
  const [alert, setAlert] = useState<AlertRecord | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    if (!MOCK_ENABLED) return;
    setMockMode(localStorage.getItem(MOCK_KEY) === "true");
  }, []);

  useEffect(() => {
    async function fetchListing() {
      try {
        if (MOCK_ENABLED && mockMode) {
          const mockAlert = MOCK_ALERTS.find(a => a.listing.id === zpid);
          if (mockAlert) {
            setAlert(mockAlert);
            // Mock price history
            setPriceHistory([
              { price: mockAlert.listing.price + 15000, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
              { price: mockAlert.listing.price + 8000, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
              { price: mockAlert.listing.price, date: new Date().toISOString() },
            ]);
          } else {
            setError("Listing not found");
          }
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/listings/${zpid}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || "Failed to load listing");
          return;
        }
        
        setAlert(data.data.alert);
        setPriceHistory(data.data.priceHistory || []);
      } catch (err) {
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    }

    void fetchListing();
  }, [zpid, mockMode]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="h-96 rounded-xl animate-pulse" style={{ background: "#141C16" }} />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-4 rounded animate-pulse"
                style={{ background: "#141C16", width: `${[100, 80, 60, 90, 40][i - 1]}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <span className="text-6xl mb-4">🏠</span>
          <p
            className="text-lg font-semibold mb-1"
            style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            {error || "Listing not found"}
          </p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm"
            style={{
              background: "#141C16",
              border: "1px solid #21262D",
              color: "#8B949E",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            <ArrowLeft size={14} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const { listing, sentAt } = alert;
  const shortAddress = listing.address.replace(/,\s*Frisco,?\s*TX\s*\d*/i, "").trim();
  const timeAgo = formatDistanceToNow(new Date(sentAt), { addSuffix: true });
  const pricePerSqft = listing.pricePerSqft ?? (listing.sqft > 0 ? Math.round(listing.price / listing.sqft) : null);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div
        className="-mx-6 -mt-6 px-6 py-4 mb-6 flex items-center justify-between"
        style={{ background: "#0D1510", borderBottom: "1px solid #21262D" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-opacity-50"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <ArrowLeft size={16} style={{ color: "#8B949E" }} />
          </button>
          <div className="w-1 h-5 rounded-full" style={{ background: "#39D353" }} />
          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "#E6EDF3" }}
            >
              Listing Details
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              {shortAddress}
            </p>
          </div>
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

      <div className="space-y-8">
        {/* Photo carousel */}
        <PhotoCarousel photos={listing.photos} address={listing.address} />

        {/* Price and badges */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="font-black text-4xl mb-2"
              style={{
                color: "#E6EDF3",
                fontFamily: "var(--font-space-grotesk, sans-serif)",
                letterSpacing: "-0.02em",
              }}
            >
              ${listing.price.toLocaleString()}
            </div>
            {pricePerSqft && (
              <div
                className="text-lg"
                style={{
                  color: "#8B949E",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                ${pricePerSqft}/sqft
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3 items-end">
            <TierBadge tier={listing.alertTier} />
            <ScoreBadge score={listing.aiScore} tier={listing.alertTier} />
          </div>
        </div>

        {/* Address */}
        <div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            {listing.address}
          </h2>
          <p
            className="text-sm"
            style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            First seen {timeAgo}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ background: "#141C16", border: "1px solid #21262D" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Bed size={16} style={{ color: "#8B949E" }} />
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                Bedrooms
              </span>
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              {listing.beds}
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ background: "#141C16", border: "1px solid #21262D" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Bath size={16} style={{ color: "#8B949E" }} />
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                Bathrooms
              </span>
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              {listing.baths}
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ background: "#141C16", border: "1px solid #21262D" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Maximize2 size={16} style={{ color: "#8B949E" }} />
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                Square Feet
              </span>
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              {listing.sqft.toLocaleString()}
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ background: "#141C16", border: "1px solid #21262D" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} style={{ color: "#8B949E" }} />
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                Year Built
              </span>
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              {listing.yearBuilt}
            </div>
          </div>
        </div>

        {/* Additional details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ background: "#141C16", border: "1px solid #21262D" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} style={{ color: "#8B949E" }} />
              <span
                className="text-sm font-medium"
                style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                Days on Market
              </span>
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              {listing.daysOnMarket} days
            </div>
          </div>

          {listing.hoaMonthly && (
            <div
              className="p-4 rounded-lg"
              style={{ background: "#141C16", border: "1px solid #21262D" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} style={{ color: "#8B949E" }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}
                >
                  HOA Monthly
                </span>
              </div>
              <div
                className="text-xl font-bold"
                style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                ${listing.hoaMonthly.toLocaleString()}/mo
              </div>
            </div>
          )}
        </div>

        {/* Price history */}
        {priceHistory.length > 1 && (
          <div
            className="p-6 rounded-lg"
            style={{ background: "#141C16", border: "1px solid #21262D" }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              Price History
            </h3>
            <PriceHistoryChart data={priceHistory} />
          </div>
        )}

        {/* AI Analysis */}
        <div
          className="p-6 rounded-lg"
          style={{ background: "#141C16", border: "1px solid #21262D" }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            AI Analysis
          </h3>
          
          {listing.aiHighlights.length > 0 && (
            <div className="mb-6">
              <h4
                className="text-sm font-medium mb-3"
                style={{ color: "#39D353", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                ✓ Highlights
              </h4>
              <div className="space-y-2">
                {listing.aiHighlights.map((highlight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}
                  >
                    <span style={{ color: "#39D353", marginTop: "2px" }}>•</span>
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {listing.aiConcerns.length > 0 && (
            <div className="mb-6">
              <h4
                className="text-sm font-medium mb-3"
                style={{ color: "#FF6B35", fontFamily: "var(--font-inter, sans-serif)" }}
              >
                ⚠ Concerns
              </h4>
              <div className="space-y-2">
                {listing.aiConcerns.map((concern, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}
                  >
                    <span style={{ color: "#FF6B35", marginTop: "2px" }}>•</span>
                    {concern}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4
              className="text-sm font-medium mb-3"
              style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              Full Analysis
            </h4>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              {listing.aiReason}
            </p>
          </div>
        </div>

        {/* Zillow link */}
        <div className="flex justify-center">
          <a
            href={listing.zillowUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-scan flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
          >
            View on Zillow
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}