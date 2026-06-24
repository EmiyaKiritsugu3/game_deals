# Task C2: Gamification Service Layer

## Context
Spec: docs/superpowers/specs/2026-06-23-sprint-15-p2-gamification-design.md §4.4-4.5
Migration done: `drizzle/0013_user_stats.sql` creates `user_stats` table + `award_badge()` function
Schema: `src/db/schema/gamification.ts` exports `userStats`, `badges`, `userBadges`, `activities`

## Requirements

Create `src/services/gamification.ts` with:

### Badge Definitions (`BADGE_DEFS`)
A constant array of badge configs:

| name | actionType | count | xp | rarity |
|------|-----------|-------|----|--------|
| First Wish | wishlist_add | 1 | 10 | Common |
| Wishlist Collector | wishlist_add | 10 | 50 | Uncommon |
| Wishlist Hoarder | wishlist_add | 50 | 150 | Rare |
| Playlist Creator | playlist_create | 1 | 25 | Common |
| Playlist Master | playlist_create | 5 | 75 | Uncommon |
| Playlist Legend | playlist_create | 10 | 150 | Rare |
| Bargain Hunter | alert_create | 1 | 15 | Common |
| Deal Hawk | alert_create | 5 | 75 | Uncommon |
| Price Watcher | alert_create | 15 | 150 | Rare |
| All-Rounder | __meta__ | 3 | 100 | Epic |

### API Functions

**`processAction(userId, actionType, details?)`**
1. INSERT into `activities` table (event log): userId, actionType, details, createdAt=now()
2. UPSERT user_stats: `SET xp = xp + 5` (flat XP per action)
3. Check ALL badge criteria: for each badge def matching actionType (or __meta__), COUNT activities and compare
4. Award matching badges via `award_badge()` SQL function
5. Return `{ xpGained: number, xpTotal: number, newBadges: Badge[], leveledUp: boolean, newLevel: number }`
6. If ANY error → log and return null (NEVER throw — gamification must not block core actions)

**`getUserProfile(userId)`**
Parallel reads:
- `user_stats` row (LEFT JOIN to handle missing row: COALESCE(xp, 0))
- Badges: query user_badges JOIN badges
- Recent activity: last 20 from activities
Return `{ stats, badges, recentActivity }`

**`getLeaderboard(limit = 50)`**
- `SELECT FROM user_stats WHERE optInLeaderboard = true ORDER BY xp DESC LIMIT $1`
- Include badge count via subquery or Drizzle relation

**`seedBadges()`**
- `db.insert(badges).values(BADGE_DEFS.map(...)).onConflictDoNothing()`
- Idempotent, safe to call on deploy
- First migration handles setup; this is for dev/test convenience

### XP Formula
```ts
const XP_PER_ACTION = 5;
function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 10));
}
```

### Badge Criteria Evaluation

Standard badges (actionType ≠ `__meta__`):
```ts
const [result] = await db
  .select({ count: sql<number>`COUNT(*)` })
  .from(activities)
  .where(
    and(
      eq(activities.userId, userId),
      eq(activities.actionType, badge.actionType)
    )
  );
````

Meta badges (`__meta__`): count distinct categories of badges awarded. Categories derived from badge.actionType prefix (wishlist_, playlist_, alert_). All-Rounder needs ≥3 categories.

### DB Import
```ts
import { db } from '@/db';
import { badges, userBadges, activities, userStats } from '@/db/schema';
import { sql, eq, and, desc, inArray } from 'drizzle-orm';
```

### Constraints
- No `any` type annotations (use proper types — define interfaces at top of file)
- All functions wrapped in try/catch internally — never throw
- Drizzle `sql` tagged template for raw SQL COUNT queries
- Console.error for gamification failures (will be caught by Sentry when integrated)
- Test file at `src/services/__tests__/gamification.test.ts` — see below

### Testing

Create `src/services/__tests__/gamification.test.ts` with:

1. `processAction` inserts activity and upserts user_stats
2. Badge criteria matching — earns badge when count ≥ threshold
3. `calcLevel` — test formula boundaries (xp=0→0, xp=10→1, xp=40→2, xp=90→3, xp=10000→31)
4. Error resilience — when DB throws, returns null, doesn't propagate
5. Duplicate badge — award_badge is idempotent

Use mocks for DB (mock the db object). No real DB needed.

### Deliverables
- `src/services/gamification.ts`
- `src/services/__tests__/gamification.test.ts`
- Both pass `pnpm lint` + `pnpm exec tsc --noEmit` + `pnpm test -- --run`
- Committed
