---
title: Onboarding Guide
type: guide
status: active
scope: project
tags:
  - onboarding
  - setup
related:
  - tech-stack
  - vercel_deployment_guide
  - supabase_setup_guide
updated: "2026-06-21"
---

# Onboarding Guide

| Metadata | |
|---|---|
| Last updated | 2026-06-18 |
| Audience | New developers joining the GameDeals project |

## Prerequisites

- **Node.js** 22+ (LTS)
- **pnpm** 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- **PostgreSQL** 16 (local or Supabase project)
- **Git** + GitHub access to `EmiyaKiritsugu3/game_deals`

## Quick Start (10 minutes)

```bash
# 1. Clone + install
git clone https://github.com/EmiyaKiritsugu3/game_deals.git
cd game_deals
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill in: DATABASE_URL, Supabase keys, CRON_SECRET

# 3. Run migrations
pnpm db:migrate

# 4. Start dev server
pnpm dev
# → http://localhost:3000
```

## Repository Structure

```
game_deals/
├── src/
│   ├── app/              # App Router (pages, layouts, API routes)
│   │   ├── page.tsx      # Home page (ISR, revalidate=3600)
│   │   ├── layout.tsx    # Root layout (fonts, metadata, providers)
│   │   ├── game/[id]/    # Game detail (SSR, dynamic metadata)
│   │   ├── api/cron/     # Cron endpoints (CRON_SECRET protected)
│   │   └── ...
│   ├── components/       # React components (server by default)
│   │   ├── game/         # Game detail sub-components
│   │   ├── navbar/       # Navbar sub-components
│   │   └── ui/           # Shared UI primitives
│   ├── actions/          # Server Actions
│   ├── hooks/            # TanStack Query hooks
│   ├── store/            # Zustand stores (client state)
│   ├── db/               # Drizzle ORM client + schema
│   ├── services/         # External API clients (CheapShark)
│   ├── lib/              # Configs, helpers, type definitions
│   └── utils/            # Supabase clients (server, browser, middleware)
├── tests/
│   ├── e2e/              # Playwright (browser tests)
│   ├── unit/             # Component tests (jsdom)
│   └── setup.ts          # jest-dom matchers
├── drizzle/              # SQL migrations
├── docs/                 # Project documentation
├── .github/              # CI workflows + PR/issue templates
└── scripts/              # Build helpers (service worker)
```

## Architecture (1000ft view)

```
Browser ←→ Next.js 16 App Router
              ├── Server Components (RSC) → CheapShark API
              ├── Server Actions → Drizzle ORM → PostgreSQL (Supabase)
              ├── API Routes → Typesense (search) / Cron jobs
              └── Client Components → Zustand + TanStack Query → Supabase Auth
```

**Key principle**: Server Components by default. `'use client'` only when needed (interactivity, hooks, browser APIs).

## Development Workflow

### Before writing code

```bash
pnpm test          # Make sure 423 tests pass
pnpm lint          # Biome check
pnpm tsc           # No (or understand existing) type errors
```

### While writing code (TDD)

```bash
# RED phase: write failing test
pnpm test -- src/your-module.test.ts

# GREEN phase: write minimal code
pnpm test:changed   # Only re-runs affected tests

# REFACTOR phase: clean up
pnpm lint:fix       # Auto-fix formatting
pnpm test:changed   # Confirm nothing broke
```

### Before pushing

```bash
pnpm check          # Full CI: lint → tsc → test → build → knip
```

### Commit convention

| Type | When |
|------|------|
| `feat(scope):` | New feature |
| `fix(scope):` | Bug fix |
| `refactor(scope):` | Code restructuring (no behavior change) |
| `test(scope):` | Test addition/modification (RED phase) |
| `docs:` | Documentation changes |
| `chore:` | Tooling, config, dependencies |

## Key Conventions

- **File names**: kebab-case (`game-card.tsx`, `use-deals.ts`)
- **Components**: Server by default, `'use client'` only when needed
- **Imports**: `@/` path alias → `src/`
- **Strings**: No emojis in user-facing strings unless explicitly designed
- **Numbers**: `Number.parseFloat` / `Number.parseInt` (not global `parseInt`)
- **Types**: Strict TypeScript, no `any` without explicit comment
- **Database**: snake_case columns (PostgreSQL convention)
- **Formatting**: Biome (sole linter), single quotes, trailing commas ES5, 100 char width

## Testing

| Layer | Location | Environment | Example |
|-------|----------|-------------|---------|
| Pure functions | `src/utils/*.test.ts` | node | `pricing.test.ts` |
| Server Actions | `src/actions/*.test.ts` | node | `deals.test.ts` |
| Zustand stores | `src/store/*.test.ts` | node | `wishlistStore.test.ts` |
| React hooks | `src/hooks/*.test.tsx` | jsdom | `useWishlistGames.test.tsx` |
| Components | `tests/unit/components/*.test.tsx` | jsdom | `Navbar.test.tsx` |
| E2E | `tests/e2e/*.spec.ts` | Playwright | `alerts.spec.ts` |

## Documentation Map

| Doc | What it covers |
|-----|---------------|
| `README.md` | Quick overview, commands, env vars |
| `AGENTS.md` | AI agent instructions, session learnings |
| `CONTRIBUTING.md` | Contribution guide, code style |
| `docs/index.md` | Documentation hub |
| `docs/architecture/` | C4 diagrams, data flow |
| `docs/adr/` | Architecture Decision Records |
| `docs/api-reference.md` | API endpoints + Server Actions |
| `docs/database-schema.md` | ER diagram, table reference |
| `docs/test-strategy.md` | Test philosophy, tiers, CI gates |
| `docs/security/threat-model.md` | STRIDE threat model |
| `docs/runbook.md` | Operational procedures |
| `docs/release-process.md` | Release checklist |
| `docs/technical-debt.md` | Known issues + resolution history |
| `docs/monitoring.md` | Sentry, Vercel Analytics setup |
| `docs/seo.md` | Metadata, structured data, sitemap |
| `docs/accessibility.md` | WCAG status, gaps, testing |

## Common Tasks

### Add a new page

1. Create `src/app/my-page/page.tsx`
2. Add `export const metadata = { title: '...' }` (or `generateMetadata` for dynamic)
3. Test with `pnpm dev`
4. Add test in `tests/unit/app/`

### Add a database column

1. Edit `src/db/schema/*.ts`
2. Run `pnpm db:generate` → creates migration in `drizzle/`
3. Run `pnpm db:migrate` → applies to local DB
4. Update TypeScript types if needed

### Add a cron job

1. Create `src/app/api/cron/my-job/route.ts`
2. Use `CRON_SECRET` header guard (import from `@/lib/cron-auth`)
3. Use `Promise.race` timeout pattern
4. Test with `src/app/api/cron/my-job/route.test.ts`
5. Configure schedule in Vercel Dashboard

## Getting Help

- **Architecture questions**: Check `docs/adr/` for decisions
- **Code patterns**: `grep -r "pattern" src/` to find examples
- **Build issues**: Check `AGENTS.md` session learnings section
- **Database issues**: `pnpm db:studio` opens visual DB browser
