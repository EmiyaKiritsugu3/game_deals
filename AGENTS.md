# AGENTS.md

This file provides guidance to OpenCode agent when working with code in this repository.

## Repository Overview

GameDeals is a game deal aggregator built with Next.js 16 App Router (React 19), Supabase SSR auth, Drizzle ORM, and TanStack Query. Data source is CheapShark API with Typesense search acceleration. Tests: 423 (Vitest) + Playwright visual regression + E2E.

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
pnpm test:coverage        # Vitest with coverage
pnpm knip                 # Dead code analysis
pnpm fallow:audit         # Fallow audit (complexity, duplication)
pnpm db:generate          # Drizzle Kit generate migration
pnpm db:migrate           # Drizzle Kit apply migrations
pnpm db:push              # Drizzle Kit push schema directly (dev)
pnpm db:studio            # Drizzle Kit Studio (visual DB browser)
pnpm test:e2e:visual      # Playwright visual regression
```

Biome is the sole linter/formatter. No ESLint or Prettier. Single quotes, trailing commas ES5, 100 char line width. Strict TypeScript.

## Development Methodology

Non-negotiable rules from [.sisyphus/methodology.md](./.sisyphus/methodology.md) v1.1.
Violating any of these = incomplete work.

### Agent Architecture

| Rule | Detail |
|------|--------|
| **Planejar ≠ Executar** | Orquestrador decompõe tarefas, NUNCA escreve código. Exceção: single-file tasks. |
| **Batch por complexidade** | ~3K tokens de contexto por agente. 3-5 arquivos (alta complexidade), 5-8 (média), 8-12 (baixa). NUNCA 1 agente por arquivo. |
| **Worktree isolado** | Todo agente de escrita opera em worktree próprio. Nunca shared filesystem. |
| **Máx 2 níveis** | Orquestrador → agente. Agente NÃO spawna subagentes. |
| **Erro estrutural = escala** | Missing dep, type error → escala imediatamente. NUNCA retry. |

### Code Quality

| Rule | Detail |
|------|--------|
| **Edge Case Enumeration** (código existente) | Agente lê fonte → enumera 3+ edge cases → escreve testes. NADA de RED falso. |
| **TDD estrito** (código novo/bugfix) | RED (falha genuinamente) → GREEN (mínimo pra passar) → REFACTOR. |
| **Quem escreve NÃO revisa** | REVIEW agent: sessão isolada, vê SÓ diff + contrato. NUNCA o raciocínio do BUILD. |
| **1 commit por arquivo** | Subject ≤50 chars: `test(scope): N tests (X% branch)`. Edge cases no corpo. |
| **NUNCA test.skip()/test.todo()** | Cobertura real, não decorativa. |

### Verification Gates

```
Gate local (pré-push, ~60s):
  biome check .          → 0 errors
  tsc --noEmit           → 0 errors
  pnpm test -- --run     → ALL pass
  pnpm test:coverage     → thresholds met
  SonarQube local        → 0 new issues vs baseline

Gate CI (GitHub Actions, bloqueia merge):
  quality job: biome → tsc → test → coverage → build → knip → fallow → SonarCloud
  e2e job: build → Playwright

Gate noturno (3am UTC, main apenas):
  mutation → audit → e2e-full → coverage-trend
```

| Rule | Detail |
|------|--------|
| **Nada sai sem gate** | Nenhum agente declara "pronto" — só output de ferramenta vale. |
| **Branch ≥85% por arquivo** | Piso mínimo. Coverage de linha é necessário mas insuficiente. |
| **0 new SonarQube issues** | Baseline: 13 issues. Sprint N não introduz issues novas. |
| **Threshold só sobe se coverage ≥ novo valor** | Commit separado com `--no-verify`. |
| **Máx 3 iterações no gate** | 4ª falha → escalar para humano. |
| **Timeout 5min** | Gate que não completa em 5min = FAIL. |

### Token Economy

| Rule | Detail |
|------|--------|
| **Exploração = background** | Pesquisa de codebase NUNCA no chat principal. Use explore agents. |
| **Compressão de contexto** | Após 50% da janela, compactar. |
| **Sessão nova = tarefa nova** | Sessões longas degradam performance. |
| **Output de comando filtrado** | `grep`/`tail`/`--json` — nunca output bruto de 3000 linhas. |

## Architecture

### Path alias

`@/*` maps to `./src/*` (tsconfig paths).

### App Router structure

```
src/app/
  layout.tsx              # Root layout: fonts, metadata, JSON-LD, providers, Navbar, SyncManager
  page.tsx                # Home page — server component with ISR (revalidate=3600)
  @modal/(.)game/[id]/    # Intercepted route — game detail modal overlay
  game/[id]/              # Full game detail page
  out/[storeId]/[slug]/   # Affiliate redirect route (cloaked /out links)
  wishlist/               # Protected wishlist pages
  wishlist/shared/        # Shared wishlist (public, base64-encoded game IDs)
  api/cron/
    ingest-prices/        # Cron: ingest CheapShark prices every 4h
    reindex-typesense/    # Cron: daily Typesense reindex
    check-alerts/         # Cron: check price alerts
  search/                 # Search results page
  bundles/                # Bundle deals listing
  collections/[slug]/     # Curated game collections
```

### Data flow layers

1. **API Client** (`src/services/api.ts`) — raw CheapShark fetch calls (`getDeals`, `getGame`, `getStores`). All use `fetch` with Next.js `revalidate` cache options.
2. **Server Actions** (`src/actions/`) — wrapper functions for server-side logic: `deals.ts` (validation + price ingestion), `search.ts` (Typesense with CheapShark fallback), `alerts.ts` (price alert processing), `playlists.ts`, `gamification.ts`.
3. **TanStack Query Hooks** (`src/hooks/`) — client-side data fetching: `useDeals.ts`, `useWishlistGames.ts`, `usePriceHistory.ts`. Wrap Server Actions for auto-refetch, caching, loading/error states.
4. **Zustand Stores** (`src/store/`) — client state: `authStore.ts` (Supabase user + lazy init), `wishlistStore.ts` (localStorage ↔ Supabase sync), `alertStore.ts` (price alerts).
5. **Components** (`src/components/`) — Navbar, Charts, SyncManager, AuthModal, CookieBanner, WishlistIndicator.

### Database (PostgreSQL via Supabase + Drizzle ORM)

- **Singleton client** at `src/db/index.ts` — `postgres` pool + `drizzle()` wrapper. All code uses this single `db` export.
- **Schema files** at `src/db/schema/`: `users.ts`, `games.ts`, `deals.ts`, `price_history.ts`, `affiliates.ts`, `playlists.ts`, `gamification.ts`. Barrel export via `index.ts`.
- **Migrations** at `drizzle/` — SQL files generated by `drizzle-kit generate`.
- Connection: `DATABASE_URL` env var, uses pgBouncer-compatible `postgres` client.

### Supabase Auth flow

- **Middleware** (`src/middleware.ts`) — `updateSession` from `src/utils/supabase/middleware.ts` refreshes cookies, protects `/wishlist`, `/alerts`, `/playlists`, `/profile` (redirects to home if not authed).
- **Client-side auth** — lazy-init Supabase browser client in `authStore.ts`. Navbar `useEffect` hydrates from SSR user and subscribes to `onAuthStateChange`.
- Server client at `src/utils/supabase/server.ts` — for SSR pages that need authenticated user.

### Typesense search

- Client at `src/lib/typesense.ts` — admin client (server-only, `TYPESENSE_ADMIN_KEY`), search-only client (client-safe, `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY`), InstantSearch adapter.
- Search action at `src/actions/search.ts` — tries Typesense first, falls back to CheapShark search.
- Navbar debounce: 300ms via `useQueryState` + `setTimeout`.

### Affiliate system

- Config at `src/lib/affiliate-config.ts` — 17 store affiliate mappings with base URLs and params.
- Redirect route at `src/app/out/[storeId]/[gameSlug]/route.ts` — validates store ID against allowlist, validates game slug regex, redirects to store URL with affiliate params appended.
- Click logging via `affiliate_clicks` Drizzle table.

### SEO

- Metadata in root `layout.tsx` (OG, Twitter, robots).
- Dynamic sitemap at `src/app/sitemap.ts`.
- JSON-LD structured data (WebSite) in root layout.
- Page-level JSON-LD (Product) in game detail pages.
- ISR: home page `revalidate = 3600`.

### Cron endpoints

All under `src/app/api/cron/` — protected by `CRON_SECRET` header check:
- `ingest-prices/route.ts` — fetches CheapShark deals, inserts into `deals` + `price_history` tables.
- `reindex-typesense/route.ts` — fetches all games from DB, batch-indexes into Typesense.
- `check-alerts/route.ts` — queries `price_alerts` table, compares current prices, triggers notifications.

## Key conventions

- **No `any` types** without `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment.
- **`Number.parseFloat`** / **`Number.parseInt`** over global `parseFloat`/`parseInt` (SonarCloud-enforced).
- **`node:path`** over bare `path` import for Node.js built-ins.
- **Kebab-case** file names for components, **kebab-case** routes.
- Server Components by default — `'use client'` only when needed.
- User-facing strings in **English** (en_US locale).
- Database column naming uses **snake_case** (matching PostgreSQL convention), not camelCase (past cron bug: mismatch broke alert queries).

---

## Session Learnings (PR #10 Quality Fix — 2026-06-12/13)

### OOM Prevention — Dev Server in Parallel Subagent
**NEVER** launch `next-server` / `pnpm dev` inside a subagent running in parallel with others. Next.js 16 + Turbopack + Tailwind v4 can allocate 30GB virtual memory. Node.js V8 VSZ counts against kernel OOM accounting when `overcommit_memory=0`. 

**Rules**:
- Max 3 parallel subagents when any spawns child processes
- Use `pnpm build && pnpm start` (never `pnpm dev`) for E2E tests
- Check `free -h` before launching `visual-engineering` subagent
- Clean orphans: `pkill -f "next-server" && pkill -f "chromium"` after visual-engineering tasks

### CI Workflow — Branch Source
GitHub Actions `pull_request` events use the workflow file from the **BASE** branch (main), NOT the feature branch. Env vars added to workflow on feature branch won't take effect until merged to main. Use repository secrets/variables (`gh secret set` / `gh variable set`) with `${{ secrets.X }}` / `${{ vars.X }}` in workflow for immediate effect.

### Tool Verification
`rtk` is a custom CLI wrapper. It does NOT execute Biome correctly. Always verify with:
```bash
./node_modules/.bin/biome check .     # Real Biome
./node_modules/.bin/tsc --noEmit      # Real TypeScript
```
Never trust `rtk lint` / `rtk tsc` for production verification.

### SonarCloud ≠ Biome
SonarCloud does NOT read `// biome-ignore` comments. Fix the root cause rather than suppressing — a fix that satisfies Biome usually satisfies SonarCloud too. Exception: Recharts formatters require `any` (library API constraint).

### boulder.json Formatting
`json.dump()` without trailing `\n` causes Biome formatting errors in CI. Always add:
```python
json.dump(data, f, indent=2); f.write('\n')
```

### Key Security
Service role key leaked in past commits remains active. Always verify rotation after GitGuardian alerts. Check with: `curl -s -o /dev/null -w "%{http_code}" <supabase-url>/rest/v1/ --header "apikey: <KEY>"`

### .env Variable Naming
Ensure `.env.example` matches what code actually reads. Mismatch (`PUBLISHABLE_KEY` vs `ANON_KEY`) caused CI build failure silently.

### Subagent Delegation
"Quick" subagents tend to analyze instead of executing. For implementation tasks, prefix prompts with "APPLY exact edits immediately. DO NOT analyze." and provide exact code to replace.

---

## Session Learnings (PR #12 — P0 In-App Notifications + Audit — 2026-06-14)

### Check_alerts_for_all() SQL Function Was Never Wired
The `check_alerts_for_all()` SECURITY DEFINER function (created in 0002, extended in 0005) was **never called from TypeScript**. The cron route was doing a raw `SELECT` with in-memory filtering instead. Always verify that SQL functions created in migrations are actually invoked by application code — grep `SELECT * FROM function_name` across `src/`. The PR description claimed "notifications pipeline" but it was entirely dead without the TS→SQL wiring.

### Drizzle _journal.json Must Match SQL Files
`drizzle/meta/_journal.json` can get out of sync with `drizzle/*.sql` files when migrations are manually edited or created outside `drizzle-kit generate`. Key checks:
- Every SQL file must have a corresponding journal entry with matching `tag`
- `when` timestamps must be valid integers (not `Date.now()` literal)
- `drizzle-kit migrate` reads the journal; if entries are missing, migrations are skipped and the DB state diverges from code
- After adding custom SQL migrations, run `pnpm db:generate` or manually add journal entries

### Drizzle/meta Gitignore Trap
By default, `drizzle/meta/` is in `.gitignore`. But `_journal.json` is essential for `pnpm db:migrate` to work on fresh clones. Solution: change `.gitignore` from `drizzle/meta/` to `drizzle/meta/*_snapshot.json` — keep the journal tracked, exclude auto-generated snapshots.

### Notification Pipeline Architecture
The notifications system has a split architecture: the SQL function (`check_alerts_for_all()`) does the heavy lifting (locks, updates, inserts), while the TypeScript action (`checkTriggeredAlertsAction()`) is a thin wrapper that calls the function and maps column names. This works but creates a hidden dependency — changes to the SQL return type silently break the TS mapping. Consider adding a `// depends on 0005` comment at the mapping site.

### Audit-First Workflow Caught 7 Issues
Running a systematic audit (reading every diff file, checking cross-references) found issues that unit tests missed:
- Dead code (setWishlist had zero consumers — not caught by knip because Zustand persist generates indirect references)
- Missing wire (SQL function never called — tests use mocks, not real DB)
- Invalid JSON in migration journal (`Date.now()` literal — JSON.parse would crash `drizzle-kit migrate`)
- Typo in comment (Verval → Vercel — no tool catches comment typos)
- Migration risk (SET NOT NULL without defensive guard — can fail on deploy)
Oracle review then found 2 additional gaps the audit missed, proving that even a thorough audit benefits from a second reviewer.

### Migration SET NOT NULL Needs Guard
When adding `ALTER COLUMN ... SET NOT NULL` to an existing table with data, always add a defensive `DO $$` block beforehand that cleans up NULL values:
```sql
DO $$ BEGIN
  UPDATE games SET "cheapsharkId" = CONCAT('legacy_', REPLACE(id::text, '-', ''))
  WHERE "cheapsharkId" IS NULL;
END $$;
ALTER TABLE "games" ALTER COLUMN "cheapsharkId" SET NOT NULL;
```
Use a placeholder derived from the row's own UUID to guarantee uniqueness.

### Biome on lint-staged + Markdown Files
Biome doesn't process `.md` files. If `lint-staged` runs `biome check --write` on `*.md`, it exits 1 ("No files processed") and blocks commits. Fix: remove `md` from lint-staged patterns.

### Fallow Suppressor Format
Multiple rules on one line: `// fallow-ignore-next-line complexity,unused-export`. Newlines between them don't work.

### Husky Pre-Push + Fallow Exit 1
Pre-push runs `pnpm check` which includes fallow. Fallow exits 1 on any finding (even inherited). CI excludes fallow. Workaround: `git push --no-verify` when findings are pre-existing. Documented in technical-debt.md.

### Tool Verification (Reinforced)
`rtk` (custom CLI wrapper) does not execute all git operations correctly. For Biome/tsc, use `./node_modules/.bin/biome` and `./node_modules/.bin/tsc` directly, never `rtk lint` / `rtk tsc`.

---

## Session Learnings (PR #14 — Audit Gap Closure — 2026-06-15)

### Playwright + Next.js RSC Streaming
Playwright visual regression with Next.js App Router + RSC streaming requires:
- `waitUntil: 'domcontentloaded'` not `'load'` (load event blocked by fonts/streaming)
- `page.screenshot` hangs waiting for fonts to load — use `page.route` to abort `.woff2` requests
- RSC sub-requests (e.g., `?_rsc=*`) can trigger middleware redirects that close the page
- Auth-required components (wishlist links in Navbar) cause page navigation on unauthed visits

### Biome + Husky SIGKILL on Large Commits
`biome check --write` in pre-commit hook can allocate enough memory to trigger OOM killer on larger commits. Use `--no-verify` when committing many files (>20).

### Audit Reports Location
All audit evidence stored in `.sisyphus/evidence/audit-gap-closure/`.
Final cumulative report: `.sisyphus/evidence/final-qa/audit-gap-closure-report.md`.

### Technical Debt Changes
- P6 (knip unused types/exports) closed: 9 unused types removed, 4 unused exports removed.
- P1 (complexity suppressions): 1 function extracted (buildGameEntry), remaining CRITICAL count: 0.

---

## Session Learnings (PR #19 — Production Freeze Fix — 2026-06-16)

### ⚠️ CRITICAL: `else logout()` in `onAuthStateChange` = Infinite Loop

**NEVER** call `logout()` (which calls `supabase.auth.signOut()`) inside the callback of `onAuthStateChange`. 

**The loop**: `onAuthStateChange` fires `SIGNED_OUT` → `logout()` → `supabase.auth.signOut()` → triggers `SIGNED_OUT` event → `onAuthStateChange` fires again → **∞**

**Correct pattern**:
```tsx
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) setUser(session.user);
  else setUser(null);  // ✅ Just clear local state. NO signOut() call.
});
```

**Wrong pattern** (FREEZES THE SITE):
```tsx
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) setUser(session.user);
  else logout();  // ❌ signOut() → SIGNED_OUT event → loop!
});
```

**Source of bug**: Commit `75fd0db` on `chore/audit-gap-closure` branch — Navbar refactor extracted auth subscription to `useAuthSubscription.ts` and changed `setUser(null)` (inline) to `else logout()` (extracted hook).

**Evidence**: Playwright test — 26s, 9 page navigations, zero auth errors. Single line change resolved the freeze.

### NuqsAdapter Already Has Internal Suspense

`NuqsAdapter` (`nuqs/adapters/next/app`) wraps `NavigationSpy` in its own `<Suspense>` internally. Placing NuqsAdapter outside an external `<Suspense>` does NOT cause BAILOUT. The external Suspense should wrap only the consumer components (Navbar/SearchBox), not NuqsAdapter itself.

### Multiple Supabase Clients = Auth State Chaos

Always use a SINGLETON `createBrowserClient` pattern:
```ts
let client: ReturnType<typeof createClient> | null = null;
export function getBrowserClient() {
  if (!client) client = createClient();
  return client;
}
```
Never: module-level `const supabase = createClient()` (AuthModal anti-pattern), separate `createClient()` calls per effect, or duplicate `getSupabase()` functions.

### Supabase `signOut()` Always Fires `SIGNED_OUT` Event

Context7-confirmed: `signOut()` fires `SIGNED_OUT` which triggers `onAuthStateChange` callback — even if no session exists. This is what makes the `else logout()` loop possible.

### Playwright + Font Blocking

Font requests (`.woff2`) can cause `page.screenshot` to hang. Use `page.route` to abort font requests before taking screenshots.

---

## Session Learnings (PR #20 — DB Schema Optimization — 2026-06-16)

### Set-Based SQL Functions Beat Cursor Loops
`check_alerts_for_all()` was rewritten from cursor-based (N+1 queries) to CTE-based set processing (4 steps in one query). The CTE chain: `alert_targets` (MIN price per alert) → `triggered` (price ≤ target) → `deduped` (UPDATE currentPrice, return matched) → `INSERT ... NOT EXISTS` (1-hour dedup). This reduces query count from O(n) to O(1).

### 64-Bit Advisory Locks via md5 → bigint
Replace `hashtext('key')` (32-bit, 2^32 collision slots) with `('x' || substr(md5('key'), 1, 16))::bit(64)::bigint` (64-bit, 2^64 slots). PostgreSQL's `pg_advisory_xact_lock()` accepts `bigint`, so the lock mechanism is identical — just with vastly more address space.

### Cron Route Timeout Pattern (Promise.race)
Standardized timeout pattern across all 3 cron routes:
```typescript
const result = await Promise.race([
  action(),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new CronError('TIMEOUT', 'action timed out after Ns')), N_000)
  ),
]);
```
Using `CronError` (from `src/app/api/cron/_lib/errors.ts`) instead of raw `Error` allows `handleCronError()` to return structured JSON with `{ error, code, timestamp }`.

### Migration Naming — Index Files vs. Function Files
- `0009_schema_optimization.sql`: Pure index additions (`CONCURRENTLY`, `IF NOT EXISTS`). Safe to apply at any time.
- `0010_optimize_check_alerts.sql`: `DROP/CREATE FUNCTION` + 64-bit lock conversion. Requires the function to exist first (depends on 0005).

Always separate migration files by concern — index changes are reversible, function changes are not.

### Schema Files Must Reflect Migrations
After adding raw SQL migrations, update Drizzle schema files to match. The `index()` calls in `pgTable()`'s third argument must stay in sync with the SQL `CREATE INDEX` statements. Drizzle does NOT auto-detect raw SQL changes.

### Test Structure for Next.js Route Handlers
Route handler tests use `vi.mock()` to mock Server Actions and auth, then call `GET(request)` with a plain `Request` object. Pattern:
```typescript
import { GET } from './route';
const response = await GET(new Request('http://localhost/api/endpoint', {
  headers: { authorization: 'Bearer valid-secret' },
}));
expect(response.status).toBe(200);
expect(await response.json()).toMatchObject({ ... });
```

### Drizzle Schema Tests Are Declarative
Schema files are pure type definitions — they define table shapes and indexes but produce no runtime code. TypeScript compilation (`tsc --noEmit`) is the only meaningful validation. Do not create artificial "schema tests" that just import and re-export — `tsc` already catches mismatches.

---

## Session Learnings (PR #19 — SonarCloud Fixes — 2026-06-17)

### React 19 Types: FormEvent Is Deprecated — Use SyntheticEvent
Both `FormEvent` and `FormEventHandler` are marked `@deprecated` in React 19 types with the message `"FormEvent doesn't actually exist"`. Forms fire native `SubmitEvent`, not `FormEvent` — the React type was always fictional.

**Wrong (S1874 — deprecated):**
```tsx
import { type FormEvent } from 'react';  // ❌ imported FormEvent
const handleSubmit = (e: FormEvent<HTMLFormElement>) => {  // ❌ deprecated usage
  e.preventDefault();
};
```

**Right (S1874 — clean):**
```tsx
const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {  // ✅ base event type
  e.preventDefault();
};
```

**Why this works**: `React.SyntheticEvent<T>` is the non-deprecated base type for all React synthetic events. It supports `preventDefault()`, `stopPropagation()`, `currentTarget`, `target`, etc. — everything a form handler needs. The React docs explicitly recommend it: *"If you need to use an event that is not included in this list, you can use the `React.SyntheticEvent` type."*

**Key insight**: Use the namespace (`React.SyntheticEvent`) not the direct import (`import { SyntheticEvent }`). This matches the pattern in React docs examples (`React.ChangeEvent<HTMLInputElement>`) and avoids import confusion.

### SonarCloud S1874 Is Not Just About Import Style
The rule fires for ANY usage of a `@deprecated` type, regardless of import style. Changing `React.FormEvent` to `import { FormEvent }` does NOT fix it — both are deprecated. The fix must replace the deprecated type entirely with a non-deprecated alternative. Always check `node_modules/@types/react/index.d.ts` for `@deprecated` tags to find the correct replacement.

### Lucide-React v0.577 Deprecated All Brand Icons — Use simple-icons
In lucide-react v0.577+, ALL brand icons (Github, Twitter, Slack, Facebook, Youtube, etc.) are `@deprecated` and will be removed in v1.0. They recommend migrating to [simple-icons](https://simpleicons.org/).

**Wrong (S1874 — deprecated):**
```tsx
import { Github, Globe, ShieldCheck } from 'lucide-react';  // ❌ Github is deprecated
<Github size={20} />
```

**Also wrong (S1874 — still deprecated):**
```tsx
import { GithubIcon, Globe, ShieldCheck } from 'lucide-react';  // ❌ GithubIcon = Github alias
<GithubIcon size={20} />
```

**Right (S1874 — clean):**
```tsx
import { siGithub } from 'simple-icons';  // ✅ official simple-icons package

<svg viewBox="0 0 24 24" width="20" height="20" fill={`#${siGithub.hex}`} aria-label={siGithub.title}>
  <path d={siGithub.path} />
</svg>
```

**Why this works**: `simple-icons` is the official replacement recommended by lucide-react. The package exports `si{BrandName}` objects with `path`, `title`, `hex`, and `slug` properties. Import only what you need — the package is tree-shakeable.

**How to find @deprecated icons**: Check `node_modules/lucide-react/dist/lucide-react.d.ts` for `@deprecated Brand icons` and `q={brand}` in the message to identify which brands are deprecated.

### SonarCloud Investigation: API vs UI Reliability
When SonarCloud PR dashboard shows issues but the API returns 0, the UI is more reliable. The API may return 0 because:
- The PR analysis hasn't been indexed yet (processing delay, observed delays of 30-90s)
- The API requires authentication for private projects
- The branch analysis (not PR-specific) may not match

**Pragmatic workflow**: Trust the user's UI paste over the API. Investigate directly from `node_modules/@types/` for `@deprecated` annotations to confirm each issue.

---

## TDD Workflow (Session Learning — 2026-06-17)

### Strict Red-Green-Refactor
Every feature or bugfix follows this cycle:
1. Write failing test → commit `test(scope): description`
2. Write minimal code → commit `feat(scope): description`
3. Refactor → commit `refactor(scope): description`

### Tiered Gates
| Gate | Runs | Max Time |
|------|------|----------|
| Pre-commit | lint-staged + `pnpm test --changed` | <10s |
| Pre-push | lint → tsc → test:coverage → build → knip | <3min |
| CI (PR) | quality + e2e (parallel jobs) | <20min |
| CI (nightly) | mutation testing (Stryker) — planned | <60min |

### Coverage Thresholds
| Metric | Phase 1 (now) | Phase 2 (next) | Phase 3 (target) |
|--------|---------------|----------------|------------------|
| Lines | 26% | 42% | 80% |
| Branches | 20% | 35% | 70% |
| Functions | 19% | 38% | 70% |
| Statements | 25% | 42% | 80% |

### Commit Convention
| Type | TDD Phase | Example |
|------|-----------|---------|
| test | RED | test(api): add failing test for price sort |
| feat | GREEN | feat(api): implement price sort |
| fix | GREEN | fix(api): handle null price edge case |
| refactor | REFACTOR | refactor(api): extract sort comparator |

### Test File Naming
- `*.test.ts` — Unit test (node environment)
- `*.test.tsx` — Component test (jsdom via `// @vitest-environment jsdom`)
- `*.integration.test.ts` — Integration test (real PostgreSQL in CI)
- `*.pbtest.ts` — Property-based test (fast-check, planned)

### What to Test
| Layer | Test Level | Example |
|-------|-----------|---------|
| Utils/Pure Functions | Unit (node) | `src/utils/pricing.test.ts` |
| Type Guards | Unit (node) | `tests/type-guards.test.ts` |
| Server Actions | Unit (node) | `src/actions/deals.test.ts` |
| Zustand Stores | Unit (node) | `src/store/wishlistStore.test.ts` |
| DB Queries | Integration (real DB) | `src/actions/deals.integration.test.ts` |
| TanStack Query Hooks | Unit (jsdom) | `src/hooks/useWishlistGames.test.ts` |
| Components | Unit (jsdom) | `src/components/Navbar.test.tsx` |
| Pages (RSC) | E2E (Playwright) | `tests/e2e/critical-journeys.spec.ts` |
| Cron Routes | Unit (node) | `src/app/api/cron/ingest-prices/route.test.ts` |
| API Contract | Integration | `tests/contracts/cheapshark-api.test.ts` |

### Shared Test Utilities
```
tests/
  setup.ts             # jest-dom matchers
  factories/           # createMockDeal(), createMockGame(), createMockStore()
    deals.ts
    games.ts
    stores.ts
    index.ts
  test-utils.tsx       # renderWithProviders(), createMockQueryClient()
```

---

## Session Learnings (PR #22 — Sprint 2 Phase B: Quality & UX — 2026-06-18)

### Decompose Mechanical Refactoring Into Parallel Subtasks
When fixing many independent issues of the same category (e.g., SonarQube S6759 Readonly props across 52 files), **never** delegate all to a single agent. Each rule is independent — break into 4+ parallel agents:

```
Agent 1: S6759 Readonly props (bulk, ~52 files)
Agent 2: S7924 CSS contrast (10 files)
Agent 3: S7764 + S7758 + misc mechanical fixes (10 files)
Agent 4: S3358 + S4323 + remaining single-file issues
```

Single agent took 15min. 4 in parallel would take ~4min. Same principle applies to any bulk refactoring with independent file sets.

### Server Actions Must Use `createClient()`, NOT `getBrowserClient()`
`getBrowserClient()` (browser singleton from `@/lib/supabase-browser`) reads session from localStorage — it has **no server-side auth validation**. In `'use server'` files, always use `await createClient()` from `@/utils/supabase/server`. The browser client in a server action is a security anti-pattern: the `getUser()` call won't re-validate against the Auth server, and there's no localStorage in server context. Context7 confirmed this.

### Always Add `WHERE userId` to Database Queries
Every query that returns user data MUST filter by `userId`. Three data leak bugs found in audit:
- `wishlist.ts`: `SELECT gameId FROM wishlists` without WHERE userId — returned ALL users' wishlists
- `playlists.ts`: `getPlaylistByIdAction`, `addGameToPlaylistAction`, `removeGameFromPlaylistAction` — no ownership verification
Fix pattern: always include `WHERE "userId" = ${userId}::uuid` or `EXISTS (SELECT 1 FROM playlists WHERE id = ... AND userId = ...)` for junction tables.

### Sitemap DB Queries Must Handle Build-Time Failures
Next.js builds the sitemap at compile time. If the database is unavailable during build (e.g., CI without migrations), the sitemap export crashes the entire build. Always wrap DB queries in try/catch and return static pages as fallback.

### Local SonarQube via Docker for Pre-CI Validation
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
# Wait for startup (~30s), then change default password via API
curl -u admin:admin -X POST "http://localhost:9000/api/users/change_password?login=admin&password=NewPass12!&previousPassword=admin"
# Generate token
curl -u admin:NewPass12! -X POST "http://localhost:9000/api/user_tokens/generate?name=local-cli"
# Run scan (from project root with sonar-project.properties)
npx sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.token=<token>
```

Issues API: `GET /api/issues/search?projectKeys=<key>&statuses=OPEN` — returns JSON with rule, severity, component, message.

### TanStack Query Cache Invalidation Must Include Detail Keys
When a mutation modifies a specific entity, invalidate BOTH the list query AND the detail query:
```ts
onSuccess: (_data, playlistId) => {
  queryClient.invalidateQueries({ queryKey: ['playlists'] });        // list
  queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }); // detail
}
```
Failing to invalidate the detail key causes stale data on the detail page after mutations.

### PWA Manifest Icons Must Actually Exist
The manifest test verified JSON structure but NOT icon file existence. Created `icon-192.png` and `icon-512.png` with ImageMagick:
```bash
convert -size 192x192 xc:'#16a34a' public/icon-192.png
convert -size 512x512 xc:'#16a34a' public/icon-512.png
```
Always verify referenced assets exist — not just the manifest structure.

### i18n Tests Need Exhaustive Pattern Coverage
The English strings test covered ~35 regex patterns but missed `Resgatado` (Claimed) in FlashSales.tsx. When building pattern lists for i18n tests, grep the ENTIRE codebase for Portuguese words/accents, not just known patterns. A single missed word means the test passes but the UI is still broken.

### `as unknown as` Cast Pattern for Drizzle Raw SQL
Drizzle's `db.execute(sql\`...\`)` returns `RowList<Record<string, unknown>[]>`. To map to typed arrays:
```ts
const rows = await db.execute<{ gameId: string }>(sql`SELECT "gameId" FROM wishlists`);
// Type parameter helps but cast is still needed for direct array access:
const games = rows as unknown as { gameId: string }[];
```

### Biome Pre-Push Hook Blocks RED Commits
TDD RED phase: tests must FAIL. Pre-push runs `pnpm check` which includes tests. Use `--no-verify` for RED commits. For GREEN commits, pre-push should pass normally.

---

## Session Learnings (PR #22 — Production Fixes — 2026-06-18)

### React #185: Inline Callback + Zustand New Object = Infinite Loop
**Root cause**: `useServerUserSync(serverUser, () => setIsAuthModalOpen(false))` — the inline `() => setIsAuthModalOpen(false)` is a NEW function reference every render. In the `useEffect` dependency array `[setUser, serverUser, closeAuthModal]`, `closeAuthModal` changes every time → effect fires → `setUser()` called → Zustand detects change (because `setUser` ALWAYS created a new `{ id, name, email, avatar }` object even for identical data) → Navbar re-renders → new `closeAuthModal` → ∞

**Fix (two layers of defense)**:
1. **Navbar**: `const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), [])` — stable reference across renders
2. **authStore**: Skip `set()` if user data unchanged:
```ts
setUser: (supabaseUser) => {
  if (supabaseUser) {
    const current = get().user;
    if (current?.id === supabaseUser.id) return; // ✅ idempotent guard
    set({ user: { ... }, isLoggedIn: true });
  } else {
    if (!get().user) return;
    set({ user: null, isLoggedIn: false });
  }
}
```

**Verification**: `vi.spyOn(Math, 'random')` on Vercel production → React error #185 in console → "Critical error / Something went very wrong" to users. Fix confirmed: page loads clean on Vercel preview.

### Always `useCallback` for Callbacks in useEffect Dependencies
Any callback function that appears in a `useEffect` dependency array MUST be wrapped in `useCallback`. A new function reference every render = effect fires every render = potential infinite loop. Context7 docs explicitly show this as the #1 cause of React error #185.

### `Math.random()` Is Not CSPRNG — Use `crypto.randomUUID()`
`Math.random()` in V8 uses xorshift128+ (predictable with enough observations). For slug/ID generation in `'use server'` functions, use `crypto.randomUUID().substring(0, 8)`:
- 8 hex chars = 16^8 ≈ 4.3B namespace (vs 2.17B for base36)
- CSPRNG (cryptographically secure) — Context7 confirms Next.js docs use `crypto.randomUUID()` for nonce/ID generation everywhere
- Available globally in Node.js ≥19 (no import needed)

**Also**: Hoist expensive computations out of loops. `generateSlug(title)` was called on every loop iteration (unnecessary — `title` doesn't change). Compute once as `baseSlug` before the loop.

### `next/image` Remote Patterns: Use Wildcards for CDN Subdomains
CheapShark API returns thumbnails from various store CDN subdomains (e.g., `sttc.gamersgate.com` vs `www.gamersgate.com`). Don't add individual subdomains — use `*.domain` wildcard:
```ts
{ protocol: 'https', hostname: '*.gamersgate.com', pathname: '/**' }
```
This covers `www.gamersgate.com`, `sttc.gamersgate.com`, and any future subdomain they add.

### Subagent + Dev Server = Timeout (Turbopack Compile)
Never spawn `pnpm dev` in a background subagent. Turbopack first compile (2-8s) + bash tool timeout = dead agent. Dev server verification should be done in the main thread or skipped — rely on Vercel preview for production verification. Build (`pnpm build`) is better for pre-push validation than dev server (`pnpm dev`).

### Vercel Preview Auth Blocking
Vercel preview deployments for private repos show a login wall. Use `vercel_get_access_to_vercel_url` to generate a shareable link (`?_vercel_share=...`) valid for 24h. The shareable link sets an auth cookie on redirect — use `vercel_web_fetch_vercel_url` if your fetch client doesn't support cookies.

### Test Mocks Must Match Implementation
When changing from `Math.random()` to `crypto.randomUUID()`, update BOTH the implementation AND the test mock:
- Before: `vi.spyOn(Math, 'random').mockReturnValue(0.123456789)` → slug `my-playlist-4f3a1c`
- After: `vi.spyOn(crypto, 'randomUUID').mockReturnValue('4f3a1c85-1234-4234-9234-123456789abc')` → slug `my-playlist-4f3a1c85`

---

## Session Learnings (PR #22 — Sprint 2 Wrap — 2026-06-18)

### Plan Creation vs Plan Execution: Use the Right Agent
- **Prometheus (Plan Builder)**: Creates structured work plans in `.sisyphus/plans/`. ALWAYS use for multi-step planning. Outputs a `.md` file with checkbox tasks, parallel tracks, effort estimates, and verification gates.
- **Atlas (Plan Executer)**: Reads a Prometheus plan via `/start-work`, breaks every checkbox into granular todo items, tracks state in `boulder.json`, uses git worktrees for isolation, and delegates systematically to subagents. NEVER execute a plan manually — always use `/start-work`.
- **Rule**: Prometheus for planning, Atlas for execution. Never mix — orchestrator should not manually decompose plans when Atlas exists.
- **Trigger**: When user says "execute o plano", "start the plan", "run the sprint", or similar, Sisyphus invokes Atlas via `/start-work` automatically. User does NOT need to type the slash command.

---

## Session Learnings (PR #23 — Sprint 3 Phase C Polish + SonarQube Cleanup — 2026-06-18)

### Middleware: String.raw in matcher Breaks Next.js 16 Build
Next.js 16 uses SWC to statically extract `export const config` from middleware for route analysis. **NEVER** use tagged template literals (`String.raw\`...\``) in middleware `config.matcher` — SWC throws `UnsupportedValueError`, which triggers "Invalid segment configuration export detected" at build time. Build, CI (quality + e2e), and Vercel deployment were ALL blocked by this 1-line regression.

**Root cause discovery**: Traced through Next.js source: `getStaticInfoIncludingLayouts` → `extractExportedConstValue` → `warnAboutUnsupportedValue` → `errorFromUnsupportedSegmentConfig`. The `warnAboutUnsupportedValue` function calls `extractExportedConstValue(ast, 'config')` which cannot parse runtime expressions like tagged templates. The error message itself is swallowed by Turbopack (compiler name ≠ 'server'), but `hadUnsupportedValue` is still set to `true`.

**Fix**: Plain string: `'/((?!_next/static|_next/image|favicon.ico|api/cron(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'`. Add `// NOSONAR` to prevent S7780 re-trigger. The `\\\\.` double-escape is required because a plain string needs `\\` to produce a literal `\` in the regex.

### Recharts: Cell Deprecated → Data-Level fill Prop
Recharts 3.x deprecated `Cell` component (removed in 4.0). Fix: move `fill` from `<Cell fill={...}>` children to data array's `fill` property. Recharts auto-applies per-row `fill` without needing the deprecated wrapper. One file changed (`Charts.tsx`), +3 −10 lines.

**Earlier misdiagnosis**: Initially classified as requiring complex `shape` prop. Wrong — the data-level `fill` approach is simpler.

### SonarQube: S7924 CSS Contrast False Positives
All 11 S7924 (CSS contrast) issues are false positives caused by CSS custom properties (`hsl(var(--primary))`), transparent backgrounds, and gradient backgrounds. SonarQube's CSS analyzer cannot resolve `var()` or compute effective contrast through transparent layers. **Marked as FALSE-POSITIVE in SonarQube UI** — cleaner than `/* NOSONAR */` across 10 files.

### SonarQube Final Count
- Initial: 50 issues
- Sprint 3 fixes: S6759 readonly (33→0), S7780 String.raw (1→0), S4325 type assertion (1→0), S6571 union (1→0), S1874 Cell (2→0)
- S7924 false positives (11): marked FALSE-POSITIVE in SonarQube UI
- **Final: 0 open issues** (local re-scan confirmed)

### Build Error Diagnosis Workflow
When Next.js build fails with "Invalid segment configuration export detected" without specifying which file:
1. Check `middleware.ts` for `String.raw` in exported `config` objects
2. Trace `node_modules/next/dist/build/index.js` for `errorFromUnsupportedSegmentConfig`
3. Clean `.next` between test builds (`rm -rf .next`) — partial builds corrupt cache
4. The actual file causing the issue is logged by `warnAboutUnsupportedValue` but may not appear in output if Turbopack is the compiler

### Decompose Mechanical Refactoring Into Parallel Subtasks
SonarQube S6759 (Readonly props, ~33 issues across 28 files) → delegate to single agent. Mistake: should have split into 4 parallel agents (independent file sets). Single agent 15min, parallel would be ~4min. Lesson: bulk mechanical refactoring = parallel agents per file group.
