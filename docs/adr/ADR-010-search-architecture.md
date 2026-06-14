# ADR-010: Search Architecture — Typesense Cloud (MVP) → Supabase pgvector+FTS (Scale)

**Status**: Accepted
**Date**: 2026-06-09 (Updated 2026-06-10)
**Author**: EmiyaKiritsugu3

---

## Context

GameDeals needs fast and relevant search in the game catalog (~50k+ titles). Requirements:

- **Typo tolerance**: "witcher", "wicher", "the witcher" → Witcher
- **Faceted filters**: Store, price range, metacritic score, genre, platform
- **Instant search**: Results in <100ms while user types
- **Semantic search** (future): "games like Skyrim" → similar RPGs
- **BR coverage**: Names in Portuguese, accents, pt-BR collation

---

## Decision

### Phase 1 — MVP: Typesense Cloud

```typescript
// src/lib/typesense.ts
import Typesense from 'typesense';

export const typesense = new Typesense.Client({
  nodes: [{ host: process.env.TYPESENSE_HOST!, port: 443, protocol: 'https' }],
  apiKey: process.env.TYPESENSE_API_KEY!,
  connectionTimeoutSeconds: 2,
});

export const GAMES_COLLECTION = 'games';

export async function searchGames(query: string, filters?: SearchFilters) {
  return typesense.collections(GAMES_COLLECTION).documents().search({
    q: query,
    query_by: 'title,alternativeTitles,developer,publisher',
    sort_by: '_text_match:desc,dealCount:desc',
    facet_by: 'platform,genre,store,priceRange',
    filter_by: filters?.toString(),
    per_page: 20,
  });
}
```

**Schema Typesense**:
```json
{
  "name": "games",
  "fields": [
    {"name": "title", "type": "string", "locale": "pt-BR"},
    {"name": "alternativeTitles", "type": "string[]", "optional": true},
    {"name": "developer", "type": "string", "facet": true},
    {"name": "publisher", "type": "string", "facet": true},
    {"name": "platform", "type": "string[]", "facet": true},
    {"name": "genre", "type": "string[]", "facet": true},
    {"name": "dealCount", "type": "int32"},
    {"name": "cheapestPrice", "type": "float"},
    {"name": "metacriticScore", "type": "int32"},
    {"name": "steamRating", "type": "float"},
    {"name": "embeddings", "type": "float[]", "num_dim": 384, "optional": true}
  ],
  "default_sorting_field": "dealCount"
}
```

**Sync Cron**:
- `cron(0 4 * * *)` — Reindex new/updated games in the last 24h
- `drizzle.query.games.findMany({ where: gte(updatedAt, yesterday) })`
- → Typesense `bulkUpsert` (up to 1000 doc/batch)

### Phase 2 — Scale: Supabase pgvector + Hybrid Full-Text Search

```
┌──────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                         │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌──────────────────────────────────┐│
│  │  Full-Text Search   │  │  pgvector (Embeddings)           ││
│  │  tsvector index    │  │  ivfflat index (384d)            ││
│  │  GIN index         │  │  cosine distance                 ││
│  │  pt-BR config      │  │  MiniLM-L6-v2 embeddings         ││
│  └────────────────────┘  └──────────────────────────────────┘│
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Hybrid Search Function                                   ││
│  │  SELECT title, price FROM search_games('witcher',         ││
│  │    where: 'platform=Steam', limit: 20)                     ││
│  └───────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

```sql
-- Hybrid search function
create function search_games(
  query_text text,
  where_clause text default '',
  limit int default 20
) returns table (
  title text,
  developer text,
  cheapest_price float,
  relevance float
) language plpgsql stable as $$
begin
  return query
  with fts as (
    select id, ts_rank(to_tsvector('portuguese', title), plainto_tsquery('portuguese', query_text)) * 0.7 as score
    from games
    where to_tsvector('portuguese', title) @@ plainto_tsquery('portuguese', query_text)
  ),
  semantic as (
    select id, 1 - (embedding <=> llm_embedding(query_text)) * 0.3 as score
    from games
    order by embedding <=> llm_embedding(query_text)
    limit 100
  )
  select g.title, g.developer, g.cheapest_price,
         coalesce(fts.score, 0) + coalesce(semantic.score, 0) as relevance
  from games g
  left join fts on g.id = fts.id
  left join semantic on g.id = semantic.id
  where fts.id is not null or semantic.id is not null
  order by relevance desc
  limit limit;
end;
$$;
```

---

## Final Decision

| Aspect | Typesense Cloud (MVP) | Supabase pgvector+FTS (Scale) |
|---------|----------------------|-------------------------------|
| **Setup** | 30 min (create cluster + schema) | 4h (function + index + embeddings cron) |
| **Latency** | <30ms | ~20ms (same region) |
| **Cost** | Free (50M req/month) → $30/month | Included in Supabase Pro ($25/month) |
| **Maintenance** | Zero (managed) | Functions + indexes + embeddings cron |
| **Vector search** | ✅ Native v30.2+ | ✅ Native pgvector |
| **Typo tolerance** | ✅ Built-in | ⚠️ pg_trgm + fuzzystrmatch |
| **Faceted filters** | ✅ Native | ✅ SQL filters |
| **Vendor lock-in** | ⚠️ External service | ✅ Standard PostgreSQL |

**Recommendation**: Start with **Typesense Cloud** (quick setup, premium UX). Plan migration to **Supabase pgvector+FTS** in Phase 6+ when needing to reduce services and unify on Supabase.

---

## Consequences

### Positive
- **Fast MVP**: Typesense Cloud in 30 minutes, instant search in Navbar
- **Premium UX**: Typo tolerance, faceted filters, <50ms response
- **Vector-ready**: Typesense v30.2 + pgvector — semantic search without changing engine
- **Planned migration**: pgvector+FTS eliminates external dependency, everything in Supabase

### Negative
- **Two services**: MVP depends on Typesense + Supabase (mitigated: Typesense is just search)
- **Sync delay**: Data can have up to 24h delay (daily cron)
- **Embeddings**: Need to be generated (All-MiniLM-L6-v2 via Edge Function) and stored in Supabase

---

## References
- [Typesense v30.2 Docs](https://typesense.org/docs/30.2/api/) — Vector search, auto-schema, federated search
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Full-Text Search](https://supabase.com/docs/guides/database/full-text-search)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Search as part of the full stack
- `src/lib/typesense.ts` — Typesense client implementation
- `src/actions/search.ts` — Server Actions wrapper for search