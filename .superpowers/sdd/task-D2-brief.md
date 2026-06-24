# Task D2: Leaderboard Page

## Context
Spec: docs/superpowers/specs/2026-06-23-sprint-15-p2-gamification-design.md §5.2
Service: src/services/gamification.ts exports `getLeaderboard(limit?)`

## Requirements

Create new page: `src/app/leaderboard/page.tsx`

### Server Component
No 'use client'. Reads data via `getLeaderboard(50)`.

### Display
- Title: "Leaderboard"
- Table with 4 columns: Rank, User, Badges, XP
- Rank: 1, 2, 3 with small medal emoji/trophy icon for top 3
- User: email prefix (text before @) or "Anonymous Player". If no display name available, default "Player {{number}}".
- Badges: count number
- XP: number formatted with locale separator

### Empty State
If no users opted in → show:
```
Be the first to join the leaderboard!
Opt in from your Profile page.
```

### Style
Clean table layout. Trophy icon (lucide-react `Trophy`) for top row.

### Path
`/leaderboard` — works as route segment. No params needed.

## Verification
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm test -- --run`
