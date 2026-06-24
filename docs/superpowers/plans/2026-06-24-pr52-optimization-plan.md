# Sprint 15 — PR #52 Optimization Plan

Based on ponytail review findings. ~70 lines reduction.

## 1. `getBadgeCategories` loop → SQL DISTINCT

**File:** `src/services/gamification.ts:L90-106`

**Current:** Fetch all earned badge names, iterate BADGE_DEFS.find per row, extract prefix.

**Optimized:**
```ts
async function getBadgeCategories(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ actionType: badges.criteria['actionType'] })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .where(sql`badges.criteria->>'actionType' != '__meta__'`);

  return new Set(rows.map(r => (r.actionType as string).split('_')[0]));
}
```

If Drizzle jsonb access is verbose, simplest: fetch distinct names, join BADGE_DEFS once in JS. Still cheaper than N queries.

## 2. Badge criteria check — batch by type

**File:** `src/services/gamification.ts:L142-171`

**Current:** Loops all matching defs, runs 1 COUNT query per def.

**Optimized:** Compute max count per actionType in 1 query, compare against def thresholds.

```ts
// Single query for standard badges
const counts = await db
  .select({
    actionType: activities.actionType,
    count: sql<number>`count(*)`,
  })
  .from(activities)
  .where(and(eq(activities.userId, userId), inArray(activities.actionType, standardTypes)))
  .groupBy(activities.actionType);
```

Then iterate defs vs pre-fetched counts. Saves N-1 queries per processAction call.

## 3. Remove `getBadgeIconSvg` function

**File:** `src/services/gamification.ts:L79-88`

**Current:** 10-line function with color map + SVG template.

**Optimized:** Inline in seedBadges. 5 SVG strings keyed by rarity. Remove function, simplify seedBadges to use the same pattern.

Or: keep as const SVG_BY_RARITY map in seedBadges. No function call overhead.

## 4. Deduplicate `RARITY_COLORS`

**Files:** `src/services/gamification.ts:L80-85`, `src/app/profile/page.tsx:L14-19`

**Current:** Same color map in 2 files.

**Optimized:** Export from gamification.ts, import in profile page.

```ts
// gamification.ts — add export
export const RARITY_COLORS: Record<string, string> = {
  Common: '#9ca3af',
  Uncommon: '#22c55e',
  Rare: '#3b82f6',
  Epic: '#a855f7',
};
```

```ts
// profile/page.tsx — replace local const
import { RARITY_COLORS } from '@/services/gamification';
```

## 5. Medal lookup array

**File:** `src/app/leaderboard/page.tsx:L24-35`

**Current:**
```tsx
{i === 0 && <span>🥇</span>}
{i === 1 && <span>🥈</span>}
{i === 2 && <span>🥉</span>}
{i >= 3 && <span>{i + 1}</span>}
```

**Optimized:**
```tsx
const MEDALS = ['🥇', '🥈', '🥉'];
<span>{MEDALS[i] ?? `${i + 1}`}</span>
```

1 line vs 7, functionally identical.

## 6. OptInToggle — form action, no client state

**File:** `src/app/profile/OptInToggle.tsx`

**Current:** useState + try/catch + loading state for toggle.

**Optimized:** Use Next.js Server Action directly via form.

```tsx
'use client';
import { useOptimistic } from 'react';
import { updateLeaderboardOptIn } from '@/actions/gamification';

export default function OptInToggle({ initialValue }: { initialValue: boolean }) {
  return (
    <form action={async (formData: FormData) => {
      const v = formData.get('optIn') === 'on';
      await updateLeaderboardOptIn(v);
    }}>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="optIn"
          defaultChecked={initialValue}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="h-4 w-4 rounded border-muted-foreground"
        />
        <span className="text-sm">Show me on the leaderboard</span>
      </label>
    </form>
  );
}
```

Zero client state. Zero loading states. Form handles it.

## Execution Order

| # | Task | Effort | Files |
|---|------|--------|-------|
| 1 | getBadgeCategories → SQL | 15min | gamification.ts |
| 2 | Batch badge check | 20min | gamification.ts |
| 3 | Remove getBadgeIconSvg | 5min | gamification.ts |
| 4 | Export RARITY_COLORS | 5min | gamification.ts, profile/page.tsx |
| 5 | Medal lookup | 2min | leaderboard/page.tsx |
| 6 | OptInToggle form action | 10min | OptInToggle.tsx |

**Total:** ~1h. Net: -70 lines.

## Rollback Safety

All changes are mechanical refactors. Tests cover core behavior:
- `gamification.test.ts` (15 tests) — verifies processAction, badge logic, calcLevel
- `page.test.tsx` (profile) — verifies page renders

Re-run after each step.
