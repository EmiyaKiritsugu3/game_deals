# CLAUDE.md

Game deal aggregator. Next.js 16 App Router, React 19, Supabase SSR auth, Drizzle ORM, TanStack Query. CheapShark API + Typesense search.

## Commands

```bash
pnpm dev                  # Start dev server (Turbopack)
pnpm build                # Production build
pnpm lint                 # Biome check (no fix)
pnpm lint:fix             # Biome check + auto-fix
pnpm format               # Biome format
pnpm test                 # Vitest unit tests
pnpm test:watch           # Vitest in watch mode
pnpm test:e2e             # Playwright E2E tests
pnpm db:generate          # Drizzle Kit generate migration
pnpm db:migrate           # Drizzle Kit apply migrations
pnpm db:push              # Drizzle Kit push schema directly (dev)
pnpm db:studio            # Drizzle Kit Studio (visual DB browser)
```

## Conventions

- Biome only. No ESLint/Prettier. Single quotes, trailing commas ES5, 100 char width.
- `@/*` → `./src/*` (tsconfig paths).
- `Number.parseFloat` / `Number.parseInt` over global `parseFloat`/`parseInt`.
- `node:path` over bare `path` for Node built-ins.
- Kebab-case files. Server Components default — `'use client'` only when needed.
- English strings. DB columns **snake_case** (PostgreSQL convention).
- No `any` without comment. Recharts formatters are the known exception.
- Validate inputs at trust boundaries — actions are server-side, never trust raw client strings.

## Architecture

```
src/
  services/     # API clients (CheapShark, HLTB, Typesense, game enrichment)
  actions/      # Server Actions — deals, search, alerts, playlists, gamification
  hooks/        # TanStack Query wrappers (useDeals, useWishlistGames, usePriceHistory)
  store/        # Zustand (auth, wishlist, alerts) — localStorage ↔ Supabase sync
  components/   # UI — modals use CSS @keyframes, Discord icon is inline SVG
  lib/          # Typesense client, affiliate config, chart data, rate limit
  db/           # Drizzle singleton + schema files (barrel export via index.ts)
```

## Watch Out

- **Never `pnpm dev` in parallel subagents** — Next.js 16 + Turbopack allocates 30GB virtual mem. Use `pnpm build && pnpm start`.
- **CI uses BASE branch workflow** — env vars on feature branch won't take effect until merged. Use `gh secret set`.
- **Never trust `rtk lint`** — verify with `./node_modules/.bin/biome check .`
- **SonarCloud ≠ Biome** — SonarCloud ignores `// biome-ignore`. Fix root cause.
- **Biome suppress comments** — inline `// biome-ignore` on same line only. JSX `{/* */}` before element, never between attributes.
- **Service role key** leaked in past commits — verify rotation after GitGuardian alerts.
- **`.env.example`** must match what code reads — past mismatch caused silent CI failure.
