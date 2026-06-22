# Sprint 12 — Security Hardening

**Date:** 2026-06-21
**Branch:** sec/sprint12-security-hardening
**Source:** `docs/security/audit-2026-06-21.md`

## Context

Static security audit found 12 issues: 1 CRITICAL, 2 HIGH, 5 MEDIUM, 4 LOW.
This plan fixes all 12 and adds detection infrastructure.

---

## TODOs

### Phase 0 — Baseline Gates (must pass before ANY fix)

1. [x] F0.1: Run `pnpm test -- --run` — all 916 tests pass
2. [x] F0.2: Run `pnpm lint` — 0 errors
3. [x] F0.3: Run `tsc --noEmit` — 0 errors
4. [x] F0.4: Run `pnpm knip` — baseline recorded

### Phase 1 — CRITICAL + HIGH Fixes

5. [x] F1.1: **C1 — Fix open redirect in auth callback**
  File: `src/app/auth/callback/route.ts:29`
  Change: validate `next` param — reject `//`, `http:`, `javascript:`, `\\`
  Test: `src/app/auth/callback/route.test.ts` — 6 scenarios (happy path + 5 attack vectors)
  Verify: `pnpm test -- --run src/app/auth/callback`

6. [x] F1.2: **H1 — Fix cross-user playlist deletion**
  File: `src/actions/playlists.ts:185`
  Change: ownership check BEFORE deleting `playlist_games` rows
  Test: `src/actions/playlists.test.ts` — 4 scenarios (cross-user block, own success, race, cascade)
  Verify: `pnpm test -- --run src/actions/playlists`

7. [~] F1.3: **H2 — Rotate service role key**
  Action: coordinate rotation (verify no Sentry leak first, then rotate in Supabase dashboard)
  Verify: check GitGuardian status + Sentry beforeSend from M2

### Phase 2 — MEDIUM Fixes

8. [x] F2.1: **M1 — Fix IP spoofing in /out route**
  File: `src/app/out/[storeId]/[gameSlug]/route.ts:74`
  Change: prefer `x-real-ip` header, fallback to `x-forwarded-for`
  Test: `src/app/out/route.test.ts` — 4 scenarios

9. [x] F2.2: **M2 — Add Sentry beforeSend filter**
  Files: `src/instrumentation.ts` or `sentry.*.config.ts`
  Change: strip `authorization`, `cookie` headers + env vars from events
  Test: unit test for filter function

10. [x] F2.3: **M3 — Fix isProtectedPath segment match**
  File: `src/utils/supabase/middleware.ts:7`
  Change: exact-match + trailing-slash + case-insensitive
  Test: `src/utils/supabase/middleware.test.ts` — 6 scenarios

11. [x] F2.4: **M5 — Create centralized requireUser helper**
  New file: `src/lib/require-user.ts`
  Change: extract auth boilerplate from all actions
  Test: `src/lib/require-user.test.ts` — 3 scenarios

### Phase 3 — LOW Fixes

12. [x] F3.1: **L1 — Timing-safe cron secret comparison**
  File: `src/lib/cron-auth.ts`
  Change: use `crypto.timingSafeEqual`
  Test: existing `src/lib/cron-auth.test.ts` — add 2 scenarios

13. [x] F3.2: **L2 — AFFURL re-validation defense-in-depth**
  File: `src/app/out/[storeId]/[gameSlug]/route.ts`
  Change: re-validate domain after searchParams append
  Test: add to existing test file

14. [x] F3.3: **L4 — Add error logging to affiliate click tracker**
  File: `src/app/out/[storeId]/[gameSlug]/route.ts:50`
  Change: replace `.catch(() => {})` with `.catch(console.error)`

### Phase 4 — Detection + Prevention

15. [x] F4.1: **CI security scan**
  File: `.github/workflows/ci.yml`
  Change: verify `pnpm audit --audit-level=high` runs in quality job
  Verify: check workflow file

16. [x] F4.2: **SECURITY.md**
  New file: `SECURITY.md` at repo root
  Change: vulnerability reporting policy

---

## Final Verification Wave

F1. [x] FV1: Full test suite passes — `pnpm test -- --run` (948 pass, 105 files)
F2. [x] FV2: Lint clean — `pnpm lint` / biome (0 errors)
F3. [x] FV3: Type check clean — `tsc --noEmit` (0 errors)
F4. [x] FV4: Build passes — `pnpm build` (exit 0)
F5. [x] FV5: Dead code clean — `pnpm knip` (no new findings vs baseline)
F6. [x] FV6: Coverage maintained — 83.87% statements / 80.68% branches / 78.14% functions / 83.97% lines (all ≥ thresholds 80/76/75/80)
F7. [x] FV7: Security audit doc updated — `docs/security/audit-2026-06-21.md` reflects all fixes (commit 5654ae8)

---

## Acceptance Criteria

- All 12 audit findings addressed (C1, H1, H2, M1-M5, L1-L4)
- No regression in existing tests
- Coverage thresholds maintained or improved
- Security audit document reflects final state
- PR ready for merge with all CI green

---

## Execution Strategy

- Phase 0: sequential (baseline gates)
- Phase 1: sequential (C1 → H1 → H2)
- Phase 2: parallel (M1-M5 independent)
- Phase 3: parallel (L1-L4 independent)
- Phase 4: sequential (CI + SECURITY.md)
- Final Wave: parallel (FV1-FV7)
