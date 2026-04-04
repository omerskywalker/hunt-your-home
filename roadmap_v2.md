# HuntYourHome — Roadmap v2

> Development progresses in feature branches. Each item must have passing tests and a green CI pipeline before the PR is marked done. Track live status at `/monitor/roadmap` (PIN-gated).

---

## Batch 1 — Foundation & Mobile
**Priority: High | Branch prefix: `feat/batch-1-*`**

Fix the reliability gaps and make the app usable on any device before layering on new features. This batch has no external API dependencies — purely internal improvements that make everything downstream better.

| # | Item | Status | PR |
|---|------|--------|----|
| 1.1 | Mobile Responsiveness | 🔲 Not Started | — |
| 1.2 | Rate Limiting on `/api/scan-now` | 🔲 Not Started | — |
| 1.3 | Seen-IDs TTL Cleanup | 🔲 Not Started | — |
| 1.4 | Apify Health Monitoring | 🔲 Not Started | — |

### 1.1 Mobile Responsiveness
Audit and fix layout across all pages for small screens. Sidebar collapses to a bottom nav on mobile. Stats cards stack vertically. Listing cards reflow to single-column. Settings page inputs are touch-friendly. Target: fully usable at 390px width (iPhone 15 viewport).
- **Tests**: Snapshot tests for breakpoint-sensitive components; Playwright viewport tests at 390px and 768px.

### 1.2 Rate Limiting on `/api/scan-now`
Prevent accidental Apify credit burn from repeated button presses. Use a Redis counter (`hyh:scan-ratelimit:<date>`) with a max of 10 manual scans per calendar day. Returns a clear error with remaining count in the response.
- **Tests**: Unit tests for the rate-limit logic (increment, reset at midnight, block at limit).

### 1.3 Seen-IDs TTL Cleanup
The `hyh:seen-ids` Redis set grows forever. Listings from 90+ days ago will never reappear. Prune entries on each scan: fetch listing `runAt` timestamps, discard any seen-id older than 90 days. Keeps the Redis set lean.
- **Tests**: Unit test the pruning logic with mock timestamps.

### 1.4 Apify Health Monitoring
If the Apify actor fails silently, scans record 0 listings and nothing surfaces. Add a check: if `listingsFound === 0` and the previous 2 scans also returned 0, send a warning email to the alert address. Also log a structured error for Vercel log drains.
- **Tests**: Unit test the zero-listing detection and alert-trigger threshold logic.

---

## Batch 2 — Search Intelligence
**Priority: High | Branch prefix: `feat/batch-2-*`**

Improve the core search and filtering quality. These features directly increase the signal-to-noise ratio of alerts and are the highest-value improvements for the primary use case.

| # | Item | Status | PR |
|---|------|--------|----|
| 2.1 | Price Drop Alerts | 🔲 Not Started | — |
| 2.2 | Days on Market Scoring Factor | 🔲 Not Started | — |
| 2.3 | Dismiss Action | 🔲 Not Started | — |
| 2.4 | Multi-Area Watching | 🔲 Not Started | — |

### 2.1 Price Drop Alerts
Track price history per zpid in KV (`hyh:price-history:<zpid>`). On each scan, compare current price to stored price. If a listing drops ≥ 2%, re-score it and send a "Price Drop" variant email even if it was already seen. Badge in UI: 🔻 -$15k.
- **Tests**: Unit tests for drop detection, percentage threshold, and re-alert logic.

### 2.2 Days on Market Scoring Factor
Currently the AI scorer doesn't penalize stale listings. Pass `daysOnMarket` into the scoring prompt with explicit context: "listings under 14 days are fresh; 15–45 is normal; 45+ may indicate issues." Listings at 60+ days get a -1 score floor applied post-AI.
- **Tests**: Unit tests for the DOM penalty application; prompt injection test for the new context.

### 2.3 Dismiss Action
Add a "✕ Dismiss" button on listing cards alongside the bookmark star. Dismissed zpids go into `hyh:dismissed-ids` (same structure as seen-ids). Dismissed listings are permanently excluded from re-alerting even on price drops. UI: dismissed listings shown faded in history with a "dismissed" label.
- **Tests**: Unit tests for dismiss storage, exclusion from pipeline, and UI state.

### 2.4 Multi-Area Watching
Allow watching multiple search areas simultaneously (e.g. "Frisco, TX", "Allen, TX", "McKinney, TX"). Store as `searchAreas: string[]` in preferences. Each scan runs one Apify call per area, deduplicates by zpid, then scores the merged set. Settings UI shows a tag-input for areas.
- **Tests**: Unit tests for multi-area deduplication logic.

---

## Batch 3 — Notifications
**Priority: Medium | Branch prefix: `feat/batch-3-*`**

Close the latency gap and give users more control over how and when they hear about matches. Email-only with 4× daily polling means a HOT listing could sit unseen for 6 hours.

| # | Item | Status | PR |
|---|------|--------|----|
| 3.1 | SMS / Push for HOT Listings | 🔲 Not Started | — |
| 3.2 | Digest Cadence Control | 🔲 Not Started | — |
| 3.3 | "Why No Alert?" Debug View | 🔲 Not Started | — |

### 3.1 SMS / Push for HOT Listings
Integrate ntfy.sh (free, self-hostable) for push notifications on HOT-tier listings. User provides a ntfy.sh topic in Settings. Falls back gracefully if not configured. Twilio SMS as a secondary option behind a feature flag. HOT alerts only — MATCH listings remain email-digest only.
- **Tests**: Mock ntfy.sh calls; unit test the notification dispatch logic.

### 3.2 Digest Cadence Control
Add per-tier notification cadence to preferences: HOT → immediate (current), MATCH → daily digest at a user-chosen hour, SEEN-ONLY → weekly summary. Store cadence config in KV. Implement a separate `/api/digest` cron for daily/weekly rollups.
- **Tests**: Unit tests for cadence bucketing and rollup aggregation.

### 3.3 "Why No Alert?" Debug View
New page `/history/[scanId]` showing the full funnel for a specific scan: listings found → deduplicated → hard-filtered (with reason) → AI-scored (with scores) → alerted. Lets you diagnose why a listing you noticed on Zillow didn't generate an alert. Protected behind the same auth as the monitor page.
- **Tests**: Unit tests for funnel-step annotation logic.

---

## Batch 4 — UI & Detail
**Priority: Medium | Branch prefix: `feat/batch-4-*`**

Turn the app from an alert dashboard into a full home-buying decision tool. These features increase time-on-app and make the saved listings actually useful during the buying process.

| # | Item | Status | PR |
|---|------|--------|----|
| 4.1 | Listing Detail Page | 🔲 Not Started | — |
| 4.2 | Notes on Bookmarks | 🔲 Not Started | — |
| 4.3 | Comparison Mode | 🔲 Not Started | — |
| 4.4 | Map View | 🔲 Not Started | — |

### 4.1 Listing Detail Page
Internal route `/listings/[zpid]` with full photo gallery, all AI highlights + concerns, score breakdown, DOM timeline, price history chart (Recharts), and a direct Zillow link. Accessible from any listing card click. Data sourced from the alert record stored in KV.
- **Tests**: Unit tests for data hydration from KV; snapshot test for the detail layout.

### 4.2 Notes on Bookmarks
Free-text notes field on bookmarked listings. Stored in KV alongside the bookmark record (`hyh:bookmarks` hash, `notes` field). Editable inline on the Bookmarks page and on the listing detail page. Persists across sessions. 500 char limit.
- **Tests**: Unit tests for note save/update/clear; character limit enforcement.

### 4.3 Comparison Mode
Select 2–3 listings via checkboxes and open a side-by-side comparison drawer. Shows: price, price/sqft, beds, baths, sqft, year built, HOA, AI score, top 2 highlights, top concern. Exportable as a screenshot (html2canvas).
- **Tests**: Unit tests for comparison data normalization; selection state management.

### 4.4 Map View
Toggle on the Alerts and Bookmarks pages to switch from card grid to a Mapbox GL map (free tier, token in env). Each listing is a pin colored by tier (HOT = orange, MATCH = blue). Clicking a pin opens the listing detail. Frisco, TX centered by default.
- **Tests**: Unit tests for coordinate validation and pin data formatting.

---

## Batch 5 — AI Enhancement
**Priority: Low-Medium | Branch prefix: `feat/batch-5-*`**

Make the AI scores smarter and more transparent. These require the most prompt engineering and are most sensitive to OpenAI API changes, so they come last once the rest of the stack is stable.

| # | Item | Status | PR |
|---|------|--------|----|
| 5.1 | Comps-Based Scoring Context | 🔲 Not Started | — |
| 5.2 | Deal-Breaker Weighting | 🔲 Not Started | — |
| 5.3 | Score History Tracking | 🔲 Not Started | — |
| 5.4 | Full AI Reasoning Panel | 🔲 Not Started | — |

### 5.1 Comps-Based Scoring Context
Pass neighborhood median price/sqft and average DOM into the scoring prompt as ground truth (sourced from the scan's own batch data — compute medians from `allListings` before scoring). Removes reliance on the AI "knowing" local comps from training data.
- **Tests**: Unit tests for median computation from listing arrays.

### 5.2 Deal-Breaker Weighting
Add a `dealBreakers: string[]` field to preferences (e.g. ["no pool", "busy road", "small lot"]). Pass deal-breakers into the scoring prompt. AI docks 2 points per matched deal-breaker. UI: tag-input in Settings under a new "AI Preferences" section.
- **Tests**: Unit tests for deal-breaker injection into prompt and score adjustment.

### 5.3 Score History Tracking
Store AI score per zpid over time in KV (`hyh:score-history:<zpid>`). If a listing is re-scored (e.g. after a price drop), append the new score with timestamp. Surface as a mini sparkline on the listing detail page and comparison view.
- **Tests**: Unit tests for score history append and retrieval.

### 5.4 Full AI Reasoning Panel
Expose the complete AI reasoning text on listing cards (collapsed by default, expandable). Currently only `aiHighlights` and `aiConcerns` arrays are shown. Add `aiReasoning: string` to the scored listing type and store it in KV with the alert record.
- **Tests**: Unit tests for reasoning extraction and storage; snapshot test for the expanded panel UI.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| 🔲 | Not Started |
| 🔄 | In Progress |
| ✅ | Done — PR merged, tests passing |
| ⏸️ | Paused / Deprioritized |

---

## Definition of Done

A roadmap item is **Done** when:
1. Feature branch merged into main via PR
2. Vitest unit tests written and passing (`pnpm test`)
3. TypeScript type-check passing (`pnpm tsc --noEmit`)
4. CI pipeline green (GitHub Actions)
5. No regressions in existing test suite
