---
type: agent-guide
tags: [agents, agent-workflow, context]
related: [gotchas.md, decisions/agent-workflow.md, ~/.claude/wiki/patterns/agent-patterns.md]
last-updated: 2026-04-05
---

# Agent Guide — HuntYourHome

> You are a GitHub Actions Claude Code agent implementing a roadmap item.
> Read this file, then `WIKI/gotchas.md`, then start implementing.

---

## Your Environment

- **OS:** Ubuntu (GitHub Actions runner)
- **Node:** 20 (upgrading to 24 by June 2026)
- **Package manager:** pnpm 9
- **Working directory:** `/home/runner/work/hunt-your-home/hunt-your-home`
- **Branch:** Already checked out for you (the feature branch)

## What's Pre-Injected in Your Prompt

At kickoff time, the server fetches and injects:
1. The source files listed in `contextFiles[]` for your roadmap item
2. `WIKI/gotchas.md` (so you don't repeat history)

**Do not use the Read tool on files already in your prompt.** This wastes turns.

## Test Setup

```bash
pnpm test           # run all tests
pnpm tsc --noEmit   # type-check
```

Available testing packages:
- `vitest` (runner, jsdom environment)
- `@testing-library/react` (component testing)
- `@testing-library/jest-dom` (custom matchers)

Required mocks for component tests:
```tsx
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
    aside: ({ children, ...p }: React.HTMLAttributes<HTMLElement>) => <aside {...p}>{children}</aside>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
```

## Required Completion Steps

After implementing, always run these in order:
```bash
pnpm test              # must pass — including your new tests
pnpm tsc --noEmit      # must be clean
git add -A
git commit -m "feat: {title}\n\nCloses #{issue}"
git push origin HEAD
```

Then update the wiki:
```bash
# Append to WIKI/sessions/$(date +%Y-%m-%d).md
# Add any new gotchas to WIKI/gotchas.md
git add WIKI/
git commit -m "chore: update wiki after {item-id} implementation"
git push origin HEAD
```

## Design Rules

Always follow the design system in `WIKI/index.md`. Key rules:
- Colors: use exact hex values from the token table — never invent new ones
- Fonts: Space Grotesk for headings, Inter for body, JetBrains Mono for code
- App name rendering: `Hunt` (#8B949E) `Your` (#E6EDF3 bold) `Home` (#39D353 bold)
- Never use emoji unless already present in that component

## What NOT to Do

- Don't add features beyond what the roadmap item specifies
- Don't add error handling for impossible scenarios
- Don't add comments explaining what code does — only explain *why* for non-obvious logic
- Don't create new utility functions for one-off operations
- Don't add `console.log` statements
- Don't modify files outside the scope of your item (check the `contextFiles` list)
