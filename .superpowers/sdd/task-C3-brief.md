# Task C3: Action Hooks — Gamification Integration

## Context
Spec: docs/superpowers/specs/2026-06-23-sprint-15-p2-gamification-design.md §4.6
Service layer: `src/services/gamification.ts` (created in C2) exports `processAction(userId, actionType, details?)`

## Requirements

Add non-blocking gamification hooks to 4 existing server actions.

### Files to modify

**`src/actions/wishlist.ts`**
After successful wishlist insert, add:
```ts
try {
  const result = await processAction(userId, 'wishlist_add', { gameId });
  // result is for optional client-side toast/celebration
} catch (e) {
  console.error('Gamification failed (non-blocking):', e);
}
```

**`src/actions/playlists.ts`**
After successful playlist insert (createPlaylist):
```ts
try {
  const result = await processAction(userId, 'playlist_create', { playlistId });
} catch (e) {
  console.error('Gamification failed (non-blocking):', e);
}
```

After successful addGameToPlaylist:
```ts
try {
  const result = await processAction(userId, 'playlist_add', { gameId, playlistId });
} catch (e) {
  console.error('Gamification failed (non-blocking):', e);
}
```

**`src/actions/alerts.ts`**
After successful alert insert (createAlert):
```ts
try {
  const result = await processAction(userId, 'alert_create', { gameId, targetPrice });
} catch (e) {
  console.error('Gamification failed (non-blocking):', e);
}
```

### Integration pattern (same for all)
- Import: `import { processAction } from '@/services/gamification'`
- Place AFTER the core action succeeds (after DB insert/return)
- NEVER throw — wrap in try/catch
- If processAction already handles errors internally per C2 spec, try/catch is defensive double-wrap
- The userId is already available in all actions (from supabase auth session)

### Finding userId pattern
Check how existing actions get the user — look at `src/actions/wishlist.ts` for the pattern:
```ts
const { data: { user } } = await supabase.getUser();
```

### Constraints
- No `any` types
- Import path: `@/services/gamification`
- No new tests needed for hooks (they're 5-line wrappers) — but verify existing tests still pass

## Verification
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm test -- --run`
