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
| Unit | Vitest |
| Git Hooks | Husky v9 + lint-staged |

## Commands

```bash
pnpm dev                  # Dev server (Turbopack)
pnpm build                # Production build (needs .env.local)
pnpm start                # Production server
pnpm lint                 # Biome check
pnpm lint:fix             # Biome check + auto-fix
pnpm format               # Biome format
pnpm test                 # Vitest unit
pnpm test:watch           # Vitest watch
pnpm test:coverage        # Vitest with coverage
pnpm test:e2e             # Playwright E2E
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
