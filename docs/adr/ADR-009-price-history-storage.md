# ADR-009: Price History Storage — TimescaleDB / PostgreSQL para Séries Temporais

**Status**: Proposto
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

Para exibir gráficos de histórico de preço (6 meses, 1 ano, all-time) e calcular:
- **Historical Low** real (não simulado)
- **Price drop alerts** (notificar quando preço atinge threshold)
- **Deal rating** baseado em histórico real vs atual
- **Trends**: "Preço subindo/descendo", "Melhor hora para comprar"

Atualmente: CheapShark retorna apenas `cheapestPriceEver` (ponto único) + preço atual. Não há série temporal.

Volume estimado:
- ~50k jogos ativos monitorados
- 6 lojas oficiais principais + 5 keyshops
- 1 snapshot/dia/loja/jogo = 50k × 11 × 1 = 550k rows/dia
- 30 dias = 16.5M rows
- 1 ano = ~200M rows

## Decisão

**TimescaleDB (extensão PostgreSQL nativa no Supabase)**

### Por que TimescaleDB

| Critério | TimescaleDB | PostgreSQL puro | InfluxDB | ClickHouse |
|----------|-------------|-----------------|----------|------------|
| **SQL nativo** | ✅ | ✅ | ❌ (Flux/SQL-like) | ❌ (ClickHouse SQL) |
| **Hypertables** | ✅ Automático | Manual partitioning | N/A | MergeTree |
| **Compression** | ✅ 90%+ (native) | ❌ | ✅ | ✅ |
| **Continuous Aggregates** | ✅ Materialized views auto-refresh | Manual | ✅ | ✅ |
| **Supabase** | ✅ Habilitado por padrão | ✅ | ❌ | ❌ |
| **Ops** | Zero (managed) | Zero | Self-hosted/Cloud | Self-hosted/Cloud |
| **Retention policies** | ✅ `add_retention_policy` | Manual | ✅ | ✅ |
| **Downsampling** | ✅ Continuous aggregates | Manual | ✅ | ✅ |

### Schema

```sql
-- Habilitar TimescaleDB (já disponível no Supabase)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Tabela principal: price snapshots
CREATE TABLE price_history (
  game_id BIGINT NOT NULL,              -- CheapShark/IGDB ID
  store_id TEXT NOT NULL,               -- 'steam', 'gog', 'cdkeys', etc.
  region TEXT NOT NULL DEFAULT 'BR',    -- Região do preço
  price_brl DECIMAL(10,2) NOT NULL,     -- Preço em BRL (normalizado)
  price_original DECIMAL(10,2),         -- Preço na moeda original
  currency TEXT DEFAULT 'BRL',
  discount_pct SMALLINT,                -- % desconto (0-100)
  deal_rating REAL,                     -- CheapShark dealRating
  is_keyshop BOOLEAN DEFAULT FALSE,     -- Flag keyshop vs official
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (game_id, store_id, region, recorded_at)
);

-- Transformar em Hypertable (chunk por dia)
SELECT create_hypertable('price_history', 'recorded_at', chunk_time_interval => INTERVAL '1 day');

-- Compressão (após 7 dias)
ALTER TABLE price_history SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'game_id, store_id, region'
);
SELECT add_compression_policy('price_history', INTERVAL '7 days');

-- Retenção: manter 2 anos de dados granulares
SELECT add_retention_policy('price_history', INTERVAL '2 years');

-- Continuous Aggregate: daily OHLC (Open, High, Low, Close) por jogo/loja
CREATE MATERIALIZED VIEW price_history_daily
WITH (timescaledb.continuous) AS
SELECT
  game_id,
  store_id,
  region,
  time_bucket('1 day', recorded_at) AS bucket,
  FIRST(price_brl, recorded_at) AS open_price,
  MAX(price_brl) AS high_price,
  MIN(price_brl) AS low_price,         -- Historical Low real!
  LAST(price_brl, recorded_at) AS close_price,
  AVG(discount_pct)::SMALLINT AS avg_discount,
  MAX(deal_rating) AS max_deal_rating,
  COUNT(*) AS snapshots_count
FROM price_history
GROUP BY game_id, store_id, region, bucket
WITH NO DATA;

-- Refresh policy: atualiza a cada hora
SELECT add_continuous_aggregate_policy('price_history_daily',
  start_offset => INTERVAL '2 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- Índices para queries comuns
CREATE INDEX idx_price_history_game_store ON price_history (game_id, store_id, region, recorded_at DESC);
CREATE INDEX idx_price_history_game_recorded ON price_history (game_id, recorded_at DESC);
```

### Ingestion Pipeline (Vercel Cron Job)

```typescript
// app/api/cron/ingest-prices/route.ts
export async function GET() {
  // 1. Fetch active games from CheapShark (top 5000 by dealRating)
  // 2. Para cada jogo, fetch deals atuais (official + keyshops simulados)
  // 3. Batch insert em price_history (ON CONFLICT DO NOTHING)
  // 4. Log stats: inserted, skipped, errors
}
```

Schedule: `0 3 * * *` (3am UTC = 00h BR) — baixa carga CheapShark

### Queries Comuns

```sql
-- Historical Low real (últimos 2 anos)
SELECT MIN(low_price) AS historical_low
FROM price_history_daily
WHERE game_id = $1 AND store_id = $2 AND region = 'BR';

-- Price chart data (6 meses) — usa continuous aggregate (rápido)
SELECT bucket AS date, low_price, high_price, close_price, avg_discount
FROM price_history_daily
WHERE game_id = $1 AND store_id = $2 AND region = 'BR'
  AND bucket >= NOW() - INTERVAL '6 months'
ORDER BY bucket ASC;

-- Price drop detection (para alerts)
SELECT ph.game_id, ph.store_id, ph.price_brl, ph.recorded_at
FROM price_history ph
JOIN price_alerts pa ON pa.game_id = ph.game_id AND pa.store_id = ph.store_id
WHERE ph.price_brl <= pa.target_price
  AND ph.recorded_at > pa.last_checked
  AND pa.is_active = TRUE;
```

## Consequências

### Positivas
- **Historical Low real**: Não depende de `cheapestPriceEver` da API (que pode ser manipulado/incorreto)
- **Queries rápidas**: Continuous aggregates = gráficos 6 meses em <50ms
- **Compressão automática**: 90%+ redução de storage; 2 anos ≈ 20GB raw → 2GB comprimido
- **Zero ops**: Supabase gerencia TimescaleDB; backups, upgrades, tuning inclusos
- **SQL padrão**: Qualquer dev conhece; ferramentas BI (Metabase, Supabase Dashboard) funcionam
- **Downsampling automático**: Dados granulares → daily → weekly → monthly via policies

### Negativas / Trade-offs
- **Custo storage**: Supabase Pro = 8GB incluído; 20GB+ cobrado à parte (~$0.125/GB/mês)
- **Ingestion latency**: Cron diário = dados com até 24h de delay; aceitável para price history
- **CheapShark rate limit**: Fetch 5k jogos × 11 lojas = 55k requests/dia; respeitar `Retry-After`
- **Keyshops simulados**: Precisa flag `is_keyshop` para separar no gráfico (visual distinto)

### Plano de Evolução
- **Phase 1**: Ingest diário + continuous aggregate daily + gráfico 6 meses (Recharts)
- **Phase 2**: Price drop alerts reais (baseado em `price_history` não simulado)
- **Phase 3**: Weekly/Monthly aggregates para "All time" chart (downsampling)
- **Phase 4**: ML price prediction (prophet/ARIMA) → "Wait for drop" badge

---

## Referências
- [Task.md - Price History Charts](../task.md#phase-10-monetization--conversion-engine)
- Supabase Docs: [TimescaleDB](https://supabase.com/docs/guides/database/extensions/timescaledb)
- TimescaleDB Docs: [Hypertables](https://docs.timescale.com/use-timescale/latest/hypertables/), [Continuous Aggregates](https://docs.timescale.com/use-timescale/latest/continuous-aggregates/)