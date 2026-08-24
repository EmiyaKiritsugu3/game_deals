# Test Strategy — GameDeals

| Metadata | |
|---|---|---|
| Document owner | Engineering Team |
| Version | 1.2 |
| Last updated | 2026-06-21 |
| Status | Active |

---

## 1. Scope

### In Scope

- Unit tests for domain logic, type guards, server actions, and utility functions.
- Integration tests for database queries (Drizzle ORM), Supabase auth flows, and external API clients (CheapShark).
- End-to-end (E2E) tests for critical user journeys: browsing deals, searching, wishlist management, affiliate redirect.
- Visual regression tests for UI components (planned).
- API contract tests for CheapShark integration (planned).
- Performance benchmarks for search (Typesense vs. fallback), page load, and database query performance.
- CI pipeline gating: lint, type check, test + coverage, build, dead code analysis, security audit.

### Out of Scope

- Load / stress testing (no target SLA established yet).
- Penetration testing / formal security audit.
- Cross-browser testing beyond Chromium.
- Mobile device testing beyond responsive viewport checks.

---

## 2. Test Objectives

1. **Correctness** — Validate game deal data ingestion, price calculation, and affiliate redirect logic produce expected results.
2. **Data Integrity** — Ensure CheapShark API responses are correctly typed, transformed, and persisted without data loss.
3. **Auth Reliability** — Verify Supabase SSR auth flows (login, session refresh, protected route redirects) work end-to-end.
4. **Search Quality** — Typesense search produces relevant results and falls back gracefully to CheapShark when unavailable.
5. **Regression Prevention** — Automated gates in CI catch regressions before merge to main.
6. **User Journey** — Critical paths (browse → search → wishlist → outbound affiliate) function without error.

---

## 3. Test Approach

### Current State Assessment (Sprint 11 — updated 2026-06-21)

The project has **916 tests across 102 test files**:

| Aspect | Current Status |
|---|---|
| **Test files** | 102 (actions, services, utils, stores, hooks, components) |
| **Total test count** | **916** |
| **Coverage** | **82.72% lines**, **79.40% branches**, **77.19% functions** |
| **Coverage provider** | Istanbul (via `@vitest/coverage-istanbul`) |
| **Test runner** | Vitest v4 (node default + jsdom per-file for components) |
| **Component test deps** | jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event |
| **E2E framework** | Playwright v1.60 (configured with webserver, CDP screenshots) |
| **E2E config** | `playwright.config.ts` exists |
| **Test directory** | `src/**/*.test.{ts,tsx}`, `tests/**/*.test.{ts,tsx}` |
| **CI test step** | `bun test:coverage` runs in CI workflow |
| **Pre-push gate** | Tests block push on failure (`bun check`) |
| **SonarCloud** | Quality Gate passes (0 issues, coverage on new code ≥ 80%) |

### Test Levels

| Level | Target Automation | Current Coverage | Owner | Notes |
|---|---|---|---|---|---|
| **Unit (node)** | 100% of type guards, utilities, pure functions | ~500 tests across 60+ files | Engineering | Action/service/utility/hook tests. Vitest + node environment. |
| **Component (jsdom)** | Component rendering + user interactions | ~400 tests across 40+ files | Engineering | Vitest + jsdom + RTL. Mock TanStack Query hooks. Includes a11y tests (aria-live, keyboard nav). |
| **Integration** | DB queries, API client, Server Actions | 0% | Engineering | Requires DB connection. Use test containers or Supabase local. |
| **E2E** | Critical user journeys | 12 tests (2 spec files) | Engineering | Playwright with webserver, production build, CDP screenshots. |
| **Visual** | UI component snapshots | 6 snapshots | Engineering | Playwright screenshot diffing with `maxDiffPixels: 100`. |
| **Performance** | Typesense search latency, ISR cache hit rate | 0% | Engineering | Ad-hoc only. No formal benchmarks yet. |
### Test Data Strategy

- **Unit tests**: Mock CheapShark API responses using inline fixtures (see `tests/type-guards.test.ts` pattern).
- **Integration tests**: Use a test PostgreSQL database (local Supabase or pg_temp schema) with seed data.
- **E2E tests**: Use the production-like staging environment with a dedicated Typesense collection.
- **Fixtures**: Store shared test fixtures under `tests/fixtures/` (directory does not exist yet).

---

## 4. Risk Register

| # | Risk | Probability (1-5) | Impact (1-5) | Score | Mitigation |
|---|---|---|---|---|---|
| R1 | **CheapShark API downtime or rate limiting** | 3 | 4 | 12 | Cache deals server-side with Next.js ISR (`revalidate: 3600`). Implement circuit breaker in API client. Log failures and serve stale cache. |
| R2 | **Typesense index stale or search cluster unreachable** | 2 | 3 | 6 | Daily cron reindex (`/api/cron/reindex-typesense`). Client-side fallback to CheapShark search in `src/actions/search.ts`. Monitor via health checks. |
| R3 | **Affiliate link breakage (store URL changes, param deprecation)** | 2 | 4 | 8 | Validate store IDs against allowlist in `/out` route. Add E2E tests for affiliate redirects. Periodic manual audit of 17 store configs in `src/lib/affiliate-config.ts`. |
| R4 | **Supabase auth outage or session cookie failure** | 2 | 5 | 10 | SSR middleware refreshes cookies on every request. Client-side lazy init with `onAuthStateChange` subscription. Wishlist degrades to localStorage-only when auth unavailable. |

**Probability scale**: 1 (rare) → 5 (very likely). **Impact scale**: 1 (negligible) → 5 (critical).

---

## 5. Entry & Exit Criteria

### 5.1 Feature Testing

| Gate | Entry Criteria | Exit Criteria |
|---|---|---|
| **Feature testing** | Feature branch created. Implementation complete. Code compiles (`tsc --noEmit` passes). | All unit tests pass. Coverage does not decrease (enforced by PR review, not config). Linter clean. PR approved. |

### 5.2 Release Testing

| Gate | Entry Criteria | Exit Criteria |
|---|---|---|
| **Release testing** | Feature branches merged to main. CI green on latest main commit. | Full CI pipeline passes (lint → tsc → test → build → knip → fallow). No P0/P1 defects open. Smoke test on production deployment passes. |

---

## 6. Tooling

| Tool | Version | Purpose | Config File |
|---|---|---|---|
| **Vitest** | ^4.1.8 | Unit & integration test runner | `vitest.config.ts` |
| **@vitest/coverage-istanbul** | ^4.1.8 | Coverage collection and reporting | Included in `vitest.config.ts` |
| **Playwright** | ^1.60.0 | E2E browser automation | **Missing** — `playwright.config.ts` not yet created |
| **Biome** | ^2.4.16 | Linting and formatting (not a test tool, but gates CI) | `biome.json` |
| **Knip** | ^6.16.1 | Dead code analysis (run after tests in CI) | `knip.json` |
| **Fallow** | ^2.94.0 | Security auditing (run after tests in CI) | CLI flags only |

### Vitest Configuration (Current)

```ts
// vitest.config.ts
{
  test: {
    globals: true,                    // describe/it/expect available without import
    environment: 'node',              // Default: Node env for action/service tests
    setupFiles: ['./tests/setup.ts'], // jest-dom matchers (loaded for all envs)
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'istanbul',           // Istanbul over c8 for broader format support
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/types/**',
                'src/scripts/**', 'src/data/**', 'src/db/**'],
      thresholds: {
        lines: 80,       // Enforced — Sprint 9: raised from 0
        functions: 75,   // Enforced — Sprint 9: raised from 0
        branches: 76,    // Enforced — Sprint 9: raised from 0
        statements: 80,  // Enforced — Sprint 9: raised from 0
      },
    },
  },
  resolve: {
    alias: { '@': './src' },          // Matches tsconfig paths
  },
}
```

### Component Tests (jsdom)

Component tests (e.g. `tests/unit/app/alerts-page.test.tsx`) use a **per-file jsdoc directive** to switch to jsdom environment:

```ts
/**
 * @vitest-environment jsdom
 */
```

This keeps the default `node` environment for existing action/service tests (which are faster and don't need DOM). Only tests under `tests/unit/` use jsdom.

**Stack (added Sprint 15):**
- `jsdom` — browser-like environment for component rendering
- `@testing-library/react` — React component rendering (`render`, `screen`)
- `@testing-library/jest-dom` — custom matchers (`toBeInTheDocument`, `toBeVisible`)
- `@testing-library/user-event` — simulated user interactions

**Mocking pattern (component level):** Unlike action/service tests which mock `db.execute` directly, component tests mock TanStack Query hooks (`useQuery`, `useMutation`) via `vi.mock('@tanstack/react-query', ...)`. This is the correct boundary for component tests — they verify the component's interaction with its hooks, not the SQL layer.

```ts
const mocks = vi.hoisted(() => ({
  queryMock: vi.fn(),
  mutationMock: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.queryMock,
  useMutation: mocks.mutationMock,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
```

**Test count:** 916 total. 102 test files.

---

## 7. Defect Lifecycle

```
[New] → [Triaged] → [In Progress] → [Fixed] → [Verified] → [Closed]
                        ↓
                   [Won't Fix] / [Duplicate]
```

| Stage | Description | Responsibility |
|---|---|---|
| **New** | Defect reported via GitHub issue or detected in CI. | Anyone |
| **Triaged** | Reviewed for severity (P0-P3) and assigned. | Engineering lead |
| **In Progress** | Fix being implemented with a corresponding test. | Assigned engineer |
| **Fixed** | PR merged to main. CI green. | Assigned engineer |
| **Verified** | Confirmed fixed on production/staging. | Reviewer or QA |
| **Closed** | No further action needed. | Engineering lead |

**Severity definitions**:
- **P0**: Critical — auth failure, data loss, site down. Fix within hours.
- **P1**: High — major feature broken, no workaround. Fix within the sprint.
- **P2**: Medium — feature partially broken, workaround exists. Fix within 2 sprints.
- **P3**: Low — cosmetic, nice-to-have. Prioritized by team.

---

## 8. Roles & RACI

| Activity | Engineering Lead | Software Engineer | Reviewer | CI/CD |
|---|---|---|---|---|
| Define test strategy | **A** | C | C | I |
| Write unit tests | I | **R** | C | I |
| Write integration tests | I | **R** | C | I |
| Write E2E tests | I | **R** | C | I |
| Maintain test infrastructure | **A** | **R** | I | C |
| Review test coverage in PRs | I | C | **R** | **A** |
| Run CI pipeline | I | I | I | **R** |
| Gate merge on test results | I | I | I | **R** |
| Monitor test health (flake, speed) | **A** | **R** | I | C |

**R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed.

---

## Appendix A: CI Pipeline Flow

```
Pre-commit (lint-staged)
  └─ Biome check --write on staged files

Pre-push (check.sh)
  1. Lint          (bun lint)           — Biome
  2. Type check    (tsc --noEmit)        — TypeScript compiler
  3. Test          (bun test:coverage)  — Vitest + Istanbul coverage
  4. Build         (bun build)          — Next.js production build
  5. Dead code     (bun knip)           — Knip (warnings only)
  6. Security      (bun fallow:audit)   — Fallow

GitHub Actions CI
  Same 6 steps, with secrets via ${{ secrets.X || 'placeholder' }} pattern.
  Does NOT run E2E tests (bun test:e2e).
```

## Appendix B: Coverage Improvement Roadmap

| Phase | Target | Estimated Timeline |
|---|---|---|
| **Phase 1** ✅ | Raise thresholds to 80/75/76/80 | **Completed** (Sprint 9: 82.3% / 78.8%) |
| **Phase 2** | Add integration tests for Server Actions and DB queries | Future sprint |
| **Phase 3** | E2E tests for critical journeys: search → wishlist → affiliate out | Future sprint |
| **Phase 4** | Mutation testing (Stryker) — planned | Future |
| **Phase 5** | Raise thresholds: lines 85%, functions 80%, branches 82%, statements 85% | Quarter target |
