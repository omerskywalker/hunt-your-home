<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-stack -->
# UI Library Stack

These packages are installed and ready to use — prefer them over custom implementations:

- **shadcn/ui** — component library built on Radix UI. Components live in `components/ui/`. Currently scaffolded: `button`, `card`, `badge`, `switch`, `slider`, `tabs`. Add more with `npx shadcn@latest add <component>`.
- **lucide-react** — icon set. Import icons directly: `import { Home, Search } from 'lucide-react'`.
- **recharts** — charting library. Use for price history sparklines, data visualizations on listing cards.
- **framer-motion** — animation library. Use for subtle entrance animations and transitions.
<!-- END:ui-stack -->
