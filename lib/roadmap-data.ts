export type ItemStatus = "not-started" | "in-progress" | "done" | "paused";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  testRequirements: string;
  status: ItemStatus;
  branch?: string;
  pr?: number;
  issue?: number;      // GitHub issue number
  tests: boolean;
  /** Files the agent must read/modify — injected verbatim into the prompt at kickoff */
  contextFiles?: string[];
}

export interface RoadmapBatch {
  number: number;
  title: string;
  summary: string;
  branchPrefix: string;
  items: RoadmapItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getBranchName(item: RoadmapItem): string {
  const batchNum = item.id.split(".")[0];
  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `feat/batch-${batchNum}-${slug}`;
}

export function findItem(itemId: string): RoadmapItem | undefined {
  return ROADMAP.flatMap((b) => b.items).find((i) => i.id === itemId);
}

export function buildAgentPrompt(item: RoadmapItem, injectedContext?: string): string {
  return `You are implementing a roadmap item for HuntYourHome, an AI-powered Zillow monitoring app built with Next.js 16 App Router, TypeScript, Tailwind v4, and Upstash Redis KV.

## Your task
Roadmap item ${item.id}: **${item.title}**
${item.description}

## Test requirements
${item.testRequirements}

## Definition of done
- Feature implemented following existing patterns
- Tests written in \`tests/\` and passing (\`pnpm test\`)
- TypeScript clean (\`pnpm tsc --noEmit\`)
- No regressions in existing test suite

## Test setup
- Runner: **vitest** + **jsdom** environment
- Installed: \`@testing-library/react\`, \`@testing-library/jest-dom\`, \`vitest\`
- Test files go in \`tests/\` with \`.test.ts\` or \`.test.tsx\`
- Mock Next.js navigation: \`vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push: vi.fn() }) }))\`
- Mock framer-motion if rendering animated components: \`vi.mock('framer-motion', () => ({ motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> }, AnimatePresence: ({ children }) => children }))\`

## Instructions
1. Start by reading \`CLAUDE.md\` — it has architecture, color tokens, KV key names, conventions, and known gotchas
2. Read relevant existing code before writing anything new
3. Follow existing patterns exactly (colors, component structure, KV access via \`lib/storage.ts\`)
4. Write tests in \`tests/${item.id.replace(".", "-")}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.test.tsx\`
5. Run \`pnpm test\` — all tests must pass including new ones
6. Run \`pnpm tsc --noEmit\` — must be clean
7. Commit all implementation + test files: \`git add -A && git commit -m "feat: ${item.title}\\n\\nCloses #${item.issue ?? "?"}"\`
8. Push: \`git push origin HEAD\`

Do not add unrequested features, extra error handling, or comments beyond what the logic requires.${injectedContext ? `\n\n---\n\n## Current source files (read these — do NOT use Read tool for them, content is already here)\n\n${injectedContext}` : ""}`;
}

export const ROADMAP: RoadmapBatch[] = [
  {
    number: 1,
    title: "Foundation & Mobile",
    branchPrefix: "feat/batch-1",
    summary: "Fix reliability gaps and make the app usable on any device before layering on new features. No external API dependencies — purely internal improvements.",
    items: [
      { id: "1.1", issue: 8,  title: "Mobile Responsiveness",          status: "not-started", tests: false,
        description: "Sidebar → bottom nav on mobile. Stats cards stack vertically. Listing cards reflow to single-column. Settings inputs are touch-friendly. Target: fully usable at 390px width (iPhone 15 viewport). Use Tailwind responsive prefixes (sm:, lg:) throughout. The sidebar component is at components/layout/Sidebar.tsx.",
        testRequirements: "Snapshot tests for breakpoint-sensitive components. Vitest + jsdom viewport simulation at 390px and 768px.",
        contextFiles: ["components/layout/Sidebar.tsx", "components/layout/Header.tsx", "app/layout.tsx", "app/page.tsx", "tests/filters.test.ts"] },
      { id: "1.2", issue: 9,  title: "Rate Limiting on /api/scan-now", status: "not-started", tests: false,
        description: "Redis counter key hyh:scan-ratelimit:<YYYY-MM-DD> (string, incr). Max 10 manual scans per calendar day. On limit: return HTTP 429 with JSON { success: false, error: 'Rate limit reached', remaining: 0, resetAt: '<ISO date>' }. Implement in app/api/scan-now/route.ts using kv from @vercel/kv. Set TTL of 86400s on the counter key.",
        testRequirements: "Unit tests for: increment logic, block at limit (returns 429), reset at new day (different date key), remaining count in response.",
        contextFiles: ["app/api/scan-now/route.ts", "lib/storage.ts", "lib/types.ts", "tests/filters.test.ts"] },
      { id: "1.3", issue: 10, title: "Seen-IDs TTL Cleanup",           status: "not-started", tests: false,
        description: "On each scan run in lib/scrape-pipeline.ts, after fetching seenIds, prune any zpid whose associated scan date (stored as hyh:seen-id-ts:<zpid> string key) is older than 90 days. Add addSeenIds to also write hyh:seen-id-ts:<zpid> = ISO date with 90-day TTL. Remove orphaned entries from the set via SREM.",
        testRequirements: "Unit tests for: pruning logic with mock timestamps, no-op when all ids are recent, correct SREM calls.",
        contextFiles: ["lib/scrape-pipeline.ts", "lib/storage.ts", "lib/types.ts", "tests/filters.test.ts"] },
      { id: "1.4", issue: 11, title: "Apify Health Monitoring",        status: "not-started", tests: false,
        description: "In lib/scrape-pipeline.ts, after fetching listings: if listingsFound === 0, check hyh:zero-scan-streak (integer key, incr). If streak >= 2, send a warning email via sendHealthAlert(alertEmail) in lib/email.ts. On listingsFound > 0, reset streak to 0. Add sendHealthAlert function to lib/email.ts using the existing Resend setup.",
        testRequirements: "Unit tests for: streak increment, alert trigger at threshold 2, streak reset on successful scan, no alert on first zero.",
        contextFiles: ["lib/scrape-pipeline.ts", "lib/storage.ts", "lib/email.ts", "tests/filters.test.ts"] },
    ],
  },
  {
    number: 2,
    title: "Search Intelligence",
    branchPrefix: "feat/batch-2",
    summary: "Improve the core search and filtering quality. Highest-value improvements for the primary use case — directly increase signal-to-noise ratio of alerts.",
    items: [
      { id: "2.1", issue: 12, title: "Price Drop Alerts",              status: "not-started", tests: false,
        description: "Track price per zpid in KV (hyh:price-history:<zpid> = JSON array of {price, date}). On each scan, compare current price to stored last price. If drop >= 2%, add zpid back to the scoring queue even if already in seen-ids. Add 🔻 badge on listing card showing dollar drop. Store price history with 180-day TTL.",
        testRequirements: "Unit tests for: drop percentage calculation, 2% threshold boundary, re-queue logic, badge formatting ($15,000 → '$15k').",
        contextFiles: ["lib/scrape-pipeline.ts", "lib/storage.ts", "lib/types.ts", "components/dashboard/ListingCard.tsx", "tests/filters.test.ts"] },
      { id: "2.2", issue: 13, title: "Days on Market Scoring Factor",  status: "not-started", tests: false,
        description: "In lib/scorer.ts, pass daysOnMarket in the prompt context with explicit guidance: under 14 = fresh, 15-45 = normal, 46-90 = investigate, 90+ = red flag. After AI returns score, apply post-processing: if daysOnMarket > 60, cap score at max(aiScore - 1, 1). Add daysOnMarketPenalty: boolean to the returned scored listing.",
        testRequirements: "Unit tests for: DOM penalty application at >60 days, no penalty at 60 days exactly, score floor at 1, penalty flag in output.",
        contextFiles: ["lib/scorer.ts", "lib/types.ts", "lib/scrape-pipeline.ts", "tests/filters.test.ts"] },
      { id: "2.3", issue: 14, title: "Dismiss Action",                 status: "not-started", tests: false,
        description: "Add X button to ListingCard (alongside bookmark star). Dismissed zpids go to hyh:dismissed-ids (Redis set, same pattern as seen-ids). Add dismissListing(zpid) and getDismissedIds() to lib/storage.ts. In scrape-pipeline.ts, filter dismissed ids before scoring. In UI, dismissed listings show faded with 'Dismissed' label in history. Add undismiss action.",
        testRequirements: "Unit tests for: dismiss storage, pipeline exclusion, undismiss, dismissed ids not re-alerted on price drop.",
        contextFiles: ["components/dashboard/ListingCard.tsx", "lib/storage.ts", "lib/scrape-pipeline.ts", "lib/types.ts", "tests/filters.test.ts"] },
      { id: "2.4", issue: 15, title: "Multi-Area Watching",            status: "not-started", tests: false,
        description: "Add searchAreas: string[] to UserPreferences in lib/types.ts (alongside existing searchArea for backward compat). Update Settings page with tag-input UI for multiple areas. In scrape-pipeline.ts, run one Apify call per area in parallel (Promise.all), merge results, deduplicate by zpid keeping the first occurrence. Update DEFAULT_PREFERENCES.",
        testRequirements: "Unit tests for: multi-area dedup by zpid, parallel fetch merging, backward compat with single searchArea.",
        contextFiles: ["lib/types.ts", "lib/scrape-pipeline.ts", "app/settings/page.tsx", "tests/filters.test.ts"] },
    ],
  },
  {
    number: 3,
    title: "Notifications",
    branchPrefix: "feat/batch-3",
    summary: "Close the latency gap and give users more control over when and how they hear about matches. A HOT listing sitting unseen for 6 hours is a real problem.",
    items: [
      { id: "3.1", issue: 16, title: "SMS / Push for HOT Listings",    status: "not-started", tests: false,
        description: "Add ntfyTopic: string to UserPreferences. In lib/email.ts add sendNtfyPush(listing, topic) that POSTs to https://ntfy.sh/{topic} with title, message, priority=urgent, tags=['house']. Call after sendHotAlert in scrape-pipeline.ts. Add ntfyTopic field to Settings page. Gracefully no-ops if topic is empty.",
        testRequirements: "Unit tests: mock fetch to ntfy.sh, verify payload shape, no-op when topic empty, priority=urgent on HOT tier only.",
        contextFiles: ["lib/email.ts", "lib/scrape-pipeline.ts", "lib/types.ts", "app/settings/page.tsx", "tests/filters.test.ts"] },
      { id: "3.2", issue: 17, title: "Digest Cadence Control",         status: "not-started", tests: false,
        description: "Add digestHour: number (0-23, default 8) and weeklyDigest: boolean to UserPreferences. Create app/api/digest/route.ts (GET, cron-secret protected) that pulls recent MATCH alerts from KV and sends a digest email. Add to vercel.json crons. Settings UI: time picker for daily digest hour.",
        testRequirements: "Unit tests: digest aggregation logic, hour validation (0-23), empty digest no-op (no email sent).",
        contextFiles: ["lib/types.ts", "lib/storage.ts", "lib/email.ts", "app/api/scrape/route.ts", "vercel.json", "app/settings/page.tsx", "tests/filters.test.ts"] },
      { id: "3.3", issue: 18, title: '"Why No Alert?" Debug View',     status: "not-started", tests: false,
        description: "Update ScanRecord in lib/types.ts to include funnel: { found, deduped, hardFiltered: Array<{zpid, reason}>, scored: Array<{zpid, score}>, alerted: string[] }. Update scrape-pipeline.ts to populate funnel. Create page app/history/[scanId]/page.tsx showing each funnel stage as a collapsible step with counts and per-listing reasons.",
        testRequirements: "Unit tests: funnel annotation logic, hard-filter reason strings, scored array population.",
        contextFiles: ["lib/types.ts", "lib/scrape-pipeline.ts", "lib/filters.ts", "app/history/page.tsx", "tests/filters.test.ts"] },
    ],
  },
  {
    number: 4,
    title: "UI & Detail",
    branchPrefix: "feat/batch-4",
    summary: "Turn the app from an alert dashboard into a full home-buying decision tool. These features increase time-on-app and make saved listings useful during the buying process.",
    items: [
      { id: "4.1", issue: 19, title: "Listing Detail Page",            status: "not-started", tests: false,
        description: "Create app/listings/[zpid]/page.tsx. Data sourced from KV alert history (find by zpid). Show: photo carousel, price in Space Grotesk, beds/baths/sqft stats, AI score badge, aiHighlights list, aiConcerns list, full aiReason text, daysOnMarket, yearBuilt, HOA, Zillow link button. Use Recharts LineChart for price history if available. Match app color scheme exactly.",
        testRequirements: "Unit tests: data hydration helper from alert records, zpid lookup logic, price history formatting.",
        contextFiles: ["lib/types.ts", "lib/storage.ts", "components/dashboard/ListingCard.tsx", "app/alerts/page.tsx", "tests/filters.test.ts"] },
      { id: "4.2", issue: 20, title: "Notes on Bookmarks",             status: "not-started", tests: false,
        description: "Add notes: string field to BookmarkedListing in lib/types.ts. Add updateBookmarkNotes(zpid, notes) to lib/storage.ts. Add API endpoint PATCH /api/bookmarks with body {zpid, notes}. On Bookmarks page, each card gets an inline textarea (max 500 chars) that auto-saves on blur with 500ms debounce. Show char count.",
        testRequirements: "Unit tests: note save/update/clear, 500 char limit enforcement, debounce logic, PATCH API handler.",
        contextFiles: ["lib/types.ts", "lib/storage.ts", "app/bookmarks/page.tsx", "app/api/bookmarks/route.ts", "tests/filters.test.ts"] },
      { id: "4.3", issue: 21, title: "Comparison Mode",               status: "not-started", tests: false,
        description: "Add checkbox to listing cards (visible on hover). When 2-3 selected, a 'Compare' button appears. Opens a full-screen drawer/modal with side-by-side columns: price, price/sqft, beds, baths, sqft, yearBuilt, HOA, AI score, top 2 highlights, top concern. Use framer-motion for drawer animation. Match app card styling.",
        testRequirements: "Unit tests: comparison data normalization, max 3 selection enforcement, price/sqft calculation.",
        contextFiles: ["components/dashboard/ListingCard.tsx", "lib/types.ts", "app/alerts/page.tsx", "tests/filters.test.ts"] },
      { id: "4.4", issue: 22, title: "Map View",                       status: "not-started", tests: false,
        description: "Add a map toggle button on Alerts and Bookmarks pages. Use react-map-gl with Mapbox GL (token from NEXT_PUBLIC_MAPBOX_TOKEN env var). Each listing is a pin: orange for HOT, blue for MATCH. Clicking a pin shows a popup with address, price, AI score, and link to detail page. Center on Frisco TX (33.1581, -96.8236) by default.",
        testRequirements: "Unit tests: coordinate validation (lat/lng present and within Frisco area bounds), pin data formatting, popup content.",
        contextFiles: ["lib/types.ts", "app/alerts/page.tsx", "app/bookmarks/page.tsx", "tests/filters.test.ts"] },
    ],
  },
  {
    number: 5,
    title: "AI Enhancement",
    branchPrefix: "feat/batch-5",
    summary: "Make AI scores smarter and more transparent. These require the most prompt engineering and come last once the rest of the stack is stable.",
    items: [
      { id: "5.1", issue: 23, title: "Comps-Based Scoring Context",    status: "not-started", tests: false,
        description: "Before calling batchScoreListings in scrape-pipeline.ts, compute from allListings: medianPricePerSqft (median of price/sqft for FOR_SALE listings), avgDaysOnMarket. Pass these as comps context in the scorer prompt: 'Neighborhood median: $X/sqft, avg DOM: Y days.' This grounds the AI in actual market data from the current scan.",
        testRequirements: "Unit tests: median calculation (even/odd arrays), avg DOM calculation, correct median formula, edge case with 1 listing.",
        contextFiles: ["lib/scrape-pipeline.ts", "lib/scorer.ts", "lib/types.ts", "tests/filters.test.ts"] },
      { id: "5.2", issue: 24, title: "Deal-Breaker Weighting",         status: "not-started", tests: false,
        description: "Add dealBreakers: string[] to UserPreferences (default []). In Settings, add a tag-input under an 'AI Preferences' section. In lib/scorer.ts, include dealBreakers in prompt: 'User deal-breakers (dock 2 pts each if matched): [list]'. After AI returns score, if aiConcerns contains any deal-breaker keyword, subtract 2 per match, floor at 1.",
        testRequirements: "Unit tests: deal-breaker matching logic, 2-point deduction per match, score floor at 1, empty dealBreakers no-op.",
        contextFiles: ["lib/scorer.ts", "lib/types.ts", "app/settings/page.tsx", "tests/filters.test.ts"] },
      { id: "5.3", issue: 25, title: "Score History Tracking",         status: "not-started", tests: false,
        description: "Add hyh:score-history:<zpid> KV key (JSON array of {score, date, price}). In scorer.ts, after scoring each listing, call appendScoreHistory(zpid, score, price). Set 180-day TTL. Add getScoreHistory(zpid) to lib/storage.ts. Surface as a Recharts LineChart sparkline on the listing detail page (item 4.1).",
        testRequirements: "Unit tests: history append, TTL logic, getScoreHistory retrieval, duplicate date handling.",
        contextFiles: ["lib/scorer.ts", "lib/storage.ts", "lib/types.ts", "tests/filters.test.ts"] },
      { id: "5.4", issue: 26, title: "Full AI Reasoning Panel",        status: "not-started", tests: false,
        description: "Add aiReasoning: string to AIScoredListing in lib/types.ts. Update scorer.ts to extract and return the full reasoning paragraph (not just highlights/concerns). Store in alert records in KV. On listing cards, add a collapsible 'AI Reasoning' section (chevron toggle, framer-motion animate height). Show full aiReason text.",
        testRequirements: "Unit tests: reasoning extraction from AI response, storage in alert record, collapsed/expanded state logic.",
        contextFiles: ["lib/types.ts", "lib/scorer.ts", "lib/storage.ts", "components/dashboard/ListingCard.tsx", "tests/filters.test.ts"] },
    ],
  },
  {
    number: 6,
    title: "Auth & Multi-Tenancy",
    branchPrefix: "feat/batch-6",
    summary: "Move from a single-user personal tool to a generic, reusable platform. OAuth gates the app, user preferences are scoped per account, and the search area is fully configurable — removing all Frisco-specific hardcoding.",
    items: [
      { id: "6.1", issue: 27, title: "OAuth Authentication", status: "not-started", tests: false,
        description: "Add NextAuth.js (v5) with Google and GitHub providers. Gate all dashboard pages and API routes behind session middleware. On first login, auto-populate prefs.alertEmail from the OAuth provider email. Show user avatar + sign-out in the sidebar header. Store session in Upstash KV (use @auth/upstash-redis-adapter). Protect /api/scan-now, /api/history, /api/preferences, /api/bookmarks — return 401 if unauthenticated.",
        testRequirements: "Unit tests: session middleware, unauthenticated API route returns 401, alertEmail auto-population from OAuth profile email.",
        contextFiles: ["middleware.ts", "lib/storage.ts", "lib/types.ts", "components/layout/Sidebar.tsx", "app/api/scan-now/route.ts", "tests/filters.test.ts"] },
      { id: "6.2", issue: 28, title: "Per-User Data Isolation", status: "not-started", tests: false,
        description: "Scope all KV keys by userId (from NextAuth session). Change key pattern from hyh:preferences to hyh:u:<userId>:preferences, hyh:seen-ids to hyh:u:<userId>:seen-ids, etc. Update lib/storage.ts to accept userId param on every read/write. Update scrape-pipeline to read userId from preferences record. Each user gets independent scan history, bookmarks, alert history, and seen-ids. Migration: preserve existing global keys as a legacy fallback for the first authenticated user.",
        testRequirements: "Unit tests: key namespacing helper, no cross-user data leakage (mock two userIds, verify isolation), legacy key fallback.",
        contextFiles: ["lib/storage.ts", "lib/scrape-pipeline.ts", "lib/types.ts", "tests/filters.test.ts"] },
      { id: "6.3", issue: 29, title: "Dynamic City & Boundary Search", status: "not-started", tests: false,
        description: "Remove all Frisco TX hardcoding. Add a geocoding step: when searchArea changes in Settings, call OpenStreetMap Nominatim (free, no key required) to resolve the city name to a bounding box (west/east/south/north). Store resolvedBounds: {west, east, south, north} in UserPreferences alongside searchArea. In lib/apify.ts, use resolvedBounds instead of the hardcoded Frisco box. Update map view (4.4) default center to use bounds centroid. Settings UI: city input with a 'Resolve bounds' step that previews the bounding box.",
        testRequirements: "Unit tests: Nominatim response parsing, bounding box extraction, fallback when geocoding fails, centroid calculation.",
        contextFiles: ["lib/apify.ts", "lib/types.ts", "lib/storage.ts", "app/settings/page.tsx", "tests/filters.test.ts"] },
      { id: "6.4", issue: 30, title: "Platform Generalization", status: "not-started", tests: false,
        description: "Bundle remaining hardcoded assumptions into configurable preferences: (1) configurable scan frequency — add scanFrequency: '2x' | '4x' | '8x' to prefs, update vercel.json cron schedule dynamically via Vercel API; (2) multiple saved searches — searchAreas: string[] (extends 2.4), each with independent seen-ids and filter criteria; (3) remove all 'Frisco TX' references from UI copy, email templates, and default values — replace with dynamic prefs.searchArea; (4) configurable price/bed/bath defaults to sensible nationwide ranges; (5) white-label app name — add appName to UserPreferences, used in email subject lines and header.",
        testRequirements: "Unit tests: scan frequency cron expression mapping, multi-search dedup, dynamic copy resolution from prefs.",
        contextFiles: ["lib/types.ts", "lib/storage.ts", "lib/scrape-pipeline.ts", "vercel.json", "app/settings/page.tsx", "tests/filters.test.ts"] },
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
