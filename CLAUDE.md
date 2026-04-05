@AGENTS.md

# HuntYourHome — Agent Context

## Wiki (read before starting any task)
- **Project wiki:** `WIKI/index.md` — architecture, key files, design tokens, current status
- **Gotchas:** `WIKI/gotchas.md` — real failures that have happened, read this first
- **Agent guide:** `WIKI/agents.md` — your environment, test setup, required completion steps
- **Global wiki:** `~/.claude/wiki/index.md` — cross-project context, who Omer is, patterns

---

## What this app does
AI-powered Zillow monitoring for Frisco, TX. Scrapes Zillow via Apify 4x daily, scores each new listing with Claude Haiku, and emails matching listings to a configured address. Single-user personal tool — no auth, no multi-tenancy.

---

## Architecture

### Data flow
```
Vercel Cron → POST /api/scrape (CRON_SECRET required)
Browser "Scan Now" → POST /api/scan-now (no auth — personal tool)
Both → lib/scrape-pipeline.ts → Apify → Claude Haiku → Resend email → Upstash KV
```

### Key source files
| File | Purpose |
|------|---------|
| `lib/scrape-pipeline.ts` | Full scan pipeline — Apify → dedup → filter → AI score → email → KV |
| `lib/scorer.ts` | Anthropic Claude Haiku scoring. Returns `aiScore` (1–10), `alertTier`, `aiHighlights`, `aiConcerns`, `aiReason` |
| `lib/storage.ts` | All Upstash KV reads/writes. Single source of truth for KV key names |
| `lib/filters.ts` | Hard filter logic (`matchesHardFilters`) — runs before AI to save tokens |
| `lib/types.ts` | All shared types. `UserPreferences`, `AIScoredListing`, `AlertRecord`, `ScanRecord`, `BookmarkedListing` |
| `lib/roadmap-data.ts` | Structured roadmap data for `/monitor/roadmap`. Update `status` and `pr` fields here as work progresses |
| `app/api/scrape/route.ts` | Cron-only endpoint — checks `CRON_SECRET` |
| `app/api/scan-now/route.ts` | UI-triggered scans — no auth |
| `app/monitor/roadmap/page.tsx` | PIN-gated roadmap monitor. Fetches live GitHub PR status on each load |

### Upstash KV keys
| Key | Type | Purpose |
|-----|------|---------|
| `hyh:preferences` | JSON | `UserPreferences` — search criteria, alert email, thresholds |
| `hyh:seen-ids` | Set | All zpids ever scraped (dedup across scans) |
| `hyh:alert-history` | List | `AlertRecord[]` — capped, most recent first |
| `hyh:scan-history` | List | `ScanRecord[]` — capped, most recent first |
| `hyh:bookmarks` | Hash | `zpid → BookmarkedListing JSON` |

### Cron schedule (vercel.json)
Fires `POST /api/scrape` at: 08:00, 12:00, 16:00, 20:00 CST (UTC: 13, 17, 21, 01).

---

## Design system

### Color tokens (globals.css `@theme`)
```
bg-base:        #080E0A  ← body background (green-tinted dark)
bg-surface:     #0D1510  ← sidebar, sticky headers, terminal bg
bg-elevated:    #141C16  ← cards, panels, dropdowns
bg-hover:       #1A2B1C  ← hover states on interactive items

border-subtle:  #21262D  ← default borders
border-strong:  #30363D  ← hover/focus borders

content-primary:   #E6EDF3  ← headings, values
content-secondary: #8B949E  ← labels, secondary text
content-muted:     #484F58  ← timestamps, captions

accent:     #39D353  ← primary green (GitHub contribution green)
accent-dim: #1A7F37  ← toggle ON state background

hot:   #FF6B35  ← HOT tier (orange)
match: #58A6FF  ← MATCH tier (blue)
```

### Typography
- **Display / headings**: `var(--font-space-grotesk)` — Space Grotesk 700
- **Body / UI**: `var(--font-inter)` — Inter 400/600/700
- **Mono / terminal**: `var(--font-mono)` — JetBrains Mono

### App name rendering (must match everywhere)
```tsx
<span style={{ color: "#8B949E" }}>Hunt</span>
<span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
<span style={{ color: "#39D353", fontWeight: 700 }}>Home</span>
```

### `.btn-scan` class
Defined in `globals.css`. Use this class for the primary green action button. Do not recreate inline.

---

## Conventions

### Branch naming
```
feat/batch-{n}-{short-description}   ← roadmap batch work
fix/{short-description}              ← bug fixes
chore/{short-description}            ← deps, config, CI
```

### Commit format
```
type: short description (imperative, lowercase)

Longer explanation if needed.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
Types: `feat`, `fix`, `chore`, `test`, `docs`

### PR process
1. Branch off `main`
2. `pnpm tsc --noEmit` must be clean before pushing
3. `pnpm test` must pass
4. CI (GitHub Actions) must be green
5. Update `lib/roadmap-data.ts` with PR number and status
6. PR targets `main` (default branch — confirmed correct as of 2026-04-04)

### Deploying
Vercel auto-deploys `main` on push. No manual deploy steps needed. Preview deployments are created for all other branches.

---

## Environment variables

| Var | Where set | Purpose |
|-----|-----------|---------|
| `APIFY_API_TOKEN` | Vercel | Zillow scraper actor auth |
| `ANTHROPIC_API_KEY` | Vercel | Claude Haiku scoring |
| `RESEND_API_KEY` | Vercel | Email sending |
| `KV_REST_API_URL` | Vercel (auto) | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Vercel (auto) | Upstash Redis REST token |
| `CRON_SECRET` | Vercel | Guards `POST /api/scrape` |
| `ALERT_EMAIL_TO` | Vercel | Fallback recipient if `prefs.alertEmail` is empty |
| `NEXT_PUBLIC_APP_URL` | Vercel | Used in email links and OG metadata |
| `NEXT_PUBLIC_GA_ID` | Vercel | Google Analytics (optional) |
| `ROADMAP_PIN` | Vercel | PIN for `/monitor/roadmap` access |
| `GITHUB_TOKEN` | Vercel | GitHub API for live PR status on monitor page (optional, raises rate limit 60→5000/hr) |
| `NEXT_PUBLIC_ENABLE_MOCK` | `.env.local` ONLY | Enables mock mode UI. Never set in Vercel production |
| `SENTRY_DSN` | Vercel | Sentry error monitoring (optional) |

---

## Known gotchas

### GitHub default branch
The repo's default branch was `feat/bookmarks-mock-gate-openai-scorer` (set automatically when it was the first branch pushed). Fixed 2026-04-04 — `main` is now the default. All PRs should target `main`.

After merging a PR, always fast-forward local `main`:
```bash
git checkout main && git pull origin main
```

### OG image fonts
`next/og` (Satori) does NOT support woff2. Use woff from `@fontsource` v4.x:
```
https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.15/files/inter-latin-400-normal.woff
```
woff2 throws: `Unsupported OpenType signature wOF2`

### Mock mode
`NEXT_PUBLIC_ENABLE_MOCK=true` is only set in `.env.local`. The constant `process.env.NEXT_PUBLIC_ENABLE_MOCK === "true"` dead-branches at build time in production — zero runtime overhead. Never add this to Vercel env vars.

### Preferences priority
Scan pipeline reads preferences from KV (`hyh:preferences`) via `getPreferences()`.
Cookies are client-side only (Settings page UI). The priority chain is:
```
KV prefs.alertEmail → process.env.ALERT_EMAIL_TO → ""
```

### Updating the roadmap monitor
When a PR for a roadmap item is opened:
1. Set `status: "in-progress"` and `pr: <number>` in `lib/roadmap-data.ts`
2. When merged: set `status: "done"` and `tests: true`
The monitor page at `/monitor/roadmap` fetches live GitHub PR state on top of this.

---

## Testing

```bash
pnpm test           # run all tests (vitest run)
pnpm test:watch     # watch mode
pnpm test:coverage  # coverage report
pnpm tsc --noEmit   # type-check only
```

Test files live in `tests/`. Coverage configured for `lib/**/*.ts` (excludes `apify.ts`, `scorer.ts`, `email.ts` — external API wrappers).

Each roadmap item must have tests before its PR is merged. See `roadmap_v2.md` for per-item test requirements.
