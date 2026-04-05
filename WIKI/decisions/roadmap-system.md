---
type: decision-record
tags: [roadmap-monitor, context-injection, agent-workflow]
date: 2026-04-05
last-updated: 2026-04-05
---

# Decision: Roadmap Monitor + Context Injection System

## Roadmap Monitor (`/monitor/roadmap`)

PIN-gated page showing all roadmap items with live GitHub PR status.

**Status resolution (in priority order):**
1. If `prData?.pr?.merged_at != null` → `done` (GitHub is authoritative)
2. If KV override has `status` → use that
3. Otherwise → `item.status` from `roadmap-data.ts`

**Critical:** `fetchAllPrStatuses` must check BOTH `item.pr` (from roadmap-data) AND `override.pr` (from KV). Kickoff-created items only have their PR number in KV, not in roadmap-data. See [gotchas.md](../gotchas.md).

**Polling:** `RoadmapPoller` client component calls `router.refresh()` every 30s when any items are in-progress. Detects `done` transitions and fires confetti.

## Context Injection System

**Problem:** Agents burn 8–15 turns reading files via the Read tool before they can implement anything.

**Solution:** At kickoff time, the server fetches file contents from the GitHub API and embeds them in the prompt. The agent opens with all relevant source already loaded.

**Implementation:**
- `contextFiles: string[]` on each `RoadmapItem` — the files to embed
- `fetchContextFiles(files)` in kickoff/retry routes — fetches from GitHub API, formats as fenced code blocks
- `buildAgentPrompt(item, injectedContext?)` — appends as "Current source files" section

**Why GitHub API (not filesystem):** The kickoff route runs as a Vercel serverless function in production. Source files aren't on the production filesystem. GitHub API is always available and returns current content.

**File selection:** Each item's `contextFiles` includes:
- The files the agent needs to modify
- `tests/filters.test.ts` as a test pattern example
- Relevant lib files for KV/storage operations

**Also injected:** `WIKI/gotchas.md` — always appended so agents don't repeat history.
