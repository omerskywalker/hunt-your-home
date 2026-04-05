"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Cookie, Cloud, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";
import {
  savePrefsToookie,
  getPrefsFromCookie,
  clearPrefsCookie,
} from "@/lib/cookie-prefs";

// ─── Shared style tokens ──────────────────────────────────
const LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "#484F58",
  fontFamily: "var(--font-inter, sans-serif)",
  display: "block",
  marginBottom: 6,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "#0D1510",
  border: "1px solid #21262D",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  color: "#E6EDF3",
  fontFamily: "var(--font-inter, sans-serif)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#141C16", border: "1px solid #21262D" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full" style={{ background: "#39D353" }} />
        <h2
          className="font-semibold text-base"
          style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          {title}
        </h2>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={LABEL}>{label}</span>
      {children}
    </div>
  );
}

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: number }>;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const sel = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="rounded-md transition-all duration-150"
            style={{
              padding: "6px 12px",
              fontSize: 13,
              fontFamily: "var(--font-inter, sans-serif)",
              cursor: "pointer",
              ...(sel
                ? { background: "#39D353", color: "#080E0A", fontWeight: 600, border: "1px solid #39D353" }
                : { background: "#1A2B1C", color: "#8B949E", border: "1px solid #21262D" }),
            }}
            onMouseEnter={(e) => {
              if (!sel) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#30363D";
                (e.currentTarget as HTMLButtonElement).style.color = "#E6EDF3";
              }
            }}
            onMouseLeave={(e) => {
              if (!sel) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#21262D";
                (e.currentTarget as HTMLButtonElement).style.color = "#8B949E";
              }
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm" style={{ color: "#E6EDF3", fontFamily: "var(--font-inter, sans-serif)" }}>
          {label}
        </div>
        {description && (
          <div className="mt-0.5" style={{ fontSize: 11, color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}>
            {description}
          </div>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex shrink-0 cursor-pointer rounded-full transition-all duration-200 touch-manipulation"
        style={{
          width: 44, height: 24, padding: 2, // Larger toggle for touch
          background: checked ? "#1A7F37" : "#30363D",
          border: checked ? "1px solid rgba(57,211,83,0.3)" : "1px solid #484F58",
          boxShadow: checked ? "0 0 8px rgba(57,211,83,0.2)" : "none",
        }}
      >
        <span
          className="inline-block rounded-full shadow transition-all duration-200"
          style={{
            width: 18, height: 18, // Larger thumb
            background: checked ? "#39D353" : "#8B949E",
            transform: checked ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}

const BED_OPTIONS  = [1,2,3,4,5].map((n) => ({ label: `${n}+`, value: n }));
const BATH_OPTIONS = [1, 1.5, 2, 2.5, 3].map((n) => ({ label: `${n}+`, value: n }));

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [cookieSaved, setCookieSaved] = useState(false);
  const [serverSaved, setServerSaved] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [source, setSource] = useState<"cookie" | "server" | "default">("default");
  const cookieTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: try cookie first, then API
  useEffect(() => {
    const cookiePrefs = getPrefsFromCookie();
    if (cookiePrefs) {
      setPrefs(cookiePrefs);
      setSource("cookie");
      return;
    }
    // Fall back to server
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((json: { data?: UserPreferences }) => {
        if (json.data) {
          setPrefs(json.data);
          setSource("server");
        }
      })
      .catch(() => {});
  }, []);

  // Whenever prefs change, auto-save to cookie immediately
  function updatePrefs(updates: Partial<UserPreferences>) {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    savePrefsToookie(next);
    setCookieSaved(true);
    if (cookieTimerRef.current) clearTimeout(cookieTimerRef.current);
    cookieTimerRef.current = setTimeout(() => setCookieSaved(false), 2000);
  }

  const syncToServer = useCallback(async () => {
    setSyncing(true);
    setServerError(false);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const json = await res.json() as { success: boolean };
      if (json.success) {
        setServerSaved(true);
        setTimeout(() => setServerSaved(false), 3000);
        toast.success("Synced to server");
      } else {
        setServerError(true);
        toast.error("Failed to sync");
      }
    } catch {
      setServerError(true);
      toast.error("Network error");
    } finally {
      setSyncing(false);
    }
  }, [prefs]);

  function handleClearCookie() {
    clearPrefsCookie();
    toast("Cookie cleared", { description: "Settings will be loaded from server next visit" });
  }

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "#39D353";
    e.target.style.boxShadow = "0 0 0 1px rgba(57,211,83,0.3)";
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "#21262D";
    e.target.style.boxShadow = "none";
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div
        className="-mx-6 -mt-6 px-6 py-4 mb-6 flex items-center justify-between"
        style={{ background: "#0D1510", borderBottom: "1px solid #21262D" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#39D353" }} />
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "#E6EDF3" }}
          >
            Settings
          </h1>
        </div>

        {/* Persistence status */}
        <div className="flex items-center gap-3">
          {cookieSaved && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "#39D353", fontFamily: "var(--font-inter, sans-serif)" }}
            >
              <Cookie size={12} />
              Saved to cookie
            </motion.div>
          )}
          {source !== "default" && (
            <span
              className="text-[11px] px-2 py-1 rounded"
              style={{
                background: "#141C16",
                border: "1px solid #21262D",
                color: "#484F58",
                fontFamily: "var(--font-inter, sans-serif)",
              }}
            >
              loaded from {source}
            </span>
          )}
        </div>
      </div>

      {/* Cookie persistence info banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 text-sm"
        style={{
          background: "rgba(57,211,83,0.04)",
          border: "1px solid rgba(57,211,83,0.15)",
          fontFamily: "var(--font-inter, sans-serif)",
        }}
      >
        <Cookie size={15} style={{ color: "#39D353", flexShrink: 0, marginTop: 1 }} />
        <div>
          <span style={{ color: "#E6EDF3", fontWeight: 500 }}>Settings auto-save to a cookie</span>
          <span style={{ color: "#8B949E" }}>
            {" "}— your preferences persist across sessions instantly, no account needed.
            Use <strong style={{ color: "#E6EDF3" }}>Sync to Server</strong> to also save them
            to your Vercel KV store (survives clearing cookies).
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── Notifications ─────────────────────────────── */}
        <Section title="Notifications">
          <Field label="Alert Email">
            <input
              type="email"
              value={prefs.alertEmail}
              placeholder="you@example.com"
              onChange={(e) => updatePrefs({ alertEmail: e.target.value })}
              style={INPUT}
              onFocus={focusInput}
              onBlur={blurInput}
              aria-label="Alert email"
            />
            <p className="mt-1.5" style={{ fontSize: 11, color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}>
              HOT listings are emailed individually. MATCH listings arrive as a digest.
            </p>
          </Field>

          <Field label="AI Score threshold">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 10, color: "#484F58", width: 30, fontFamily: "var(--font-inter, sans-serif)" }}>alert</span>
                <input
                  type="range" min={1} max={10} step={1}
                  value={prefs.scoreThreshold}
                  onChange={(e) => updatePrefs({
                    scoreThreshold: Number(e.target.value),
                    hotScoreThreshold: Math.max(Number(e.target.value) + 1, prefs.hotScoreThreshold),
                  })}
                  className="custom-slider flex-1"
                  aria-label="Alert threshold"
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#39D353", fontFamily: "var(--font-mono, monospace)", width: 20 }}>
                  {prefs.scoreThreshold}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 10, color: "#484F58", width: 30, fontFamily: "var(--font-inter, sans-serif)" }}>hot</span>
                <input
                  type="range" min={1} max={10} step={1}
                  value={prefs.hotScoreThreshold}
                  onChange={(e) => updatePrefs({
                    hotScoreThreshold: Math.max(Number(e.target.value), prefs.scoreThreshold + 1),
                  })}
                  className="custom-slider flex-1"
                  aria-label="HOT threshold"
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#39D353", fontFamily: "var(--font-mono, monospace)", width: 20 }}>
                  {prefs.hotScoreThreshold}
                </span>
              </div>
            </div>
            <p className="mt-2" style={{ fontSize: 11, color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}>
              Only listings scoring ≥ {prefs.scoreThreshold} trigger alerts. Scores ≥ {prefs.hotScoreThreshold} are flagged HOT.
            </p>
          </Field>
        </Section>

        {/* ── Search Criteria ────────────────────────────── */}
        <Section title="Search Criteria">
          <Field label="Search Area">
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
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={`Min Price`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#484F58" }}>$</span>
                <input
                  type="number"
                  value={prefs.minPrice}
                  min={0}
                  step={25000}
                  onChange={(e) => updatePrefs({ minPrice: Number(e.target.value) })}
                  style={{ ...INPUT, paddingLeft: 28 }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  aria-label="Minimum price"
                />
              </div>
            </Field>
            <Field label="Max Price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#484F58" }}>$</span>
                <input
                  type="number"
                  value={prefs.maxPrice}
                  min={0}
                  step={25000}
                  onChange={(e) => updatePrefs({ maxPrice: Number(e.target.value) })}
                  style={{ ...INPUT, paddingLeft: 28 }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  aria-label="Maximum price"
                />
              </div>
            </Field>
          </div>

          <Field label="Min Bedrooms">
            <PillGroup
              options={BED_OPTIONS}
              value={prefs.minBeds}
              onChange={(v) => updatePrefs({ minBeds: v })}
            />
          </Field>

          <Field label="Min Bathrooms">
            <PillGroup
              options={BATH_OPTIONS}
              value={prefs.minBaths}
              onChange={(v) => updatePrefs({ minBaths: v })}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Min Sqft">
              <input
                type="number"
                value={prefs.minSqft}
                min={0}
                step={100}
                onChange={(e) => updatePrefs({ minSqft: Number(e.target.value) })}
                style={INPUT}
                onFocus={focusInput}
                onBlur={blurInput}
                aria-label="Minimum square feet"
              />
            </Field>
            <Field label="Min Year Built">
              <input
                type="number"
                value={prefs.minYearBuilt}
                min={1900}
                max={2024}
                step={1}
                onChange={(e) => updatePrefs({ minYearBuilt: Number(e.target.value) })}
                style={INPUT}
                onFocus={focusInput}
                onBlur={blurInput}
                aria-label="Minimum year built"
              />
            </Field>
          </div>

          <Toggle
            label="Require Garage"
            description="Only show listings that include a garage"
            checked={prefs.requireGarage}
            onChange={(v) => updatePrefs({ requireGarage: v })}
          />

          <Toggle
            label="Max HOA Limit"
            description="Filter out listings above a monthly HOA threshold"
            checked={prefs.maxHoa !== null}
            onChange={(v) => updatePrefs({ maxHoa: v ? 200 : null })}
          />
          {prefs.maxHoa !== null && (
            <div className="flex items-center gap-2 -mt-2">
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
                aria-label="Max HOA per month"
              />
              <span style={{ fontSize: 12, color: "#484F58", whiteSpace: "nowrap" }}>/mo</span>
            </div>
          )}
        </Section>

        {/* ── Sync & persistence ────────────────────────── */}
        <Section title="Data & Persistence">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Sync to server */}
            <button
              onClick={() => void syncToServer()}
              disabled={syncing}
              className="flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-all duration-150 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                padding: "10px 20px",
                background: "#39D353",
                color: "#080E0A",
                fontFamily: "var(--font-inter, sans-serif)",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!syncing) {
                  (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(57,211,83,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {syncing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Syncing…
                </>
              ) : serverSaved ? (
                <><Check size={14} /> Synced to server</>
              ) : (
                <><Cloud size={14} /> Sync to Server</>
              )}
            </button>

            {/* Clear cookie */}
            <button
              onClick={handleClearCookie}
              className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                padding: "10px 20px",
                background: "#141C16",
                color: "#8B949E",
                border: "1px solid #21262D",
                fontFamily: "var(--font-inter, sans-serif)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#30363D";
                (e.currentTarget as HTMLButtonElement).style.color = "#E6EDF3";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#21262D";
                (e.currentTarget as HTMLButtonElement).style.color = "#8B949E";
              }}
            >
              <Cookie size={14} />
              Clear Cookie
            </button>
          </div>

          {serverError && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{
                background: "rgba(255,107,53,0.06)",
                border: "1px solid rgba(255,107,53,0.2)",
                color: "#FF6B35",
                fontFamily: "var(--font-inter, sans-serif)",
              }}
            >
              <AlertCircle size={12} />
              Server sync failed — settings are still saved in your cookie.
            </div>
          )}

          <div
            className="text-xs space-y-1.5"
            style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            <p>
              <span style={{ color: "#8B949E" }}>Cookie</span>
              {" "}— instant local persistence, 30-day expiry, no server required.
            </p>
            <p>
              <span style={{ color: "#8B949E" }}>Server sync</span>
              {" "}— saves to Vercel KV, shared across devices, survives cookie clears.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
