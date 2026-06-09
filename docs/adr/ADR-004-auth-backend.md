# ADR-004: Auth & Backend — Supabase (PostgreSQL + Auth + Realtime)

**Status**: Aceito
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals precisa de backend para:
- **Auth**: Login social (Google, Discord, Steam fut), email/password, sessões persistentes
- **Database**: Perfis, wishlists, price alerts, playlists, reviews, badges, user stats
- **Realtime**: Notificações de price drop, activity feed, conquistas
- **Storage**: Avatares, screenshots de reviews, imagens de collections
- **Edge Functions**: Cron jobs de verificação de preço, webhooks de affiliate networks
- **Baixo ops**: Sem gerenciar servidores, k8s, PostgreSQL tuning

Opções avaliadas:
| Opção | Pros | Contras |
|-------|------|---------|
| **Supabase** | PostgreSQL real, Auth built-in, Realtime, Storage, Edge Functions, Generous free tier, Open source | Vendor lock-in (mitigado: PostgreSQL padrão) |
| **Firebase** | Realtime excelente, Auth fácil | NoSQL (não relacional), vendor lock-in forte, custos escalam |
| **PlanetScale** | MySQL serverless, branching | Sem Auth/Realtime/Storage nativos; precisaria serviços separados |
| **Neon** | PostgreSQL serverless, branching | Sem Auth/Realtime/Storage; só DB |
| **Railway + PostgreSQL + Próprio Auth** | Controle total | Ops overhead alto; reinventar roda |

## Decisão

**Supabase como Backend-as-a-Service completo**

### Schema Principal (Phase 12b + 19)

```sql
-- Auth: supabase.auth.users (managed)

-- Perfil público do usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  region TEXT DEFAULT 'BR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist (synced from localStorage on login)
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL,           -- CheapShark/IGDB ID
  game_slug TEXT,                    -- para URL amigável
  added_at TIMESTAMPTZ DEFAULT NOW(),
  target_price DECIMAL(10,2),        -- price alert threshold
  notify_on_sale BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, game_id)
);

-- Price Alerts (independent of wishlist)
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification (Phase 19)
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_svg TEXT NOT NULL,            -- SVG inline para carregamento instantâneo
  rarity TEXT CHECK (rarity IN ('Common','Rare','Epic','Legendary')),
  criteria JSONB NOT NULL            -- {type: 'playlists_count', threshold: 10}
);

CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  playlists_count INT DEFAULT 0,
  reviews_count INT DEFAULT 0,
  xp INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Playlists (UGC)
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,         -- /playlist/[slug]
  is_public BOOLEAN DEFAULT TRUE,
  game_ids BIGINT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 10),
  content TEXT,
  hours_played DECIMAL(6,1),
  is_recommended BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections (editorial)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  game_ids BIGINT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Profiles: público leitura, próprio usuário escrita
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own insert/update" ON profiles FOR ALL USING (auth.uid() = id);

-- Wishlists: próprio usuário CRUD
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own CRUD" ON wishlists FOR ALL USING (auth.uid() = user_id);

-- Price Alerts: próprio usuário CRUD
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own CRUD" ON price_alerts FOR ALL USING (auth.uid() = user_id);

-- Badges/Stats: público leitura, system escrita (via Edge Function)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON badges FOR SELECT USING (true);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own read" ON user_stats FOR SELECT USING (auth.uid() = user_id);
-- Edge Function com service_role key faz INSERT/UPDATE

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own read" ON user_badges FOR SELECT USING (auth.uid() = user_id);
```

### Vercel Cron Job (Phase 12e)

```typescript
// app/api/cron/check-prices/route.ts
export async function GET(request: Request) {
  // Verify CRON_SECRET
  // Fetch active price_alerts
  // Call CheapShark for current prices
  // If current_price <= target_price → send notification (email/push)
  // Update last_checked
}
```

Schedule: `0 */6 * * *` (a cada 6h) via `vercel.json`

## Consequências

### Positivas
- **PostgreSQL real**: SQL padrão, migrações versionadas, ferramentas maduras
- **Auth completo**: Social providers, MFA, session management, row-level security
- **Realtime nativo**: Subscribe a mudanças em wishlists/alerts/badges sem WebSocket manual
- **Edge Functions**: Cron jobs, webhooks, auth hooks em TypeScript (Deno runtime)
- **Free tier generoso**: 500MB DB, 1GB file storage, 2M auth MAUs, 500k realtime msgs/mês
- **TypeScript end-to-end**: `supabase-js` + generated types via `supabase gen types`

### Negativas / Trade-offs
- **Vendor lock-in**: Auth/Realtime/Storage são proprietários; DB é PostgreSQL padrão (migração viável)
- **Cold starts Edge Functions**: ~100-500ms; mitigado: keep-alive ou funções leves
- **RLS complexity**: Policies complexas podem ter performance impact; testar com `EXPLAIN ANALYZE`
- **Região**: Supabase regions limitadas (us-east, eu-west, ap-northeast); BR users → us-east ou eu-west

### Mitigações
- **Backup strategy**: `pg_dump` automático + point-in-time recovery (Supabase Pro)
- **Local dev**: `supabase start` (Docker) para dev offline; `supabase db push` para sync schema
- **Types**: `npm run gen:types` gera `src/types/supabase.ts` com types exatos do schema

---

## Referências
- [Supabase Setup Guide](../supabase_setup_guide.md)
- [Gamification Plan](../gamification_plan.md)
- [Task.md Phase 12 & 19](../task.md)
- `src/lib/supabase/` — client setup (server + browser)