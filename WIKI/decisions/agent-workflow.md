---
type: decision-record
tags: [agent-workflow, github-actions, claude-code-action]
related: [../gotchas.md, ../agents.md, ~/.claude/wiki/patterns/agent-patterns.md]
date: 2026-04-05
last-updated: 2026-04-05
---

# Decision: Agent Workflow Architecture

## What We Built

A GitHub Actions-based system that automatically implements roadmap items using Claude Code. Triggered from the roadmap monitor UI (`/monitor/roadmap`), it:
1. Creates a feature branch from `main`
2. Commits an `.agent-task` file (init commit so PR can be opened)
3. Opens a draft PR
4. Dispatches `agent.yml` workflow to implement the item

## Key Files

- `.github/workflows/agent.yml` — the workflow
- `app/api/monitor/kickoff/route.ts` — UI trigger → branch + PR + dispatch
- `app/api/monitor/retry/route.ts` — re-dispatch on failure
- `lib/roadmap-data.ts` — `buildAgentPrompt()`, `contextFiles[]` per item

## Debugging History (2026-04-05)

This took a full session to get right. Three separate bugs:

### Bug 1: Missing `id-token: write`

`claude-code-action@beta` uses OIDC to mint a GitHub token. Without `id-token: write` in the workflow permissions, this fails immediately. Error message is clear but easy to miss.

### Bug 2: `prompt` vs `direct_prompt`

The action's input is named `direct_prompt`. We had `prompt`. The wrong key is silently ignored — the action receives an empty prompt and does nothing. No error message.

### Bug 3: `mode: agent` missing

Default mode is `tag` (for comment-triggered runs). `workflow_dispatch` events require `mode: agent`. Without it, the action exits with "Tag mode cannot handle workflow_dispatch events."

### Bug 4: Dispatching from feature branch ref

`workflow_dispatch` uses the workflow file from the specified `ref`. We were dispatching with `ref: branch` — so it ran the old, broken workflow file on the feature branch, not the fixed one on `main`. Fixed by always using `ref: "main"` and letting the checkout step inside the workflow handle branch switching.

## Current Working Config

```yaml
permissions:
  contents: write
  pull-requests: write
  id-token: write

- uses: anthropics/claude-code-action@beta
  with:
    mode: agent
    direct_prompt: ${{ inputs.prompt }}
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    allowed_tools: "Bash,Read,Write,Edit,Glob,Grep"
    timeout_minutes: "30"
```

Dispatch (from kickoff/retry routes):
```typescript
body: JSON.stringify({
  ref: "main",  // always main
  inputs: { item_id, branch, pr_number, prompt }
})
```
