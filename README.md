# HuntYourHome (HYH)

AI-powered real estate monitoring for Frisco, TX. Automatically scans Zillow for new listings, scores them with Claude AI, and sends email alerts when matches hit your criteria.

## Features

- **Automated Zillow Scraping** — Runs 4x daily via Vercel Cron Jobs (7AM, 11AM, 3PM, 7PM CT)
- **AI Scoring** — Each new listing is scored 1–10 by Claude Sonnet with reasoning, highlights, and concerns
- **Smart Deduplication** — Vercel KV (Redis) tracks seen listings so you never get duplicate alerts
- **Email Alerts** — HOT listings (score ≥ 8) get individual priority emails; MATCH listings get digest emails
- **Live Dashboard** — Real-time alert feed with filter panel, scan stats, and one-click manual scan
- **Auto-saving Filters** — Search criteria debounce-save every 500ms to KV storage

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Scraping | Apify (zillow-scraper) |
| AI Scoring | Anthropic Claude claude-sonnet-4-6 |
| Storage | Vercel KV (Redis/Upstash) |
| Email | Resend + React Email |
| Scheduling | Vercel Cron Jobs |
| Hosting | Vercel |

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd hunt-your-home
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`:

| Variable | Where to get it |
|----------|----------------|
| `APIFY_TOKEN` | [console.apify.com/account/integrations](https://console.apify.com/account/integrations) |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `KV_URL` / `KV_REST_API_*` | Vercel project → Storage → KV |
| `ALERT_EMAIL_TO` | Your email address |
| `ALERT_EMAIL_FROM` | A verified Resend sender address |
| `CRON_SECRET` | Any random secret string |

### 3. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Without `APIFY_TOKEN`, the scraper returns mock listings for UI development. Without `KV_*` vars, storage calls will fail gracefully and defaults will be used.

## Project Structure

```
hunt-your-home/
├── app/
│   ├── layout.tsx              # Root layout with sidebar + toaster
│   ├── page.tsx                # Dashboard (stats + feed + filters)
│   ├── globals.css             # Tailwind v4 theme + global styles
│   └── api/
│       ├── scrape/route.ts     # Main scrape pipeline (cron endpoint)
│       ├── preferences/route.ts
│       └── history/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx          # Mobile header
│   ├── dashboard/
│   │   ├── StatsBar.tsx        # 4 stat cards + Scan Now button
│   │   ├── AlertFeed.tsx       # Scrollable alert history
│   │   ├── ListingCard.tsx     # Individual listing card
│   │   └── EmptyState.tsx
│   ├── filters/
│   │   ├── FilterPanel.tsx     # Full criteria panel (auto-save)
│   │   ├── PriceRange.tsx      # Dual-handle price slider
│   │   ├── BedsSelector.tsx    # Pill button selector
│   │   └── ToggleFilter.tsx    # Toggle switch
│   └── email/
│       └── AlertEmailTemplate.tsx  # React Email template
├── lib/
│   ├── types.ts                # All TypeScript interfaces
│   ├── storage.ts              # Vercel KV CRUD (hyh: prefix)
│   ├── apify.ts                # Zillow scraper integration
│   ├── scorer.ts               # Claude AI scoring
│   ├── email.ts                # Resend email senders
│   └── filters.ts              # Hard filter logic
├── vercel.json                 # Cron schedule (4x daily)
└── .env.local.example
```

## Scan Pipeline (`/api/scrape`)

1. **Auth** — Verify `Authorization: Bearer <CRON_SECRET>` header
2. **Load Prefs** — Fetch `hyh:preferences` from KV
3. **Scrape** — Run Apify `apify/zillow-scraper` (fallback: `maxcopell/zillow-scraper`)
4. **Deduplicate** — Filter against `hyh:seen-ids` Redis Set
5. **Hard Filter** — Price, beds, baths, sqft, year built, HOA, FOR\_SALE only
6. **AI Score** — Batch score with Claude (max 5 concurrent), filter by `scoreThreshold`
7. **Mark Seen** — Add all new listing IDs to `hyh:seen-ids`
8. **Send Emails** — HOT → individual; MATCH → digest
9. **Store History** — Push to `hyh:alert-history` (max 500) and `hyh:scan-history` (max 100)

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables in **Settings → Environment Variables**
4. Add a **KV store** in **Storage** (links automatically via `KV_*` env vars)
5. Deploy — crons will activate automatically

### Cron Schedule

| UTC | Central Time | Description |
|-----|-------------|-------------|
| 13:00 | 7:00 AM | Morning scan |
| 17:00 | 11:00 AM | Mid-morning scan |
| 21:00 | 3:00 PM | Afternoon scan |
| 01:00 | 7:00 PM | Evening scan |

Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

## Redis Key Schema

| Key | Type | Description |
|-----|------|-------------|
| `hyh:preferences` | String (JSON) | User search preferences |
| `hyh:seen-ids` | Set | All previously seen Zillow listing IDs |
| `hyh:alert-history` | List | Last 500 alert records (newest first) |
| `hyh:scan-history` | List | Last 100 scan run records (newest first) |

## License

MIT
