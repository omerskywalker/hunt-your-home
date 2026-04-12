"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, ArrowLeft, FlaskConical, TrendingDown, Filter, Brain, Zap } from "lucide-react";
import { format } from "date-fns";
import { ScanRecord } from "@/lib/types";

const MOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";
const MOCK_KEY = "hyh_mock_mode";

function CollapsibleStep({
  title,
  count,
  icon,
  isExpanded,
  onToggle,
  children,
  accent,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl border"
      style={{
        background: "#141C16",
        border: `1px solid ${accent && count > 0 ? "rgba(57,211,83,0.2)" : "#21262D"}`,
        borderTop: accent && count > 0 ? "2px solid #39D353" : "2px solid #21262D",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-opacity-50"
        style={{ background: "transparent" }}
      >
        <div className="shrink-0">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <div className="shrink-0">{icon}</div>
        <div className="flex-1">
          <span
            className="font-semibold text-base"
            style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            {title}
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold"
          style={{
            background: accent && count > 0 ? "rgba(57,211,83,0.1)" : "rgba(75,85,99,0.1)",
            color: accent && count > 0 ? "#39D353" : "#8B949E",
            fontFamily: "var(--font-space-grotesk, sans-serif)",
          }}
        >
          {count}
        </div>
      </button>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          style={{ borderTop: "1px solid #21262D" }}
        >
          <div className="p-4 pt-3">
            {children}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ListingRow({ zpid, reason, score }: { zpid: string; reason?: string; score?: number }) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg"
      style={{ background: "#0D1510", border: "1px solid #21262D" }}
    >
      <span
        className="font-mono text-sm"
        style={{ color: "#8B949E", fontFamily: "var(--font-mono, monospace)" }}
      >
        {zpid}
      </span>
      {reason && (
        <span
          className="text-sm"
          style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}
        >
          {reason}
        </span>
      )}
      {score !== undefined && (
        <div
          className="px-2 py-1 rounded text-sm font-bold"
          style={{
            background: score >= 6 ? "rgba(57,211,83,0.1)" : "rgba(255,107,53,0.1)",
            color: score >= 6 ? "#39D353" : "#FF6B35",
            fontFamily: "var(--font-space-grotesk, sans-serif)",
          }}
        >
          {score}/10
        </div>
      )}
    </div>
  );
}

export default function ScanDebugPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.scanId as string;
  
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    found: false,
    deduped: false,
    hardFiltered: false,
    scored: false,
    alerted: false,
  });

  useEffect(() => {
    if (!MOCK_ENABLED) return;
    setMockMode(localStorage.getItem(MOCK_KEY) === "true");
  }, []);

  useEffect(() => {
    async function fetchScan() {
      try {
        if (MOCK_ENABLED && mockMode) {
          // Create mock scan with funnel data for testing
          const mockScan: ScanRecord = {
            id: scanId,
            runAt: new Date().toISOString(),
            listingsFound: 45,
            newListings: 12,
            matchedListings: 3,
            alertsSent: 3,
            durationMs: 8500,
            funnel: {
              found: 45,
              deduped: 42,
              hardFiltered: [
                { zpid: "12345", reason: "Only 2 beds (need 3+)" },
                { zpid: "67890", reason: "Above max price ($700,000)" },
                { zpid: "11111", reason: "Built in 1985 (need 1990+)" },
                { zpid: "22222", reason: "HOA $400/mo (max $200/mo)" },
              ],
              scored: [
                { zpid: "33333", score: 8.2 },
                { zpid: "44444", score: 7.1 },
                { zpid: "55555", score: 6.8 },
                { zpid: "66666", score: 4.2 },
                { zpid: "77777", score: 3.5 },
              ],
              alerted: ["33333", "44444", "55555"],
            },
          };
          setScan(mockScan);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/history/${scanId}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || "Failed to load scan record");
          return;
        }
        
        setScan(data.data);
      } catch (err) {
        setError("Failed to load scan record");
      } finally {
        setLoading(false);
      }
    }

    void fetchScan();
  }, [scanId, mockMode]);

  const toggleStep = (step: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [step]: !prev[step],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: "#141C16", border: "1px solid #21262D" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <TrendingDown size={32} style={{ color: "#30363D" }} className="mb-4" />
          <p
            className="text-lg font-semibold mb-1"
            style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            {error || "Scan not found"}
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

  if (!scan.funnel) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <TrendingDown size={32} style={{ color: "#30363D" }} className="mb-4" />
          <p
            className="text-lg font-semibold mb-1"
            style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            No debug data available
          </p>
          <p
            className="text-sm mb-4"
            style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            This scan was run before debug tracking was enabled.
          </p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
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

  const timeExact = format(new Date(scan.runAt), "MMM d, yyyy 'at' h:mm a");
  const durationSec = (scan.durationMs / 1000).toFixed(1);

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
              Why No Alert?
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              {timeExact} • {durationSec}s
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

      {/* Funnel steps */}
      <div className="space-y-3">
        <CollapsibleStep
          title="Found listings"
          count={scan.funnel.found}
          icon={<TrendingDown size={16} style={{ color: "#8B949E" }} />}
          isExpanded={expandedSteps.found}
          onToggle={() => toggleStep("found")}
        >
          <p
            className="text-sm"
            style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            Total listings scraped from Zillow across all search areas.
          </p>
        </CollapsibleStep>

        <CollapsibleStep
          title="After deduplication"
          count={scan.funnel.deduped}
          icon={<TrendingDown size={16} style={{ color: "#8B949E" }} />}
          isExpanded={expandedSteps.deduped}
          onToggle={() => toggleStep("deduped")}
        >
          <p
            className="text-sm"
            style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            After removing already-seen listings, dismissed listings, and filtering for new or price-dropped properties.
          </p>
        </CollapsibleStep>

        <CollapsibleStep
          title="Hard filter rejections"
          count={scan.funnel.hardFiltered.length}
          icon={<Filter size={16} style={{ color: "#FF6B35" }} />}
          isExpanded={expandedSteps.hardFiltered}
          onToggle={() => toggleStep("hardFiltered")}
        >
          {scan.funnel.hardFiltered.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              All listings passed the hard filters (price, beds, baths, sqft, year built, HOA).
            </p>
          ) : (
            <div className="space-y-2">
              {scan.funnel.hardFiltered.map((item, i) => (
                <ListingRow key={i} zpid={item.zpid} reason={item.reason} />
              ))}
            </div>
          )}
        </CollapsibleStep>

        <CollapsibleStep
          title="AI scored listings"
          count={scan.funnel.scored.length}
          icon={<Brain size={16} style={{ color: "#58A6FF" }} />}
          isExpanded={expandedSteps.scored}
          onToggle={() => toggleStep("scored")}
          accent
        >
          {scan.funnel.scored.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              No listings made it through hard filters to be scored by AI.
            </p>
          ) : (
            <div className="space-y-2">
              {scan.funnel.scored
                .sort((a, b) => b.score - a.score)
                .map((item, i) => (
                  <ListingRow key={i} zpid={item.zpid} score={item.score} />
                ))}
            </div>
          )}
        </CollapsibleStep>

        <CollapsibleStep
          title="Sent alerts"
          count={scan.funnel.alerted.length}
          icon={<Zap size={16} style={{ color: "#39D353" }} />}
          isExpanded={expandedSteps.alerted}
          onToggle={() => toggleStep("alerted")}
          accent
        >
          {scan.funnel.alerted.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              No listings scored above your alert threshold to trigger notifications.
            </p>
          ) : (
            <div className="space-y-2">
              {scan.funnel.alerted.map((zpid, i) => (
                <ListingRow key={i} zpid={zpid} />
              ))}
            </div>
          )}
        </CollapsibleStep>
      </div>
    </div>
  );
}