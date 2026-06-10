# ADR-010: Search Architecture — Typesense Cloud (MVP) → Supabase pgvector+FTS (Scale)

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10)
**Autor**: EmiyaKiritsugu3

---

## Contexto

GameDeals precisa de busca rápida e relevante no catálogo de jogos (~50k+ titles). Requisitos:

- **Typo tolerance**: "witcher", "wicher", "the witcher" → Witcher
- **Faceted filters**: Store, price range, metacritic score, genre, platform
- **Instant search**: Resultados em <100ms enquanto usuário digita
- **Semantic search** (futuro): "jogos tipo Skyrim" → similar RPGs
- **Cobertura BR**: Nomes em português, acentos, collation pt-BR

---

## Decisão

### Fase 1 — MVP: Typesense Cloud

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
- `cron(0 4 * * *)` — Reindexar jogos novos/atualizados nas últimas 24h
- `drizzle.query.games.findMany({ where: gte(updatedAt, yesterday) })`
- → Typesense `bulkUpsert` (até 1000 doc/batch)

### Fase 2 — Scale: Supabase pgvector + Full-Text Search Híbrido

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

## Decisão Final

| Aspecto | Typesense Cloud (MVP) | Supabase pgvector+FTS (Scale) |
|---------|----------------------|-------------------------------|
| **Setup** | 30 min (create cluster + schema) | 4h (function + index + embeddings cron) |
| **Latência** | <30ms | ~20ms (same region) |
| **Custo** | Free (50M req/mês) → $30/mês | Incluso no Supabase Pro ($25/mês) |
| **Manutenção** | Zero (managed) | Funções + índices + embeddings cron |
| **Vector search** | ✅ v30.2+ nativo | ✅ pgvector nativo |
| **Typo tolerance** | ✅ Built-in | ⚠️ pg_trgm + fuzzystrmatch |
| **Faceted filters** | ✅ Nativo | ✅ SQL filters |
| **Vendor lock-in** | ⚠️ Serviço externo | ✅ PostgreSQL padrão |

**Recomendação**: Iniciar com **Typesense Cloud** (setup rápido, UX premium). Planejar migração para **Supabase pgvector+FTS** na Phase 6+ quando precisar reduzir serviços e unificar no Supabase.

---

## Consequências

### Positivas
- **MVP rápido**: Typesense Cloud em 30 minutos, search instantâneo no Navbar
- **UX premium**: Typo tolerance, faceted filters, <50ms response
- **Vector-ready**: Typesense v30.2 + pgvector — semantic search sem trocar engine
- **Migração planejada**: pgvector+FTS elimina dependência externa, tudo no Supabase

### Negativas
- **Dois serviços**: MVP depende de Typesense + Supabase (mitigado: Typesense é só search)
- **Sync delay**: Dados podem ter até 24h de delay (cron diário)
- **Embeddings**: Precisam ser gerados (All-MiniLM-L6-v2 via Edge Function) e armazenados no Supabase

---

## Referências
- [Typesense v30.2 Docs](https://typesense.org/docs/30.2/api/) — Vector search, auto-schema, federated search
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Full-Text Search](https://supabase.com/docs/guides/database/full-text-search)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Search como parte da stack full
- `src/lib/typesense.ts` — Typesense client implementation
- `src/actions/search.ts` — Server Actions wrapper for search