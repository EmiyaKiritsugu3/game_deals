# ADR-007: Gamification System — Badges, XP, Playlists

**Status**: Accepted
**Date**: 2026-06-09 (Updated 2026-06-10)
**Author**: EmiyaKiritsugu3

---

## Context

Engagement via UGC: playlists, badges, reviews, XP system. Data updated in realtime via **Supabase Realtime**.

---

## Decision

### Updated Architecture (2026)

| Feature | Storage | Realtime | Data Fetching |
|---------|---------|----------|---------------|
| Playlists | Supabase (PostgreSQL) | Supabase Realtime subscriptions | Server Actions + TanStack Query |
| Badges | Supabase (PostgreSQL) | WebSocket push on unlock | Server Actions + `use cache` |
| XP System | Supabase (PostgreSQL) | WebSocket push on increment | Server Actions (transactional) |
| Reviews | Supabase (PostgreSQL) | RLS + serve-side rendering | TanStack Query + Server Actions |

### Badge System

```typescript
// src/db/schema/badges.ts
export const badges = pgTable('badges', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  description: varchar({ length: 500 }),
  icon: varchar({ length: 100 }), // Lucide icon name
  criteria: jsonb().notNull(),     // { "type": "deals_saved", "threshold": 10, "metric": "count" }
  xpReward: integer().default(0),
});

export const userBadges = pgTable('user_badges', {
  userId: uuid().references(() => users.id).notNull(),
  badgeId: uuid().references(() => badges.id).notNull(),
  unlockedAt: timestamp().defaultNow().notNull(),
});
```

### Realtime Updates

Playlists, badges, notifications use **Supabase Realtime** (WebSocket) for real-time updates without polling.

---

## Consequences
- **Engagement**: Playlists and badges increase retention
- **Realtime**: Push notifications and badge unlock via Supabase Realtime (WebSocket)
- **Drizzle**: Type-safe schema for all gamification entities

---

## References
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Drizzle + Supabase infrastructure
- [ADR-004: Auth & Backend](ADR-004-auth-backend.md) — User roles + RLS