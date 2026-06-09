# ADR-006: Monetization — Affiliate Cloaking Gateway (/out)

**Status**: Aceito
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

O modelo de negócio do GameDeals é **afiliados + ads**:
- **Affiliate networks**: Rakuten (lojas oficiais), CJ / Awin (keyshops + algumas oficiais)
- **Requisitos**: Links devem conter tracking parameters (click_id, publisher_id, etc.)
- **Problemas**: Links diretos expõem estrutura de afiliado; usuários podem remover params; redes bloqueiam links "naked"; SEO prefere links limpos
- **Compliance**: GDPR/LGPD — não vazar PII no referrer; `rel="nofollow sponsored"`

## Decisão

**Cloaking Gateway via Next.js Route: `/out/[storeId]/[gameId]`**

### Arquitetura

```
User Click
    │
    ▼
/out/steam/12345  (Next.js Route Handler)
    │
    ├── Lookup: storeId → affiliate_network + tracking_template
    │
    ├── Build: final_url = template.replace({gameId, clickId, subId})
    │
    ├── Log: click event (anonimizado) → analytics / Supabase
    │
    └── Redirect 302 → Final Affiliate URL
```

### Implementação (`src/app/out/[storeId]/[gameId]/route.ts`)

```typescript
// Mapeamento store → affiliate config
const AFFILIATE_MAP: Record<string, AffiliateConfig> = {
  steam: {
    network: 'rakuten',
    baseUrl: 'https://store.steampowered.com/app/',
    template: 'https://click.linksynergy.com/deeplink?id={pubId}&mid={mid}&murl={encodedUrl}',
    params: { pubId: 'RAKUTEN_PUB_ID', mid: 'STEAM_MID' },
  },
  greenmangaming: {
    network: 'rakuten',
    baseUrl: 'https://www.greenmangaming.com/games/',
    template: 'https://click.linksynergy.com/deeplink?id={pubId}&mid={mid}&murl={encodedUrl}',
    params: { pubId: 'RAKUTEN_PUB_ID', mid: 'GMG_MID' },
  },
  cdkeys: {
    network: 'cj',
    baseUrl: 'https://www.cdkeys.com/',
    template: 'https://www.dpbolvw.net/click-{cid}-{pid}?url={encodedUrl}',
    params: { cid: 'CJ_CID', pid: 'CJ_PID' },
  },
  // ... kinguin, eneba, instantgaming, fanatical, humble, gog, epic
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; gameId: string }> }
) {
  const { storeId, gameId } = await params;
  const config = AFFILIATE_MAP[storeId];

  if (!config) {
    return new Response('Store not configured', { status: 404 });
  }

  // Build destination URL
  const destinationUrl = `${config.baseUrl}${gameId}`;

  // Build affiliate URL
  const affiliateUrl = config.template
    .replace('{encodedUrl}', encodeURIComponent(destinationUrl))
    .replace('{pubId}', config.params.pubId)
    .replace('{mid}', config.params.mid)
    .replace('{cid}', config.params.cid)
    .replace('{pid}', config.params.pid);

  // Generate click ID for tracking (anonimizado)
  const clickId = crypto.randomUUID();

  // Log click (async, non-blocking)
  logClickEvent({ storeId, gameId, clickId, network: config.network });

  // Redirect
  return Response.redirect(affiliateUrl, 302);
}
```

### UI Integration

```tsx
// components/DealRow.tsx
<Button
  asChild
  onClick={() => router.push(`/out/${deal.storeId}/${deal.gameId}`)}
>
  <a
    href={`/out/${deal.storeId}/${deal.gameId}`}
    rel="nofollow sponsored"
    target="_blank"
    rel="noopener noreferrer"
  >
    Ver Oferta
  </a>
</Button>
```

### Analytics de Cliques

```typescript
// lib/analytics.ts
async function logClickEvent(data: ClickEvent) {
  // Option 1: Vercel Analytics (event customizado)
  // Option 2: Supabase Edge Function (batched)
  // Option 3: Plausible/Umami self-hosted
  await supabase.from('affiliate_clicks').insert({
    store_id: data.storeId,
    game_id: data.gameId,
    network: data.network,
    click_id: data.clickId,
    user_id: getCurrentUserId(), // null se anon
    created_at: new Date().toISOString(),
  });
}
```

### Schema: `affiliate_clicks`

```sql
CREATE TABLE affiliate_clicks (
  id BIGSERIAL PRIMARY KEY,
  store_id TEXT NOT NULL,
  game_id BIGINT NOT NULL,
  network TEXT NOT NULL,           -- 'rakuten', 'cj', 'awin'
  click_id UUID NOT NULL,          -- para dedup/reconciliação
  user_id UUID REFERENCES profiles(id),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_clicks_store_game ON affiliate_clicks(store_id, game_id);
CREATE INDEX idx_affiliate_clicks_created ON affiliate_clicks(created_at DESC);
```

## Consequências

### Positivas
- **Links limpos no UI**: `/out/steam/12345` vs URL feia com 10 params
- **Tracking confiável**: Click ID próprio + network params; dedup no dashboard da rede
- **Flexibilidade**: Trocar rede afiliada = mudar 1 linha no map; zero mudança no frontend
- **Compliance**: `rel="nofollow sponsored"` + no referrer leakage (redirect 302 limpa referrer)
- **Analytics próprio**: Dados de CTR, conversion por store/game/network no Supabase
- **A/B testing**: Fácil testar templates diferentes por store

### Negativas / Trade-offs
- **Extra hop**: 302 redirect adiciona ~50-150ms latency; mitigado: edge function (Vercel Edge Runtime)
- **Complexidade**: Manter `AFFILIATE_MAP` atualizado conforme redes mudam templates
- **Ad blockers**: Podem bloquear `/out/*`; mitigado: path neutro, sem "affiliate" no nome
- **Network compliance**: Algumas redes exigem subId único por click; clickId resolve

### Plano de Evolução
- **Phase 1 (atual)**: Cloaking básico + logging Supabase
- **Phase 2**: Edge Function no Vercel (latency < 20ms global)
- **Phase 3**: SubId dinâmico por usuário logado (atribuição LTV)
- **Phase 4**: Smart linking — detecta device/geo → roteia para melhor oferta (ex: mobile → app store link)

---

## Referências
- [Task.md Phase 10 & 12f](../task.md)
- `src/app/out/[storeId]/[gameId]/route.ts` — implementação
- `src/components/DealRow.tsx` — integração UI