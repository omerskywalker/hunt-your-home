export type ItemStatus = "not-started" | "in-progress" | "done" | "paused";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: ItemStatus;
  branch?: string;
  pr?: number;
  tests: boolean;
}

export interface RoadmapBatch {
  number: number;
  title: string;
  summary: string;
  branchPrefix: string;
  items: RoadmapItem[];
}

export const ROADMAP: RoadmapBatch[] = [
  {
    number: 1,
    title: "Foundation & Mobile",
    branchPrefix: "feat/batch-1",
    summary:
      "Fix reliability gaps and make the app usable on any device before layering on new features. No external API dependencies — purely internal improvements.",
    items: [
      {
        id: "1.1",
        title: "Mobile Responsiveness",
        description:
          "Sidebar → bottom nav on mobile. Stats cards stack vertically. Listing cards reflow to single-column. Settings inputs are touch-friendly. Target: fully usable at 390px.",
        status: "not-started",
        tests: false,
      },
      {
        id: "1.2",
        title: "Rate Limiting on /api/scan-now",
        description:
          "Redis counter (hyh:scan-ratelimit:<date>) with max 10 manual scans/day. Returns clear error with remaining count.",
        status: "not-started",
        tests: false,
      },
      {
        id: "1.3",
        title: "Seen-IDs TTL Cleanup",
        description:
          "Prune hyh:seen-ids entries older than 90 days on each scan to prevent unbounded Redis growth.",
        status: "not-started",
        tests: false,
      },
      {
        id: "1.4",
        title: "Apify Health Monitoring",
        description:
          "Alert via email if listingsFound === 0 for 2+ consecutive scans. Structured error logging for Vercel log drains.",
        status: "not-started",
        tests: false,
      },
    ],
  },
  {
    number: 2,
    title: "Search Intelligence",
    branchPrefix: "feat/batch-2",
    summary:
      "Improve the core search and filtering quality. Highest-value improvements for the primary use case — directly increase signal-to-noise ratio of alerts.",
    items: [
      {
        id: "2.1",
        title: "Price Drop Alerts",
        description:
          "Track price history per zpid. Re-score and alert on drops ≥ 2% even for already-seen listings. UI badge: 🔻 -$15k.",
        status: "not-started",
        tests: false,
      },
      {
        id: "2.2",
        title: "Days on Market Scoring Factor",
        description:
          "Pass daysOnMarket into AI prompt with context. Apply -1 score floor for listings 60+ days on market post-AI.",
        status: "not-started",
        tests: false,
      },
      {
        id: "2.3",
        title: "Dismiss Action",
        description:
          "✕ Dismiss button on cards. Dismissed zpids stored in hyh:dismissed-ids. Permanently excluded from re-alerting, even on price drops.",
        status: "not-started",
        tests: false,
      },
      {
        id: "2.4",
        title: "Multi-Area Watching",
        description:
          "Watch multiple search areas simultaneously. Store as searchAreas: string[] in preferences. One Apify call per area, deduplicated by zpid before scoring.",
        status: "not-started",
        tests: false,
      },
    ],
  },
  {
    number: 3,
    title: "Notifications",
    branchPrefix: "feat/batch-3",
    summary:
      "Close the latency gap and give users more control over when and how they hear about matches. A HOT listing sitting unseen for 6 hours is a real problem.",
    items: [
      {
        id: "3.1",
        title: "SMS / Push for HOT Listings",
        description:
          "ntfy.sh push notifications for HOT-tier listings. User provides topic in Settings. Twilio SMS as secondary option behind feature flag.",
        status: "not-started",
        tests: false,
      },
      {
        id: "3.2",
        title: "Digest Cadence Control",
        description:
          "Per-tier cadence in preferences: HOT → immediate, MATCH → daily digest at chosen hour, all → weekly summary. Separate /api/digest cron.",
        status: "not-started",
        tests: false,
      },
      {
        id: "3.3",
        title: '"Why No Alert?" Debug View',
        description:
          "Page /history/[scanId] showing full funnel: found → deduped → hard-filtered (with reason) → AI-scored → alerted. Diagnose why a listing didn't trigger.",
        status: "not-started",
        tests: false,
      },
    ],
  },
  {
    number: 4,
    title: "UI & Detail",
    branchPrefix: "feat/batch-4",
    summary:
      "Turn the app from an alert dashboard into a full home-buying decision tool. These features increase time-on-app and make saved listings useful during the buying process.",
    items: [
      {
        id: "4.1",
        title: "Listing Detail Page",
        description:
          "Internal /listings/[zpid] with photo gallery, AI breakdown, DOM timeline, price history chart (Recharts), and Zillow link.",
        status: "not-started",
        tests: false,
      },
      {
        id: "4.2",
        title: "Notes on Bookmarks",
        description:
          "Free-text notes (500 char) on bookmarked listings. Editable inline on Bookmarks page and detail page. Stored in KV.",
        status: "not-started",
        tests: false,
      },
      {
        id: "4.3",
        title: "Comparison Mode",
        description:
          "Select 2–3 listings for side-by-side comparison drawer. Price, sqft, beds, baths, HOA, AI score, highlights. Screenshot export via html2canvas.",
        status: "not-started",
        tests: false,
      },
      {
        id: "4.4",
        title: "Map View",
        description:
          "Toggle card grid → Mapbox GL map on Alerts and Bookmarks pages. Pins colored by tier. Clicking pin opens listing detail.",
        status: "not-started",
        tests: false,
      },
    ],
  },
  {
    number: 5,
    title: "AI Enhancement",
    branchPrefix: "feat/batch-5",
    summary:
      "Make AI scores smarter and more transparent. These require the most prompt engineering and come last once the rest of the stack is stable.",
    items: [
      {
        id: "5.1",
        title: "Comps-Based Scoring Context",
        description:
          "Compute neighborhood median price/sqft and average DOM from the scan batch, pass as ground truth into the scoring prompt.",
        status: "not-started",
        tests: false,
      },
      {
        id: "5.2",
        title: "Deal-Breaker Weighting",
        description:
          "dealBreakers: string[] in preferences. AI docks 2 points per matched deal-breaker. Tag-input UI in Settings under AI Preferences.",
        status: "not-started",
        tests: false,
      },
      {
        id: "5.3",
        title: "Score History Tracking",
        description:
          "Store AI score per zpid over time (hyh:score-history:<zpid>). Surface as sparkline on detail page and comparison view.",
        status: "not-started",
        tests: false,
      },
      {
        id: "5.4",
        title: "Full AI Reasoning Panel",
        description:
          "Expose complete AI reasoning text on cards (collapsed by default). Add aiReasoning: string to scored listing type, store in KV.",
        status: "not-started",
        tests: false,
      },
    ],
  },
];

export const REPO = "omerskywalker/hunt-your-home";

export function getBatchProgress(batch: RoadmapBatch) {
  const total = batch.items.length;
  const done = batch.items.filter((i) => i.status === "done").length;
  const inProgress = batch.items.filter((i) => i.status === "in-progress").length;
  return { total, done, inProgress };
}

export function getOverallProgress() {
  const allItems = ROADMAP.flatMap((b) => b.items);
  const total = allItems.length;
  const done = allItems.filter((i) => i.status === "done").length;
  return { total, done, pct: Math.round((done / total) * 100) };
}
