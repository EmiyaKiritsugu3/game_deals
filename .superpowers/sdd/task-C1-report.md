# Task C1 Report — Gamification DB Migration

**Status**: DONE

## Summary

- Generated `drizzle/0013_user_stats.sql` via `pnpm db:generate --custom --name=user_stats`
- Wrote migration SQL: `user_stats` table (FK to `profiles.id`), RLS policies, `award_badge()` plpgsql function
- Added `userStats` Drizzle table export in `src/db/schema/gamification.ts`

## Test Results

- Biome: no issues
- tsc --noEmit: no errors

## Changes

| File | Action |
|------|--------|
| `drizzle/0013_user_stats.sql` | Created |
| `src/db/schema/gamification.ts` | Edited |

## Concerns

None.
