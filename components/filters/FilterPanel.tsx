"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SlidersHorizontal, Save } from "lucide-react";
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
  { label: "1+", value: 1 },
  { label: "1.5+", value: 1.5 },
  { label: "2+", value: 2 },
  { label: "2.5+", value: 2.5 },
  { label: "3+", value: 3 },
];

interface FilterPanelProps {
  initialPrefs?: UserPreferences;
  onPrefsChange?: (prefs: UserPreferences) => void;
}

export function FilterPanel({ initialPrefs, onPrefsChange }: FilterPanelProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(
    initialPrefs ?? DEFAULT_PREFERENCES
  );
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

  // Update from parent
  useEffect(() => {
    if (initialPrefs) setPrefs(initialPrefs);
  }, [initialPrefs]);

  const savePrefs = useCallback(async (newPrefs: UserPreferences) => {
    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
      const json = await res.json() as { success: boolean };
      if (json.success) {
        toast.success("Preferences saved");
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

    // Debounce auto-save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void savePrefs(next);
    }, 500);
  }

  // Don't auto-save on first mount
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
  }, []);

  return (
    <aside
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6"
      aria-label="Search criteria"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-zinc-500" />
            <h2 className="text-zinc-100 font-semibold text-sm">Search Criteria</h2>
          </div>
          <p className="text-[11px] text-zinc-600 mt-0.5 ml-5">
            Changes save automatically
          </p>
        </div>
        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Save size={11} className="animate-pulse" />
            Saving…
          </div>
        )}
      </div>

      {/* Price Range */}
      <PriceRange
        minPrice={prefs.minPrice}
        maxPrice={prefs.maxPrice}
        onMinChange={(val) => updatePrefs({ minPrice: val })}
        onMaxChange={(val) => updatePrefs({ maxPrice: val })}
      />

      {/* Beds */}
      <BedsSelector
        label="Bedrooms"
        value={prefs.minBeds}
        onChange={(val) => updatePrefs({ minBeds: val })}
        options={BED_OPTIONS}
      />

      {/* Baths */}
      <BedsSelector
        label="Bathrooms"
        value={prefs.minBaths}
        onChange={(val) => updatePrefs({ minBaths: val })}
        options={BATH_OPTIONS}
      />

      {/* Min Sqft */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide block">
          Min Square Feet
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              updatePrefs({ minSqft: Math.max(0, prefs.minSqft - 100) })
            }
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-lg font-medium transition-colors"
            aria-label="Decrease min sqft"
          >
            −
          </button>
          <input
            type="number"
            value={prefs.minSqft}
            min={0}
            step={100}
            onChange={(e) =>
              updatePrefs({ minSqft: Math.max(0, Number(e.target.value)) })
            }
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-center text-sm font-medium text-zinc-100 focus:outline-none focus:border-brand"
            aria-label="Minimum square feet"
          />
          <button
            onClick={() => updatePrefs({ minSqft: prefs.minSqft + 100 })}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-lg font-medium transition-colors"
            aria-label="Increase min sqft"
          >
            +
          </button>
        </div>
      </div>

      {/* Min Year Built */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Min Year Built
          </span>
          <span className="text-sm font-semibold text-zinc-100">
            {prefs.minYearBuilt}
          </span>
        </div>
        <input
          type="range"
          min={1970}
          max={2020}
          step={1}
          value={prefs.minYearBuilt}
          onChange={(e) =>
            updatePrefs({ minYearBuilt: Number(e.target.value) })
          }
          className="w-full"
          aria-label="Minimum year built"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>1970</span>
          <span>2020</span>
        </div>
      </div>

      {/* Max HOA */}
      <div className="space-y-3">
        <ToggleFilter
          label="Max HOA Limit"
          description="Filter by monthly HOA fee"
          checked={prefs.maxHoa !== null}
          onChange={(val) => updatePrefs({ maxHoa: val ? 200 : null })}
        />
        {prefs.maxHoa !== null && (
          <div className="flex items-center gap-2 ml-0">
            <span className="text-xs text-zinc-600">$</span>
            <input
              type="number"
              value={prefs.maxHoa}
              min={0}
              step={25}
              onChange={(e) =>
                updatePrefs({ maxHoa: Math.max(0, Number(e.target.value)) })
              }
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-brand"
              aria-label="Maximum HOA per month"
            />
            <span className="text-xs text-zinc-600">/mo</span>
          </div>
        )}
      </div>

      {/* AI Score Threshold */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            AI Score Threshold
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">Min</span>
            <span className="text-sm font-bold text-brand">
              {prefs.scoreThreshold}
            </span>
            <span className="text-xs text-zinc-600">Hot ≥</span>
            <span className="text-sm font-bold text-brand">
              {prefs.hotScoreThreshold}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 w-8">Alert</span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={prefs.scoreThreshold}
              onChange={(e) =>
                updatePrefs({
                  scoreThreshold: Number(e.target.value),
                  hotScoreThreshold: Math.max(
                    Number(e.target.value) + 1,
                    prefs.hotScoreThreshold
                  ),
                })
              }
              className="flex-1"
              aria-label="Minimum AI score to alert"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 w-8">Hot</span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={prefs.hotScoreThreshold}
              onChange={(e) =>
                updatePrefs({
                  hotScoreThreshold: Math.max(
                    Number(e.target.value),
                    prefs.scoreThreshold + 1
                  ),
                })
              }
              className="flex-1"
              aria-label="Minimum AI score for HOT alert"
            />
          </div>
        </div>
      </div>

      {/* Require Garage */}
      <ToggleFilter
        label="Require Garage"
        description="Only show listings with garage"
        checked={prefs.requireGarage}
        onChange={(val) => updatePrefs({ requireGarage: val })}
      />

      {/* Alert Email */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide block">
          Alert Email
        </span>
        <input
          type="email"
          value={prefs.alertEmail}
          placeholder="your@email.com"
          onChange={(e) => updatePrefs({ alertEmail: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-brand"
          aria-label="Alert email address"
        />
      </div>

      {/* Search Area */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide block">
          Search Area
        </span>
        <input
          type="text"
          value={prefs.searchArea}
          placeholder="Frisco, TX"
          onChange={(e) => updatePrefs({ searchArea: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-brand"
          aria-label="Search area"
        />
      </div>
    </aside>
  );
}
