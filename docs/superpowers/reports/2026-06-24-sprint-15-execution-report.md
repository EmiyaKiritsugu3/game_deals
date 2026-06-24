# Sprint 15 — Execution Report

**Branch:** `feat/sprint-15-p2-gamification`
**PR:** [#52](https://github.com/EmiyaKiritsugu3/game_deals/pull/52)
**Spec:** `docs/superpowers/specs/2026-06-23-sprint-15-p2-gamification-design.md`
**Date:** 2026-06-24

---

## 1. Scope Delivered

| Phase | What | Status |
|-------|------|--------|
| A1 | CI audit — `pnpm audit` now blocks on HIGH vulns | ✅ |
| A2 | AlertCard extraction | ✅ (pre-existing) |
| A3 | `aria-live="polite"` on search dropdown, notification badge, deal list | ✅ |
| B1 | `manifest.json` with PWA config | ✅ |
| B2 | `metadata.manifest` in layout.tsx | ✅ |
| C1 | Migration 0013: `user_stats` table + RLS + `award_badge()` function | ✅ Applied to DB |
| C2 | `src/services/gamification.ts`: `processAction`, `getUserProfile`, `getLeaderboard`, `seedBadges` | ✅ 15 tests |
| C3 | Gamification hooks in playlist/alert server actions (non-blocking) | ✅ |
| D1 | Profile page: XP bar + level, badge grid, activity feed, opt-in toggle | ✅ |
| D2 | `/leaderboard` page: top 50 opt-in, medals, badge count | ✅ |
| D3 | Navbar link to leaderboard | ✅ |

**Notes:**
- Wishlist action hook deferred (wishlist insert is client-side Zustand, no server action)
- `seedBadges()` not auto-invoked — will be called once at deploy via migration or script

---

## 2. Verifications

| Gate | Result | Details |
|------|--------|---------|
| Biome lint | ✅ | No issues |
| TypeScript | ✅ | No errors |
| Tests (Vitest) | ✅ | 970/970 passing, 111 files |
| Build (Next.js) | ✅ | All routes static/dynamic |
| Knip | ✅ | 1 unused dep (esbuild) pre-existing |
| Fallow audit | ⚠️ | 1 complexity (ProfilePage, CRAP 37 — expected), 2 dead code pre-existing |
| SonarCloud | ✅ | Clean scan, 0 new issues |
| PWA service worker | ✅ | Already existed (sw.js, RegisterSW, InstallPWAButton) |

---

## 3. Fixes Applied After Review

| Fix | Reason | Diff |
|-----|--------|------|
| Subquery table qualifier | Subquery badge count compared `"userId"` vs itself (always true) | +1/-1 |
| RARITY_COLORS dedup with profile | Duplicate constant in 2 files | -5 lines |
| Medal lookup array | 7-line ternaries → 1 lookup | -6 lines |
| OptInToggle formAction | useState + try/catch → form action | -20 lines |
| SVG_BY_RARITY | Remove getBadgeIconSvg function | -10 lines |
| Batch badge COUNT | N per-def queries → 1 grouped query | -15 lines |
| BADGE_DEFS knip ignore | Entry point config, false positive | +4/-4 lines |
| Lockfile regeneration | Merge conflicts corrupted pnpm-lock.yaml | -1441 lines |
| vercel.json pnpm pin | Force pnpm v11 build/install commands | +4 lines |
| **Total** | | **net -1441 lines** (lockfile) / **~-65 logic lines** |

---

## 4. Migration State

| Object | Table | Status |
|--------|-------|--------|
| `user_stats` | Table | ✅ Created via 0013 migration |
| `award_badge(user_id, badge_name)` | Function | ✅ Plpgsql, idempotent |
| RLS policies (3) | Policies | ✅ SELECT/INSERT/UPDATE |
| Index `user_stats_xp_idx` | Index | ✅ For leaderboard sort |
| Drizzle journal | 0013 | ✅ Entry exists |
| FK to `profiles.id` | Constraint | ✅ ON DELETE CASCADE |

---

## 5. File Count

```
Modified:   .github/workflows/ci.yml
Modified:   .husky/pre-commit (pre-existing)
Modified:   knip.json
Modified:   pnpm-lock.yaml
Modified:   src/actions/alerts.ts
Created:    src/actions/gamification.ts
Modified:   src/actions/playlists.ts
Modified:   src/app/layout.tsx
Created:    src/app/leaderboard/page.tsx
Modified:   src/app/page.tsx
Created:    src/app/profile/OptInToggle.tsx
Created:    src/app/profile/__tests__/page.test.tsx
Modified:   src/app/profile/page.tsx
Created:    src/components/LevelBadge.tsx
Modified:   src/components/NotificationBell.tsx
Modified:   src/components/navbar/SearchBox.tsx
Modified:   src/components/navbar/UserMenu.tsx
Modified:   src/db/schema/gamification.ts
Created:    public/manifest.json
Created:    src/services/gamification.ts
Created:    src/services/__tests__/gamification.test.ts
Modified:   vercel.json

Created:   6 files
Modified:  11 files
Deleted:   5 stale files
Migration: 0013_user_stats.sql
```

---

## 6. Known Gaps

| Gap | Reason | Fix timeline |
|-----|--------|-------------|
| `BADGE_DEFS` not auto-seeded | `seedBadges()` written but not invoked | First deploy → run `npx tsx -e "seedBadges()"` or add to CI |
| Wishlist gamification hook | No server-side write action (Zustand client) | Future: add server action for wishlist add/remove |
| Activity feed no cron cleanup | `activities` table append-only | Phase E |
| Complexity on ProfilePage (CRAP 37) | Server component with 4 sections | Phase E refactor |
| Vercel deploy CI status | Still pending after lockfile fix | Verify post-deploy |
| Template test count stale | PR description says 423, actual 970 | Update `.github/PULL_REQUEST_TEMPLATE.md` |
