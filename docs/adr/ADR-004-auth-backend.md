# ADR-004: Auth & Backend Architecture — Supabase Auth + @supabase/server + Drizzle ORM

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10)
**Autor**: EmiyaKiritsugu3

---

## Contexto

GameDeals precisa de:
- **Autenticação social** (Google, Discord, Steam, GitHub, Email) com sessão SSR
- **Autorização granula** via Row Level Security (RLS)
- **Banco de dados PostgreSQL** com TimescaleDB para price history
- **Edge Functions** para ingestion/cleanup cron jobs
- **Realtime** para badges, notificações, feed social
- Zero overhead operacional (solo dev)

---

## Decisão

**Supabase** escolhido como plataforma unificada de backend.

### Stack de Autenticação (2026)

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

**Componentes**:
1. **`@supabase/ssr`** — SSR session hydration + middleware (atual)
2. **`@supabase/server`** — Novo (Maio 2026): Edge Functions, Vercel, Cloudflare, Bun — elimina boilerplate de client setup + JWT verification
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
-- Exemplo: Apenas usuário pode ver/editar própria wishlist
CREATE POLICY "individual_wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id);
```

---

## Consequências

### Positivas
- **Vendor-managed**: Zero ops — auth, DB, realtime, edge functions gerenciados
- **RLS nativo**: Segurança em nível de banco, independente de ORM
- **`@supabase/server`**: Elimina ~50 linhas de boilerplate por endpoint
- **Social providers**: Google, Discord, Steam, GitHub — configuração de 5 minutos
- **TimescaleDB nativo**: `pg_timescaledb` extension ativada

### Negativas
- **Vendor lock-in**: Auth e Realtime são proprietários (mitigado: DB é PostgreSQL padrão)
- **Supabase Pro**: $25/mês para TimescaleDB + pgvector + 500MB database
- **Edge Functions cold start**: ~100ms-1s (mitigado: cron jobs rodam infra)

---

## Referências
- [@supabase/server Announcement](https://supabase.com/blog/introducing-supabase-server) — Maio 2026
- [Supabase Auth SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [ADR-003: State Management](ADR-003-state-management.md) — Server Actions pattern
- `src/utils/supabase/` — Implementação atual
- `src/db/schema/` — Drizzle schema