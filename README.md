# GameDeals 🎮

Game deal aggregator — Next.js 16, Supabase SSR, Drizzle ORM, TanStack Query, Typesense.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Supabase) + Drizzle ORM |
| Auth | Supabase SSR (server + browser client) |
| Data | CheapShark API |
| Search | Typesense (fallback CheapShark) |
| Client State | Zustand (wishlist, auth, alerts) |
| Server Data | TanStack Query |
| Linter/Formatter | Biome (sole — no ESLint/Prettier) |
| Dead Code | Knip |
| Audit | Fallow |
| E2E | Playwright |
| Unit (node) | Vitest |
| Component (jsdom) | Vitest + React Testing Library |
| Git Hooks | Husky v9 + lint-staged |
| PWA | Serwist (service worker + offline page) |
| Theme | next-themes (dark/light/system) |
| Analytics | Vercel Web Analytics |

## Commands

```bash
pnpm dev                  # Dev server (Turbopack)
pnpm build                # Production build (needs .env.local)
pnpm start                # Production server
pnpm lint                 # Biome check
pnpm lint:fix             # Biome check + auto-fix
pnpm format               # Biome format
pnpm test                 # Vitest unit (681 tests)
pnpm test:watch           # Vitest watch
pnpm test:coverage        # Vitest with coverage
pnpm test:e2e             # Playwright E2E
pnpm test:e2e:visual         # Playwright visual regression
pnpm test:e2e:visual:update   # Update visual baselines (manual)
pnpm check                # Local full CI (lint→tsc→test→build→knip→fallow)
pnpm knip                 # Dead code analysis
pnpm audit                # pnpm audit --audit-level=high
pnpm fallow:audit         # Fallow security audit
pnpm db:generate          # Drizzle Kit generate migration
pnpm db:migrate           # Drizzle Kit apply migrations
pnpm db:push              # Drizzle Kit push schema (dev)
pnpm db:studio            # Drizzle Studio (visual DB browser)
```

## Local CI

Pre-commit: `pnpm exec lint-staged` (Biome format on staged files).
Pre-push: `pnpm check` (lint → tsc → test → build → knip → fallow).
CI (GitHub Actions): `.github/workflows/ci.yml` — same steps.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL (Supabase) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron | Service role key |
| `CRON_SECRET` | Cron | Protects `/api/cron/*` endpoints |
| `TYPESENSE_ADMIN_KEY` | Search | Admin key (server-side) |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | Search | Search-only key (client-safe) |
| `NEXT_PUBLIC_TYPESENSE_URL` | Search | Typesense host |

## Structure

```
src/
  app/              # App Router (layout + pages + routes)
    api/cron/       # Cron endpoints (CRON_SECRET)
    @modal/         # Intercepted route modal
    game/[id]/      # Game detail
    out/            # Affiliate redirect
    wishlist/       # Wishlist (protected)
    alerts/         # Price alerts (protected)
    search/         # Search
    bundles/        # Bundles
    collections/    # Collections
  actions/          # Server Actions
  components/       # React components
  db/               # Drizzle client + schema
  hooks/            # TanStack Query hooks
  lib/              # Configs (Typesense, affiliates)
  services/         # API client (CheapShark)
  store/            # Zustand stores
  utils/            # Supabase clients (server/middleware/browser)
```

## Structure (test)

```
tests/
  e2e/              # Playwright E2E + visual regression tests
    alerts.spec.ts  # 6 alerts page + cron E2E tests
    visual.spec.ts  # 6 visual regression snapshots
  unit/             # Vitest component tests (jsdom)
    app/            # App component tests
  setup.ts          # jest-dom matchers for component tests
playwright.config.ts   # Playwright configuration (maxDiffPixels, webServer)
vitest.config.ts       # Vitest configuration (node + jsdom per-file)
```

## Stats

- **Tests**: 681 (59.29%→70.45% lines / 49.5%→59.96% branches)
- **SonarQube**: 0 open issues
- **Fallow CRITICAL**: 0 (was 1)
- **Knip unused types**: 0 (was 9)
- **Unused exports**: 0 (was 4)
- **Maintainability**: 91.2

## Documentation

| Document | Description |
|----------|-------------|
| [Index](docs/index.md) | Documentation overview |
| [Architecture](docs/index.md#architecture) | Architectural decisions and C4 diagrams |
| [Release Process](docs/release-process.md) | Release and rollback checklist |
| [API Reference](docs/api-reference.md) | Endpoint and Server Action reference |
| [Runbook](docs/runbook.md) | Operational procedures and troubleshooting |
| [Glossary](docs/glossary.md) | Domain terms and concepts |
| [Contributing](CONTRIBUTING.md) | Contribution guide |
| [Use Cases](docs/use-cases.md) | System usage flows |
| [Test Strategy](docs/test-strategy.md) | Testing strategy |
| [Threat Model](docs/security/threat-model.md) | STRIDE threat model |
| [Templates](docs/templates/README.md) | Postmortem and PR/FAQ templates |
| [Session — PR #12](docs/reports/pr12-session-report.md) | P0 notifications pipeline + audit fixes |
| [Session — PR #14](docs/reports/pr14-session-report.md) | Audit gap-closure + 207 tests + 0 CRITICAL |
| [Session — PR #15](docs/reports/pr15-session-report.md) | Price alerts end-to-end: /alerts page, cron infra, type safety, component tests |
| [Sprint 6 — Coverage](docs/reports/sprint6-coverage-report.md) | Coverage push 50.7%→59.29%, 13 new test files, methodology archiving |
