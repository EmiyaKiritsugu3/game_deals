# ADR-009: Price History Storage — TimescaleDB (via Supabase) + Drizzle ORM

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10)
**Autor**: EmiyaKiritsugu3

---

## Contexto

Armazenar histórico de preços para cada jogo/game×store permite:
- **Historical Lows**: Menor preço já visto (badge "All-Time Low")
- **Price Charts**: Visualização no Sidebar Modal (Recharts)
- **Price Alerts**: Notificar usuário quando preço atinge threshold
- **Trend Analysis**: "Cheaper than average" badges, price drop % badges
- **SEO**: Schema.org `OfferCatalog` com histórico = dados estruturados enriquecidos

TimescaleDB é escolhido sobre PostgreSQL vanilla por:
- **Continuous Aggregates**: Atualizam automaticamente (sem cron para stats)
- **Compression**: 90%+ compressão em dados de séries temporais
- **Time-based partitioning**: `chunk_time_interval` = 1 dia
- **Retention policies**: Automáticas (ex: manter 2 anos, deletar > 2 anos)

---

## Decisão

### Schema Drizzle + TimescaleDB

```typescript
// src/db/schema/priceHistory.ts
export const priceHistory = pgTable('price_history', {
  id: uuid().defaultRandom().primaryKey(),
  gameId: uuid().references(() => games.id).notNull(),
  storeId: varchar({ length: 50 }).notNull(),
  price: numeric(10, 2).notNull(),
  currency: varchar({ length: 3 }).default('BRL'),
  isOnSale: boolean().default(false),
  saleEndDate: timestamp(),
  recordedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  timeIdx: index('idx_price_history_time').on(table.recordedAt),
  gameStoreIdx: index('idx_price_history_game_store').on(table.gameId, table.storeId),
}));

// Timestamp hypertable setup (executado uma vez no Supabase SQL Editor)
// SELECT create_hypertable('price_history', 'recorded_at', chunk_time_interval => INTERVAL '1 day');
```

### Continuous Aggregates (Views automáticas)

```sql
-- Preço mínimo diário por jogo×loja
CREATE MATERIALIZED VIEW daily_price_min
WITH (timescaledb.continuous) AS
SELECT
  game_id,
  store_id,
  time_bucket('1 day', recorded_at) AS day,
  MIN(price) AS min_price,
  MIN(price) FILTER (WHERE is_on_sale) AS sale_price
FROM price_history
GROUP BY game_id, store_id, time_bucket('1 day', recorded_at);

-- Refresh policy (atualiza a cada hora, janela de 2 dias)
SELECT add_continuous_aggregate_policy('daily_price_min',
  start_offset => INTERVAL '2 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour'
);
```

### Data Access (Drizzle + Server Actions)

```typescript
'use server';
import { drizzle } from '@/db';
import { priceHistory } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export async function getPriceHistory(gameId: string, storeId: string) {
  return drizzle.select({
    price: priceHistory.price,
    recordedAt: priceHistory.recordedAt,
    isOnSale: priceHistory.isOnSale,
  })
  .from(priceHistory)
  .where(
    and(
      eq(priceHistory.gameId, gameId),
      eq(priceHistory.storeId, storeId),
      sql`recorded_at > NOW() - INTERVAL '1 year'`
    )
  )
  .orderBy(desc(priceHistory.recordedAt))
  .limit(365);
}
```

### Ingestion (Edge Function + Vercel Cron)

```typescript
// src/app/api/cron/ingest-prices/route.ts
export async function GET() {
  const deals = await fetchCheapSharkDeals();
  const prices = deals.map(deal => ({
    gameId: deal.gameId,
    storeId: deal.storeId,
    price: deal.salePrice,
    isOnSale: deal.salePrice < deal.retailPrice,
  }));

  await drizzle.insert(priceHistory).values(prices);
  // Se houverem novos Historical Lows, disparar notificação
  return Response.json({ ingested: prices.length });
}
```

---

## Consequências

### Positivas
- **Historical Low real**: Baseado em dados reais, não simulado
- **Sem cron para stats**: Continuous aggregates atualizam automaticamente
- **Compressão**: 90%+ redução de storage em dados de séries temporais
- **Retenção automática**: Política de 2 anos, dados antigos deletados automaticamente
- **Charts otimizados**: Queries agregadas por hora/dia/mês via time_bucket
- **Alertas**: Comparação preço atual vs histórico para notificações

### Negativas
- **TimescaleDB**: Necessário ativar extensão no Supabase (ativado no Pro plan)
- **Storage**: ~100MB/ano para 50k jogos × 30 stores (mitigado: compressão 90%)
- **Cron ingestion**: Vercel Cron Job com 300s timeout e 512MB memory
- **Cold query**: Primeira query em hypertable pode ser lenta (cache warming)

---

## Referências
- [TimescaleDB Continuous Aggregates](https://docs.timescale.com/getting-started/latest/create-caggs/)
- [Supabase TimescaleDB Docs](https://supabase.com/partners/integrations/timescaledb)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Drizzle + Supabase infrastructure
- [ADR-005: Deployment](ADR-005-deployment-strategy.md) — Cron jobs schedule
- `src/db/schema/priceHistory.ts` — Drizzle schema
- `src/app/api/cron/ingest-prices/route.ts` — Cron ingestion handler