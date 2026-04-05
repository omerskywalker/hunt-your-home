---
type: decision-record
tags: [context-injection, agent-workflow, token-efficiency]
date: 2026-04-05
last-updated: 2026-04-05
---

# Decision: Context Injection

See [roadmap-system.md](roadmap-system.md#context-injection-system) for full details.

## Adding Context Files to a New Item

In `lib/roadmap-data.ts`, each item has:
```typescript
contextFiles: [
  "path/to/file-to-modify.ts",
  "path/to/another-file.tsx",
  "tests/filters.test.ts",   // always include a test example
]
```

**Rules for choosing files:**
- Include every file the agent will modify
- Include every lib file it reads from (storage, types)
- Always include one existing test file as a pattern example
- Do NOT include files the agent won't touch — prompt size matters
- Keep total under ~600 lines across all files (roughly 15k tokens)

## Adding gotchas.md to the Injected Context

`WIKI/gotchas.md` is always fetched and appended after the source files. Update it whenever an agent run reveals a new failure mode.
