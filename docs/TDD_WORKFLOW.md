# TDD Workflow — GameDeals

## Quick Start

```bash
bun tdd              # Watch mode: runs changed tests on save
bun test --changed   # Run only affected tests
bun check            # Full local CI before push
```

## Cycle (Strict)

```
1. Failing test → bun test --changed RED   → git commit -m "test: ..."
2. Minimal code  → bun test --changed GREEN → git commit -m "feat: ..."
3. Refactor      → bun test --changed GREEN → git commit -m "refactor: ..."
4. Push (bun check must pass)
```

## Gate Structure

| Gate | What Runs | Max Time | Blocks? |
|------|-----------|----------|---------|
| **Pre-commit** | `lint-staged` + `bun test --changed` | <10s | Yes |
| **Pre-push** | lint → tsc → test:coverage → build → knip | <3min | Yes |
| **CI (PR)** | quality job + e2e job (parallel) | <20min | Yes |
| **Nightly** | Stryker mutation testing (planned) | <60min | No |

## What to Test

| Layer | Test Level | Environment | File Pattern |
|-------|-----------|-------------|-------------|
| Utils | Unit | node | `*.test.ts` |
| Type Guards | Unit | node | `*.test.ts` |
| Server Actions | Unit / Integration | node / real DB | `*.test.ts` / `*.integration.test.ts` |
| DB Queries | Integration | real PostgreSQL | `*.integration.test.ts` |
| Zustand Stores | Unit | node | `*.test.ts` |
| TanStack Query Hooks | Unit | jsdom | `*.test.ts` with `// @vitest-environment jsdom` |
| Components | Unit | jsdom | `*.test.tsx` with `// @vitest-environment jsdom` |
| Pages (RSC) | E2E | Playwright | `*.spec.ts` |
| Cron Routes | Unit | node | `route.test.ts` |
| API Contract | Integration | node / Playwright | `*.contract.test.ts` |

## Anti-Patterns

- Do NOT test React internals (useState values, rendered JSX structure)
- Do NOT mock `@tanstack/react-query` at the hook level — use `renderHook` instead
- Do NOT test TanStack Query's internal caching (it's tested by the library)
- Do NOT use real CheapShark API in unit/integration tests — use fixtures
- Do NOT test Drizzle internals — test the resulting data shape

## Commit Convention

| Type | Phase | Example |
|------|-------|---------|
| `test` | RED | `test(api): add failing test for price sort` |
| `feat` | GREEN | `feat(api): implement price sort` |
| `fix` | GREEN | `fix(api): handle null price edge case` |
| `refactor` | REFACTOR | `refactor(api): extract sort comparator` |
| `perf` | - | `perf(search): optimize Typesense query` |
| `chore` | - | `chore: update vitest to 4.2.0` |

## Test Scripts Reference

```bash
bun test                     # Run all unit tests
bun test:changed             # Run only tests for changed files
bun test:coverage            # Run tests with coverage report
bun test:integration         # Run integration tests (real DB)
bun test:e2e                 # Run Playwright E2E tests
bun tdd                      # Watch mode for changed tests (TDD cycle)
bun check                    # Full local CI pipeline (pre-push)
```

## Coverage Thresholds

| Metric | Current | Target |
|--------|---------|--------|
| Lines | 26% | 80% |
| Branches | 20% | 70% |
| Functions | 19% | 70% |
| Statements | 25% | 80% |

Thresholds are enforced in `vitest.config.ts`. They increase at each phase. Use `bun test:coverage` to check.

## Phase 1 — Foundation (Current)

- [x] Coverage thresholds at baseline + 2% buffer
- [x] Pre-commit runs `test --changed`
- [x] Pre-push runs full quality pipeline (no fallow)
- [x] CI has PostgreSQL service + parallel E2E job
- [x] Shared test factories (`tests/factories/`)
- [x] Shared test utilities (`tests/test-utils.tsx`)
- [x] Integration test config (`vitest.integration.config.ts`)
- [x] Documentation (AGENTS.md + TDD_WORKFLOW.md)
