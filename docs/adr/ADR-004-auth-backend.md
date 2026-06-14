# ADR-004: Auth & Backend Architecture — Supabase Auth + @supabase/server + Drizzle ORM

**Status**: Accepted
**Date**: 2026-06-09 (Updated 2026-06-10)
**Author**: EmiyaKiritsugu3

---

## Context

GameDeals needs:
- **Social authentication** (Google, Discord, Steam, GitHub, Email) with SSR session
- **Granular authorization** via Row Level Security (RLS)
- **PostgreSQL database** with TimescaleDB for price history
- **Edge Functions** for ingestion/cleanup cron jobs
- **Realtime** for badges, notifications, social feed
- Zero operational overhead (solo dev)

---

## Decision

**Supabase** chosen as unified backend platform.

### Authentication Stack (2026)

```typescript
// @supabase/server — Novo package (Maio 2026)
import { withSupabase } from '@supabase/server';

// Edge Function / API Route
export const { fetch } = withSupabase(
  { auth: 'user' },
  async (req: Request, ctx: SupabaseContext) => {
    const { data } = await ctx.supabase.from('wishlists').select();
    return Response.json(data);
  }
);

// Next.js Server Action pattern
export async function getUserAction() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

**Components**:
1. **`@supabase/ssr`** — SSR session hydration + middleware (current)
2. **`@supabase/server`** — New (May 2026): Edge Functions, Vercel, Cloudflare, Bun — eliminates client setup boilerplate + JWT verification
3. **`next/middleware`** — Route protection + session refresh

### Database (Drizzle ORM + Supabase PostgreSQL)

```typescript
// src/db/schema/users.ts
export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  email: varchar({ length: 255 }).unique(),
  username: varchar({ length: 100 }),
  avatarUrl: varchar({ length: 500 }),
  role: userRole().default('user'), // 'user' | 'mod' | 'admin'
  xp: integer().default(0).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const userRole = pgEnum('user_role', ['user', 'mod', 'admin']);
```

### Row Level Security (RLS)

```sql
-- Example: Only user can view/edit own wishlist
CREATE POLICY "individual_wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id);
```

---

## Consequences

### Positive
- **Vendor-managed**: Zero ops — auth, DB, realtime, edge functions managed
- **Native RLS**: Database-level security, independent of ORM
- **`@supabase/server`**: Eliminates ~50 lines of boilerplate per endpoint
- **Social providers**: Google, Discord, Steam, GitHub — 5-minute setup
- **Native TimescaleDB**: `pg_timescaledb` extension enabled

### Negative
- **Vendor lock-in**: Auth and Realtime are proprietary (mitigated: DB is standard PostgreSQL)
- **Supabase Pro**: $25/month for TimescaleDB + pgvector + 500MB database
- **Edge Functions cold start**: ~100ms-1s (mitigated: cron jobs run infra)

---

## References
- [@supabase/server Announcement](https://supabase.com/blog/introducing-supabase-server) — May 2026
- [Supabase Auth SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [ADR-003: State Management](ADR-003-state-management.md) — Server Actions pattern
- `src/utils/supabase/` — Current implementation
- `src/db/schema/` — Drizzle schema