# CLAUDE.md

Game deal aggregator. Next.js 16 App Router, React 19, Supabase SSR auth, Drizzle ORM, TanStack Query. CheapShark API + Typesense search.

**Runtime:** Bun 1.3.13. `bun run` for scripts, `bunx` for tools.

## Commands

```bash
bun dev                   # Start dev server (Turbopack)
bun --bun next build      # Production build
bun run lint              # Biome check (no fix)
bun run lint:fix          # Biome check + auto-fix
bun run format            # Biome format
bun run test              # Vitest unit tests
bun run test:watch        # Vitest in watch mode
bun run test:e2e          # Playwright E2E tests
bun run db:generate       # Drizzle Kit generate migration
bun run db:migrate        # Drizzle Kit apply migrations
bun run db:push           # Drizzle Kit push schema directly (dev)
bun run db:studio         # Drizzle Kit Studio (visual DB browser)
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
- **Tailwind v4 only for styling. Zero CSS modules.** `@theme` block in `globals.css` for design tokens and `@keyframes`. No `.module.css` files.
- CSS `@keyframes` defined in `globals.css` `@theme` block as `--animate-*` tokens. Use Tailwind classes like `animate-fade-slide-in`, `animate-heart-burst`, etc. No JS animation libraries.

## Architecture

```
src/
  services/     # API clients (CheapShark, HLTB, Typesense, game enrichment)
  actions/      # Server Actions — deals, search, alerts, playlists, gamification
  hooks/        # TanStack Query wrappers (useDeals, useWishlistGames, usePriceHistory)
  store/        # Zustand (auth, wishlist, alerts) — localStorage ↔ Supabase sync
  components/   # UI — shadcn Dialog, Button, Card, Badge, Tooltip. Discord icon is inline SVG.
  lib/          # Typesense client, affiliate config, chart data, rate limit
  db/           # Drizzle singleton + schema files (barrel export via index.ts)
```

## Dependencies

- Removed: gsap, motion (motion/react), tw-animate-css, cmdk, esbuild, shadcn (CLI tool)
- shadcn/tailwind.css custom variants inlined directly in `globals.css` as `@custom-variant` blocks
- Components/ui/ — badge, button, card, dialog, tooltip. 10 dead shadcn/ui files removed.
- Motion-enabled components from `components/motion/` removed (was AnimatedDiv).
- BaseModal.tsx removed (replaced by shadcn Dialog).

## Watch Out

- **Never `bun dev` in parallel subagents** — Next.js 16 + Turbopack allocates 30GB virtual mem. Use `bun --bun next build && bun start`.
- **CI uses BASE branch workflow** — env vars on feature branch won't take effect until merged. Use `gh secret set`.
- **Never trust `rtk lint`** — verify with `./node_modules/.bin/biome check .`
- **SonarCloud ≠ Biome** — SonarCloud ignores `// biome-ignore`. Fix root cause.
- **Biome suppress comments** — inline `// biome-ignore` on same line only. JSX `{/* */}` before element, never between attributes.
- **Service role key** leaked in past commits — verify rotation after GitGuardian alerts.
- **`.env.example`** must match what code reads — past mismatch caused silent CI failure.
- **PWA service worker excludes `/api/`, `/auth/`, `/out/`** — never cache sensitive paths.
- **E2E flaky tests** — CheapShark 429 rate limits cause game data failures. Use `test.skip()` with game title visibility check before tests that depend on game/alert buttons.
- **game-deals-research** repo privado em `~/dev/game-deals-research/` — pipeline de conteúdo externo, não integrado.
- **`bun run lint` may fail in pre-push hook** — hook runs `biome check .` directly. Run `./node_modules/.bin/biome check .` if pre-push fails.
- **SonarCloud false positives on globals.css** — `sonar-project.properties` excludes `src/app/globals.css`. Tailwind v4 `@custom-variant` blocks trigger 16 false "missing scoping root" bugs.
- **Do NOT add `.module.css` files** — all styling is Tailwind utilities + CSS custom properties in `globals.css`.
