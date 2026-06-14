# Contributing to GameDeals

## Welcome

Thanks for your interest in GameDeals — a game deal aggregator built with Next.js 16 (App Router), Supabase SSR auth, Drizzle ORM, TanStack Query, and Typesense search.

Before contributing, read **[AGENTS.md](./AGENTS.md)** for detailed architecture, data flow layers, conventions, and session learnings.

## Prerequisites

- **Node.js 20+** (project uses `>=22.13.0`)
- **pnpm** (project uses `pnpm@11.5.3` — enable via `corepack enable && corepack prepare pnpm@11.5.3 --activate`)
- **PostgreSQL** (local or Supabase remote)
- A Supabase project (for auth + database)

## Development Setup

```bash
git clone <repo-url>
cd game-deals
pnpm install              # installs deps + sets up Husky hooks
cp .env.example .env.local
pnpm dev                  # start dev server (Turbopack)
```

Environment variables are documented in **[README.md](./README.md#environment-variables)**. You'll need a Supabase project and (optionally) a Typesense instance for search features.

## Project Structure

```
src/
  app/              # App Router — pages, layouts, API routes
    api/cron/       # Cron endpoints (protected by CRON_SECRET)
    @modal/         # Intercepted route modals
    game/[id]/      # Game detail page
    out/            # Affiliate redirects
    wishlist/       # Protected wishlist
    search/         # Search results
    bundles/        # Bundle deals
    collections/    # Curated collections
  actions/          # Server Actions
  components/       # React components
  db/               # Drizzle ORM client + schema
  hooks/            # TanStack Query hooks
  lib/              # Configs (Typesense, affiliate mappings)
  services/         # CheapShark API client
  store/            # Zustand stores (wishlist, auth, alerts)
  utils/            # Supabase clients (server, browser, middleware)
```

## Code Style

- **Linter/Formatter**: Biome (sole tool — no ESLint, no Prettier)
- **Quotes**: Single quotes (`'`), JSX uses double quotes
- **Trailing commas**: ES5 style
- **Line width**: 100 chars
- **TypeScript**: Strict mode. No `any` types (exception: Recharts formatters which require `any` by library API constraint)
- **Imports**: `node:path` over bare `path` for Node.js built-ins
- **Files**: kebab-case for components and routes
- **Server Components** by default — add `'use client'` only when needed
- **User-facing strings**: English (en_US)
- **Database columns**: snake_case (PostgreSQL convention)

Run formatting:
```bash
pnpm lint          # Biome check (no fix)
pnpm lint:fix      # Biome check + auto-fix
pnpm format        # Biome format
```

## Testing

```bash
pnpm test           # Vitest unit tests
pnpm test:watch     # Vitest in watch mode
pnpm test:coverage  # Vitest with coverage report
pnpm test:e2e       # Playwright E2E tests
```

- Unit tests use **Vitest** and live co-located with source files (`*.test.ts`).
- E2E tests use **Playwright** and live in `e2e/` or `tests/`.
- Coverage is enforced by the CI pipeline via `pnpm test:coverage`.

## Pre-commit & Pre-push Hooks

Installed automatically by `pnpm install` (via Husky v9 + `lint-staged`):

- **Pre-commit**: Biome check + format on staged files (`*.{js,ts,tsx,jsx,mjs,cjs,json,css,md}`).
- **Pre-push**: Full local CI — `pnpm check` runs `lint → tsc → test → build → knip → fallow`. Stops on first failure.

To run the full check manually:
```bash
pnpm check
```

## Pull Request Process

1. **Branch**: Create a feature branch from `main` (`feat/my-feature`, `fix/my-bug`, etc.).
2. **One concern per PR**: Keep changes focused on a single fix, feature, or refactor.
3. **CI must pass**: All checks in `pnpm check` must succeed (lint, TypeScript, tests, build).
4. **UI changes**: Include screenshots or screen recordings.
5. **Review**: At least one maintainer review required before merge.
6. **Merge**: Squash-merge preferred. Keep commit history clean.

## Commit Messages

Use **Conventional Commits** format:

```
feat: add price alert notification
fix: correct wishlist sync race condition
refactor: extract deal card component
docs: update README setup instructions
chore: bump dependencies
```

Structure: `<type>: <imperative description>` (lowercase, no period at end).

### Types

| Type       | Usage                          |
|------------|--------------------------------|
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `refactor` | Code change that isn't a fix or feature |
| `docs`     | Documentation changes          |
| `test`     | Adding or updating tests       |
| `chore`    | Tooling, deps, CI config       |
| `style`    | Formatting, linting (no logic change) |

## Reporting Issues

- Search existing issues before opening a new one.
- Use a clear, descriptive title.
- Include: steps to reproduce, expected vs actual behavior, environment (OS, browser, Node version).
- For crashes: include error logs and reproduction URL if possible.
- Label appropriately (`bug`, `enhancement`, `question`).

---

**Questions?** Open a discussion or reach out via GitHub Issues.
