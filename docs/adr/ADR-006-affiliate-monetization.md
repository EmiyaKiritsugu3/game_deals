# ADR-006: Affiliate Monetization — Cloaking Gateway /out Route

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10)
**Autor**: EmiyaKiritsugu3

---

## Contexto

Monetização principal do GameDeals via **links de afiliado**. Necessidades:

- **Cloaking**: Links curtos internos (`/out/steam/game-123`) → redireciona com parâmetros de tracking
- **LGPD compliance**: Consentimento via cookie banner + cookie table
- **Multi-store**: Steam, Epic, GOG, Humble, Fanatical, GreenManGaming, Nuuvem (futuro)
- **Multi-network**: Rakuten, CJ, Awin (pending), Impact (future)
- **Tracking**: Contagem de cliques, conversão, CTR por store/game

---

## Decisão

### Affiliate Cloaking Route

```typescript
// src/app/out/[storeId]/[gameSlug]/route.ts
import { redirect } from 'next/navigation';
import { drizzle } from '@/db';
import { affiliateLinks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(
  _req: Request,
  { params }: { params: { storeId: string; gameSlug: string } }
) {
  const affiliate = await drizzle.query.affiliateLinks.findFirst({
    where: and(
      eq(affiliateLinks.storeId, params.storeId),
      eq(affiliateLinks.gameSlug, params.gameSlug)
    )
  });

  if (!affiliate) return redirect('/404');

  // Log click (background)
  await drizzle.insert(affiliateClicks).values({
    storeId: params.storeId,
    gameSlug: params.gameSlug,
    userId: (await getUser())?.id ?? null,
    ip: anonymizeIp(/* */),
    userAgent: /* */,
    timestamp: new Date()
  });

  // Build tracking URL
  const url = buildAffiliateUrl(affiliate.url, {
    clickId: affiliate.id,
    cookie: (await cookies()).get('gamedeals_ref')?.value,
    source: 'gamedeals'
  });

  redirect(url);
}
```

### Edge Cache Pattern

```typescript
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // sempre fresh para redirect
```

### Affiliate Link Table (Drizzle ORM)

```typescript
// src/db/schema/affiliates.ts
export const affiliateLinks = pgTable('affiliate_links', {
  id: uuid().defaultRandom().primaryKey(),
  storeId: varchar({ length: 50 }).notNull(),       // 'steam', 'epic', 'gog'
  gameSlug: varchar({ length: 255 }).notNull(),
  network: varchar({ length: 50 }).notNull(),        // 'rakuten', 'cj', 'awin'
  url: varchar({ length: 2000 }).notNull(),          // Original store URL
  trackingTemplate: varchar({ length: 2000 }),       // URL template with {clickId}
  updatedAt: timestamp().defaultNow().notNull(),
});

export const affiliateClicks = pgTable('affiliate_clicks', {
  id: uuid().defaultRandom().primaryKey(),
  storeId: varchar({ length: 50 }).notNull(),
  gameSlug: varchar({ length: 255 }).notNull(),
  userId: uuid(),
  ip: varchar({ length: 45 }),
  timestamp: timestamp().defaultNow().notNull(),
});
```

---

## Consequências

### Positivas
- **SEO limpo**: Todos links internos, sem parâmetros de afiliado nos crawled pages
- **Tracking próprio**: Banco de cliques para analytics, CTR reports
- **LGPD compliant**: IP anonimizado, consentimento via banner
- **Edge-ready**: Route handlers no Edge, redirect 307/302 rápido
- **Swap fácil**: Trocar network só muda `trackingTemplate` no banco

### Negativas / Trade-offs
- **Redirect overhead**: 307 redirect adiciona ~50ms (mitigado: Edge runtime)
- **Dados de conversão**: Requer parceria com network para postback (supabase webhook)
- **Nuuvem/CJ/Awin**: Pendente aprovação (afiliados BR têm requisitos específicos)

---

## Referências
- [Rakuten Affiliate API](https://rakutenmarketing.com/affiliate)
- [CJ Affiliate](https://www.cj.com)
- [Awin](https://www.awin.com)
- [ADR-003: State Management](ADR-003-state-management.md) — click analytics via TanStack Query
- [ADR-004: Auth & Backend](ADR-004-auth-backend.md) — Drizzle + Supabase
- `src/app/out/[storeId]/[gameSlug]/route.ts` — Implementação