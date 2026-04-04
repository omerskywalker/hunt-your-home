"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";
import { PriceRange } from "./PriceRange";
import { BedsSelector } from "./BedsSelector";
import { ToggleFilter } from "./ToggleFilter";

const BED_OPTIONS = [
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
  { label: "5+", value: 5 },
];

const BATH_OPTIONS = [
  { label: "1+",   value: 1 },
  { label: "1.5+", value: 1.5 },
  { label: "2+",   value: 2 },
  { label: "2.5+", value: 2.5 },
  { label: "3+",   value: 3 },
];

interface FilterPanelProps {
  initialPrefs?: UserPreferences;
  onPrefsChange?: (prefs: UserPreferences) => void;
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  color: "#484F58",
  fontFamily: "var(--font-inter, sans-serif)",
  display: "block",
  marginBottom: 10,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "#0D1510",
  border: "1px solid #21262D",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  color: "#E6EDF3",
  fontFamily: "var(--font-inter, sans-serif)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid #21262D",
  marginBottom: 20,
  paddingBottom: 20,
};

export function FilterPanel({ initialPrefs, onPrefsChange }: FilterPanelProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(initialPrefs ?? DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (initialPrefs) setPrefs(initialPrefs);
  }, [initialPrefs]);

  const savePrefs = useCallback(async (newPrefs: UserPreferences) => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
      const json = await res.json() as { success: boolean };
      if (json.success) {
        toast.success("Preferences saved");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onPrefsChange?.(newPrefs);
      } else {
        toast.error("Failed to save preferences");
      }
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }, [onPrefsChange]);

  function updatePrefs(updates: Partial<UserPreferences>) {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void savePrefs(next); }, 500);
  }

  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; }
  }, []);

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "#39D353";
    e.target.style.boxShadow = "0 0 0 1px rgba(57,211,83,0.3)";
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "#21262D";
    e.target.style.boxShadow = "none";
  }

  return (
    <aside
      className="rounded-xl custom-scrollbar"
      style={{
        background: "#141C16",
        border: "1px solid #21262D",
        padding: 20,
        maxHeight: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
      aria-label="Search criteria"
    >
      {/* Panel header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#39D353" }} />
          <h2
            className="font-semibold text-base"
            style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            Search Criteria
          </h2>
        </div>
        <div className="h-6 flex items-center mt-0.5">
          {saving && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}>
              <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "#39D353" }} />
              saving…
            </span>
          )}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#39D353", fontFamily: "var(--font-inter, sans-serif)" }}>
              <Check size={11} /> saved
            </span>
          )}
        </div>
      </div>
      <p className="ml-3 mb-5" style={{ fontSize: 11, color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}>
        changes save automatically
      </p>
      <div style={{ borderTop: "1px solid #21262D", marginBottom: 20 }} />

      {/* Price Range */}
      <div style={DIVIDER}>
        <PriceRange
          minPrice={prefs.minPrice}
          maxPrice={prefs.maxPrice}
          onMinChange={(val) => updatePrefs({ minPrice: val })}
          onMaxChange={(val) => updatePrefs({ maxPrice: val })}
        />
      </div>

      {/* Beds */}
      <div style={DIVIDER}>
        <BedsSelector
          label="Bedrooms"
          value={prefs.minBeds}
          onChange={(val) => updatePrefs({ minBeds: val })}
          options={BED_OPTIONS}
        />
      </div>

      {/* Baths */}
      <div style={DIVIDER}>
        <BedsSelector
          label="Bathrooms"
          value={prefs.minBaths}
          onChange={(val) => updatePrefs({ minBaths: val })}
          options={BATH_OPTIONS}
        />
      </div>

      {/* Min Sqft */}
      <div style={DIVIDER}>
        <span style={SECTION_LABEL}>Min Square Feet</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updatePrefs({ minSqft: Math.max(0, prefs.minSqft - 100) })}
            style={{ width: 32, height: 32, background: "#1A2B1C", border: "1px solid #21262D", borderRadius: 8, color: "#8B949E", fontSize: 16, cursor: "pointer", transition: "border-color 150ms" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#30363D")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#21262D")}
            aria-label="Decrease min sqft"
          >−</button>
          <input
            type="number"
            value={prefs.minSqft}
            min={0}
            step={100}
            onChange={(e) => updatePrefs({ minSqft: Math.max(0, Number(e.target.value)) })}
            style={{ ...INPUT, textAlign: "center" }}
            onFocus={focusInput}
            onBlur={blurInput}
            aria-label="Minimum square feet"
          />
          <button
            onClick={() => updatePrefs({ minSqft: prefs.minSqft + 100 })}
            style={{ width: 32, height: 32, background: "#1A2B1C", border: "1px solid #21262D", borderRadius: 8, color: "#8B949E", fontSize: 16, cursor: "pointer", transition: "border-color 150ms" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#30363D")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#21262D")}
            aria-label="Increase min sqft"
          >+</button>
        </div>
      </div>

      {/* Min Year Built */}
      <div style={DIVIDER}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span style={SECTION_LABEL}>Min Year Built</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#39D353", fontFamily: "var(--font-mono, monospace)" }}>
            {prefs.minYearBuilt}
          </span>
        </div>
        <input
          type="range"
          min={1970}
          max={2020}
          step={1}
          value={prefs.minYearBuilt}
          onChange={(e) => updatePrefs({ minYearBuilt: Number(e.target.value) })}
          className="custom-slider w-full"
          aria-label="Minimum year built"
        />
        <div className="flex justify-between mt-1.5" style={{ fontSize: 10, color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}>
          <span>1970</span>
          <span>2020</span>
        </div>
      </div>

      {/* Max HOA */}
      <div style={DIVIDER}>
        <ToggleFilter
          label="Max HOA Limit"
          description="Filter by monthly HOA fee"
          checked={prefs.maxHoa !== null}
          onChange={(val) => updatePrefs({ maxHoa: val ? 200 : null })}
        />
        {prefs.maxHoa !== null && (
          <div className="flex items-center gap-2 mt-3">
            <span style={{ fontSize: 12, color: "#484F58" }}>$</span>
            <input
              type="number"
              value={prefs.maxHoa}
              min={0}
              step={25}
              onChange={(e) => updatePrefs({ maxHoa: Math.max(0, Number(e.target.value)) })}
              style={INPUT}
              onFocus={focusInput}
              onBlur={blurInput}
              aria-label="Maximum HOA per month"
            />
            <span style={{ fontSize: 12, color: "#484F58" }}>/mo</span>
          </div>
        )}
      </div>

      {/* AI Score Threshold */}
      <div style={DIVIDER}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span style={SECTION_LABEL}>AI Score Threshold</span>
          <div className="flex items-center gap-2" style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}>
            <span style={{ color: "#484F58" }}>min</span>
            <span style={{ color: "#39D353", fontWeight: 700 }}>{prefs.scoreThreshold}</span>
            <span style={{ color: "#484F58" }}>hot≥</span>
            <span style={{ color: "#39D353", fontWeight: 700 }}>{prefs.hotScoreThreshold}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, color: "#484F58", width: 30, fontFamily: "var(--font-inter, sans-serif)" }}>alert</span>
            <input
              type="range"
              min={1} max={10} step={1}
              value={prefs.scoreThreshold}
              onChange={(e) => updatePrefs({
                scoreThreshold: Number(e.target.value),
                hotScoreThreshold: Math.max(Number(e.target.value) + 1, prefs.hotScoreThreshold),
              })}
              className="custom-slider flex-1"
              aria-label="Minimum AI score to alert"
            />
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, color: "#484F58", width: 30, fontFamily: "var(--font-inter, sans-serif)" }}>hot</span>
            <input
              type="range"
              min={1} max={10} step={1}
              value={prefs.hotScoreThreshold}
              onChange={(e) => updatePrefs({
                hotScoreThreshold: Math.max(Number(e.target.value), prefs.scoreThreshold + 1),
              })}
              className="custom-slider flex-1"
              aria-label="Minimum AI score for HOT alert"
            />
          </div>
        </div>
      </div>

      {/* Require Garage */}
      <div style={DIVIDER}>
        <ToggleFilter
          label="Require Garage"
          description="Only show listings with garage"
          checked={prefs.requireGarage}
          onChange={(val) => updatePrefs({ requireGarage: val })}
        />
      </div>

      {/* Alert Email */}
      <div style={DIVIDER}>
        <span style={SECTION_LABEL}>Alert Email</span>
        <input
          type="email"
          value={prefs.alertEmail}
          placeholder="your@email.com"
          onChange={(e) => updatePrefs({ alertEmail: e.target.value })}
          style={{ ...INPUT, color: prefs.alertEmail ? "#E6EDF3" : "#484F58" }}
          onFocus={focusInput}
          onBlur={blurInput}
          aria-label="Alert email address"
        />
      </div>

      {/* Search Area */}
      <div>
        <span style={SECTION_LABEL}>Search Area</span>
        <input
          type="text"
          value={prefs.searchArea}
          placeholder="Frisco, TX"
          onChange={(e) => updatePrefs({ searchArea: e.target.value })}
          style={INPUT}
          onFocus={focusInput}
          onBlur={blurInput}
          aria-label="Search area"
        />
        <p className="mt-1.5" style={{ fontSize: 11, color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}>
          Limited to Zillow search areas
        </p>
      </div>
    </aside>
  );
}
