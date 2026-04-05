---
type: project-index
tags: [hunt-your-home, index]
last-updated: 2026-04-05
---

# HuntYourHome — Project Wiki

> **Agents: read this file first.** It takes 60 seconds and orients you completely.
> Then read `WIKI/gotchas.md` before touching anything.
> Global wiki (cross-project context): `~/.claude/wiki/index.md`

---

## What This App Does

AI-powered Zillow monitor for Frisco, TX. Scrapes 4x/day via Apify, scores each new listing with Claude Haiku against user preferences, emails matches. Single-user personal tool — no auth, no multi-tenancy (yet — see batch 6).

## Data Flow

```
Vercel Cron (4x/day)  ─┐
                        ├→ POST /api/scrape → lib/scrape-pipeline.ts
Browser "Scan Now"    ─┘         │
                                 ├→ Apify (Zillow scraper)
                                 ├→ Claude Haiku (lib/scorer.ts)
                                 ├→ Resend email (lib/email.ts)
                                 └→ Upstash KV (lib/storage.ts)
```

## Key Files

| File | What it does |
|---|---|
| `lib/scrape-pipeline.ts` | Full scan pipeline — entry point for all scanning |
| `lib/scorer.ts` | Claude Haiku scoring — returns aiScore, alertTier, highlights |
| `lib/storage.ts` | ALL KV reads/writes — single source of truth for key names |
| `lib/filters.ts` | Hard filter logic — runs before AI to save tokens |
| `lib/types.ts` | All shared types |
| `lib/roadmap-data.ts` | Roadmap items, agent prompts, context file lists |
| `app/monitor/roadmap/page.tsx` | PIN-gated roadmap monitor UI |
| `app/api/monitor/kickoff/route.ts` | Kicks off agent runs — creates branch, PR, dispatches workflow |
| `app/api/monitor/retry/route.ts` | Re-dispatches failed agent runs |

## Design System

```
bg-base:     #080E0A   body background
bg-surface:  #0D1510   sidebar, headers
bg-elevated: #141C16   cards, panels
border:      #21262D   default borders

content-primary:   #E6EDF3
content-secondary: #8B949E
content-muted:     #484F58

accent:  #39D353   primary green
hot:     #FF6B35   HOT tier
match:   #58A6FF   MATCH tier
```

Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (code)

## KV Key Names

| Key | Type | Purpose |
|---|---|---|
| `hyh:preferences` | JSON | UserPreferences |
| `hyh:seen-ids` | Set | All scraped zpids (dedup) |
| `hyh:alert-history` | List | AlertRecord[] — most recent first |
| `hyh:scan-history` | List | ScanRecord[] |
| `hyh:bookmarks` | Hash | zpid → BookmarkedListing |
| `hyh:roadmap-overrides` | Hash | itemId → RoadmapOverride (status, pr, startedAt) |

## Conventions

**Branch naming:** `feat/batch-{n}-{slug}` for roadmap items, `fix/{slug}`, `chore/{slug}`

**Commit format:**
```
feat: short description

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**PR process:** branch → PR → CI green → merge (never push to main directly)

## Current Roadmap Status (2026-04-05)

| Batch | Title | Status |
|---|---|---|
| 1 | Foundation & Mobile | In progress — item 1.1 needs redo |
| 2 | Search Intelligence | Not started |
| 3 | Notifications | Not started |
| 4 | UI & Detail | Not started |
| 5 | AI Enhancement | Not started |
| 6 | Auth & Multi-Tenancy | Not started |

## Navigation

- [gotchas.md](gotchas.md) — **Read this before touching anything**
- [agents.md](agents.md) — Agent-specific context and guidance
- [decisions/agent-workflow.md](decisions/agent-workflow.md) — How the agent automation was built
- [decisions/roadmap-system.md](decisions/roadmap-system.md) — Roadmap monitor architecture
- [decisions/context-injection.md](decisions/context-injection.md) — Why/how context is injected into prompts
- [sessions/2026-04-05.md](sessions/2026-04-05.md) — Today's work log
