# Task D1: Profile Page — Gamification Expansion

## Context
Spec: docs/superpowers/specs/2026-06-23-sprint-15-p2-gamification-design.md §5.1
Current profile: src/app/profile/page.tsx (42 lines — just email, provider, member_since)
Service: src/services/gamification.ts exports `getUserProfile(userId)`

## Requirements

Expand `/profile` page with 4 new sections below existing info.

### Architecture
Keep it a **Server Component** (no 'use client').
`getUserProfile()` returns everything in one parallel query.

### 1. XP Bar + Level

Reads `user_stats` via LEFT JOIN (new users may not have row yet).
Show:
- Current level (calculated from XP: `floor(sqrt(xp / 10))`)
- "Level 3" heading
- Progress bar: `width = (xpSinceLastLevel / xpNeededForNextLevel) * 100%`
  - `xpSinceLastLevel = xp - xpForLevel(currentLevel)`
  - `xpForLevel(L) = L * L * 10`
  - `xpNeededForNextLevel = xpForLevel(L+1) - xpForLevel(L)`
- If no user_stats row → show "Start adding games to earn XP!" empty state

### 2. Badge Grid

3-column grid. Each badge card:
- SVG icon (rendered from `badge.iconSvg` — raw SVG string via `dangerouslySetInnerHTML`)
- Badge name
- Rarity border color: Common=gray, Uncommon=green, Rare=blue, Epic=purple
- If no badges → show "No badges yet." text

### 3. Activity Feed

Last 20 activities, styled as simple timeline.
Each entry: icon (based on actionType), actionType formatted nicely, timestamp.
If empty → hide section.

### 4. Leaderboard Opt-In Toggle

Client component (`'use client'`) embedded at bottom:
- Checkbox + "Show me on the leaderboard" label
- Reads initial value from `user_stats.opt_in_leaderboard`
- On toggle: calls server action to update `user_stats.opt_in_leaderboard`

**New supporting files:**

`src/actions/gamification.ts` — server action:
```ts
'use server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { userStats } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function updateLeaderboardOptIn(optIn: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.getUser();
  if (!user) throw new Error('Not authenticated');
  
  await db.insert(userStats)
    .values({ userId: user.id, xp: 0, optInLeaderboard: optIn })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: { optInLeaderboard: optIn },
    });
}
```

`src/app/profile/OptInToggle.tsx` — client component:
```tsx
'use client';
// Checkbox + label + useState + call to updateLeaderboardOptIn
```

`src/components/LevelBadge.tsx` — reusable:
- Props: `level: number`, `xp: number`, `xpToNext: number`
- Renders: level number in circle, XP bar, "X / Y XP to next level"

### Constraints
- SVG icon rendering: use `dangerouslySetInnerHTML` with biome-ignore comment (inline SVGs from DB, safe content)
- Rarity colors: use CSS classes or inline styles, not Tailwind
- Kebab-case file names
- No `any` types

## Verification
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm test -- --run`
