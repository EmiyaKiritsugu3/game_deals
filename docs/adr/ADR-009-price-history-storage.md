# ADR-009: Price History Storage — TimescaleDB (via Supabase) + Drizzle ORM

**Status**: Accepted
**Date**: 2026-06-09 (Updated 2026-06-10)
**Author**: EmiyaKiritsugu3

---

## Context

Storing price history for each game/game×store enables:
- **Historical Lows**: Lowest price ever seen ("All-Time Low" badge)
- **Price Charts**: Visualization in Sidebar Modal (Recharts)
- **Price Alerts**: Notify user when price reaches threshold
- **Trend Analysis**: "Cheaper than average" badges, price drop % badges
- **SEO**: Schema.org `OfferCatalog` with history = enriched structured data

TimescaleDB is chosen over vanilla PostgreSQL for:
- **Continuous Aggregates**: Update automatically (no cron for stats)
- **Compression**: 90%+ compression on time-series data
- **Time-based partitioning**: `chunk_time_interval` = 1 day
- **Retention policies**: Automatic (e.g.: keep 2 years, delete > 2 years)

---

## Decision

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

### Continuous Aggregates (Automatic Views)

```sql
-- Daily minimum price per game×store
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

-- Refresh policy (updates every hour, 2-day window)
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
  // If there are new Historical Lows, trigger notification
  return Response.json({ ingested: prices.length });
}
```

---

## Consequences

### Positive
- **Real Historical Low**: Based on real data, not simulated
- **No cron for stats**: Continuous aggregates update automatically
- **Compression**: 90%+ storage reduction on time-series data
- **Automatic retention**: 2-year policy, old data deleted automatically
- **Optimized charts**: Aggregated queries by hour/day/month via time_bucket
- **Alerts**: Current price vs history comparison for notifications

### Negative
- **TimescaleDB**: Extension must be enabled on Supabase (enabled on Pro plan)
- **Storage**: ~100MB/year for 50k games × 30 stores (mitigated: 90% compression)
- **Cron ingestion**: Vercel Cron Job with 300s timeout and 512MB memory
- **Cold query**: First query on hypertable can be slow (cache warming)

---

## References
- [TimescaleDB Continuous Aggregates](https://docs.timescale.com/getting-started/latest/create-caggs/)
- [Supabase TimescaleDB Docs](https://supabase.com/partners/integrations/timescaledb)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Drizzle + Supabase infrastructure
- [ADR-005: Deployment](ADR-005-deployment-strategy.md) — Cron jobs schedule
- `src/db/schema/priceHistory.ts` — Drizzle schema
- `src/app/api/cron/ingest-prices/route.ts` — Cron ingestion handler