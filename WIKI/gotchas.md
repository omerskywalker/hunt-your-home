---
type: gotchas
tags: [gotchas, lessons-learned, hunt-your-home]
last-updated: 2026-04-05
---

# Gotchas — HuntYourHome

> Read this before starting any task. Each entry is a real thing that burned us.
> Add new entries at the top with the date.

---

## 2026-04-05 — Agent workflow: three required fixes

**Symptom:** Agent crashes in under 60 seconds, "Failed to setup GitHub token" error.

**Causes (all three must be fixed):**
1. `id-token: write` missing from workflow permissions → OIDC token fails
2. Action input is `direct_prompt`, not `prompt` → silently ignored, prompt is empty
3. `mode: agent` missing → tag mode rejects `workflow_dispatch` events

**Working workflow step:**
```yaml
permissions:
  contents: write
  pull-requests: write
  id-token: write       # ← this one is always forgotten

- uses: anthropics/claude-code-action@beta
  with:
    mode: agent
    direct_prompt: ${{ inputs.prompt }}
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

## 2026-04-05 — Always dispatch workflow from `ref: main`

**Symptom:** Fixes to `agent.yml` on `main` don't take effect on re-runs.

**Cause:** `workflow_dispatch` uses the workflow file from the specified `ref`. Dispatching from a feature branch runs that branch's (old) workflow file.

**Fix:** Always pass `ref: "main"` in the dispatch body. The checkout step inside the workflow handles switching to the feature branch.

---

## 2026-04-05 — @testing-library/react not installed (burned entire agent run) {#testing-library-missing}

**Symptom:** Agent claims "success" but PR has no implementation — only `.agent-task` file.

**Cause:** `@testing-library/react` was not installed. Agent spent all turns fighting `Failed to resolve import "@testing-library/react"` errors, never wrote the actual feature code. Then `pnpm test` (without specifying test files) passed with the existing 73 tests → workflow showed green.

**Fix:** 
- Package is now installed: `@testing-library/react` + `@testing-library/jest-dom`
- Always include test setup in agent prompt (see `buildAgentPrompt` in `lib/roadmap-data.ts`)
- Agents must also run `pnpm test` with the new test file explicitly, not just globally

---

## 2026-04-05 — PR status not updating after merge (KV override PR vs roadmap-data PR)

**Symptom:** PR merges but roadmap monitor still shows "In Progress".

**Cause:** `fetchAllPrStatuses()` filtered to `items where item.pr != null`. Items kicked off via the UI store their PR number in KV overrides (`hyh:roadmap-overrides`), not in `roadmap-data.ts`. The GitHub merge check never ran for these items.

**Fix:** Fetch overrides first, pass to `fetchAllPrStatuses` which now checks `item.pr ?? override.pr`.

---

## 2026-04-05 — Agents don't push commits without explicit instruction

**Symptom:** Agent implements everything locally but nothing appears in the PR.

**Cause:** `claude-code-action` doesn't automatically push. Agent needs explicit `git push` step.

**Fix:** Add to every agent prompt:
```
7. git add -A && git commit -m "feat: ..."
8. git push origin HEAD
```

---

## 2026-04-04 — Wrong default branch (was a feature branch, not main)

**Symptom:** PRs targeting wrong base branch; main not updating.

**Cause:** Repo's default branch was set to `feat/bookmarks-mock-gate-openai-scorer` (first branch pushed). Fixed 2026-04-04 — `main` is now the default.

**Always target `main` for all PRs.**

---

## OG image fonts: woff2 not supported by Satori

**Symptom:** `next/og` throws "Unsupported OpenType signature wOF2"

**Fix:** Use woff (not woff2) from `@fontsource` v4.x:
```
https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.15/files/inter-latin-400-normal.woff
```

---

## Apify: maxItems must be a query param, not body param

**Symptom:** Apify ignores maxItems limit, returns full dataset.

**Fix:** Pass as query param: `?maxItems=N` on the run URL, not in the request body.

---

## Resend: 429 rate limit when sending multiple emails

**Symptom:** Second+ emails in a batch fail with 429.

**Fix:** Send emails sequentially with a small delay, not `Promise.all`. See `lib/email.ts`.
