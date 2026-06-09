# ADR-010: Search Architecture — Meilisearch para Busca Full-Text de Jogos

**Status**: Proposto
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals precisa de busca rápida e relevância alta para jogos:
- **Search bar no Navbar**: Autocomplete instantâneo (<50ms), typahead enquanto digita
- **Filtros**: Por plataforma, gênero, loja, faixa de preço, DRM
- **Typo tolerance**: "stardew valey" → "Stardew Valley"
- **Fuzzy search**: Sinônimos, abreviações ("GTA V" → "Grand Theft Auto V")
- **Ranking**: Por popularidade, deal rating, preço, relevância
- **Volume**: ~50k jogos indexados, ~100-500 queries/min em pico

Solução atual: SWR com fetch direto ao CheapShark `games?title=query`. Problemas:
- Latência 200-500ms (API externa, sem cache server-side)
- Sem typo tolerance
- Sem ranking customizado
- Sem filtros combinados (loja + gênero + preço simultâneos)
- Rate limit risk (cada keystroke = 1 request)

Opções avaliadas:
| Solução | Typo Tolerance | Latência | Filtros | Self-hosted | Custo |
|---------|---------------|----------|---------|-------------|-------|
| **Meilisearch** | ✅ Nativo (typo tolerance configurável) | <50ms | ✅ Faceted | ✅ Ou Cloud | Free (self) / $30/mês (cloud) |
| **Algolia** | ✅ Excelente | <20ms | ✅ Faceted | ❌ SaaS | $1.50/1k search units |
| **Elasticsearch/OpenSearch** | ✅ Fuzzy queries | ~100ms | ✅ Advanced | ✅ | Free (self) / AWS custo |
| **PostgreSQL FTS** | ❌ Básico (trigrams) | ~100ms | ✅ | ✅ | Free (Supabase) |
| **Typesense** | ✅ Nativo | <50ms | ✅ Faceted | ✅ | Free (self) / $25/mês (cloud) |

## Decisão

**Meilisearch (self-hosted ou Meilisearch Cloud)**

### Por que Meilisearch

| Critério | Vantagem |
|----------|----------|
| **Typo tolerance** | Nativo, configurável por campo (1-typo, 2-typos) |
| **Latência** | <50ms p99; RAM-based index |
| **Faceted search** | Filtros por plataforma, gênero, loja, DRM nativos |
| **Sorting** | Ranking rules customizáveis (relevância, preço, deal_rating, popularidade) |
| **Instant UI** | Integrado com `meilisearch-js` → React component `<InstantSearch>` |
| **Indexação** | API REST simples; upsert por `game_id`; delta updates via cron |
| **Open source** | Self-hosted gratuito; MIT license |
| **Português** | Tokenizer suporta PT-BR; stop words nativas |

### Schema do Índice (`games`)

```json
{
  "id": "cheapshark_12345",
  "title": "Stardew Valley",
  "slug": "stardew-valley",
  "cover_url": "https://...",
  "cheapest_price_brl": 24.99,
  "cheapest_store": "steam",
  "historical_low_brl": 14.99,
  "discount_pct": 50,
  "deal_rating": 9.5,
  "metacritic_score": 89,
  "steam_rating_pct": 98,
  "platforms": ["windows", "mac", "linux"],
  "genres": ["simulation", "rpg", "indie"],
  "drm": ["steam", "gog"],
  "stores": ["steam", "gog", "humble", "cdkeys"],
  "is_keyshop_available": true,
  "hltb_hours": 78,
  "release_date": "2016-02-26",
  "updated_at": "2026-06-09T03:00:00Z"
}
```

### Ranking Rules

```json
{
  "rankingRules": [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
    "deal_rating:desc",
    "discount_pct:desc"
  ],
  "searchableAttributes": [
    "title",
    "slug"
  ],
  "filterableAttributes": [
    "platforms",
    "genres",
    "drm",
    "stores",
    "cheapest_price_brl",
    "discount_pct",
    "deal_rating",
    "metacritic_score"
  ],
  "sortableAttributes": [
    "cheapest_price_brl",
    "discount_pct",
    "deal_rating",
    "metacritic_score"
  ],
  "typoTolerance": {
    "enabled": true,
    "minWordSizeForTypos": {
      "oneTypo": 4,
      "twoTypos": 8
    }
  },
  "stopWords": ["de", "da", "do", "the", "of", "and"]
}
```

### Indexação (Cron Job)

```typescript
// app/api/cron/sync-search-index/route.ts
export async function GET() {
  const meili = new MeiliSearch({ host: MEILI_URL, apiKey: MEILI_KEY });
  const index = meili.index('games');

  // 1. Fetch top 10k jogos do CheapShark (sorted by dealRating)
  const deals = await fetchCheapSharkDeals({ pageSize: 10000, sortBy: 'Deal Rating' });

  // 2. Transform para schema Meilisearch
  const docs = deals.map(transformToSearchDoc);

  // 3. Upsert em batches (1000/batch)
  for (let i = 0; i < docs.length; i += 1000) {
    await index.updateDocuments(docs.slice(i, i + 1000));
  }

  return Response.json({ indexed: docs.length });
}
```

Schedule: `0 4 * * *` (4am UTC = 1h BR, após price ingestion)

### Frontend Integration

```tsx
// components/SearchBar.tsx
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import { InstantSearch, SearchBox, Hits, RefinementList } from 'react-instantsearch';

const { searchClient } = instantMeiliSearch(MEILI_URL, MEILI_KEY);

export function SearchBar() {
  return (
    <InstantSearch indexName="games" searchClient={searchClient}>
      <SearchBox placeholder="Buscar jogos..." />
      <Hits hitComponent={GameSearchHit} />
      <RefinementList attribute="platforms" />
      <RefinementList attribute="genres" />
    </InstantSearch>
  );
}
```

### Hosting

| Opção | Custo | Latência BR | Ops |
|-------|-------|-------------|-----|
| **Self-hosted (Railway/Fly.io)** | Free tier (~$5/mês) | ~80ms | Manual |
| **Meilisearch Cloud** | $30/mês (100k searches) | ~30ms (edge) | Zero |
| **Supabase VM** | Incluído (Pro) | ~20ms (same region) | Manual setup |
| **Docker local** | Free | N/A | Dev only |

**Recomendação MVP**: Self-hosted no Railway ($5/mês) → migrar para Cloud quando tráfego justificar.

## Consequências

### Positivas
- **UX instantânea**: Search results <50ms; typo tolerance reduz frustração
- **Filtros combinados**: Plataforma + gênero + faixa de preço + loja simultâneos
- **SEO**: Search results page indexável (`/search?q=stardew&platform=windows`)
- **Independência**: Index próprio; não depende de CheapShark para search
- **Ranking customizado**: Deals melhores aparecem primeiro (deal_rating, discount)

### Negativas / Trade-offs
- **Sync overhead**: Cron diário; dados com até 24h de delay no índice
- **Custo extra**: ~$5-30/mês dependendo do hosting
- **Índice tamanho**: 50k jogos × ~1KB/doc ≈ 50MB index; 200MB RAM; trivial
- **Mais um serviço**: Monitoring, backups, updates; mitigado: managed cloud

### Plano de Evolução
- **Phase 1**: Índice de jogos (título, preço, filtros básicos)
- **Phase 2**: Índice de playlists, collections, reviews (cross-entity search)
- **Phase 3**: Personalização (baseado em wishlist/history → boost relevant games)
- **Phase 4**: AI-powered search (embeddings para semantic search via `meilisearch-vector`)

---

## Referências
- [Tech Stack Dictionary](../tech_stack_dictionary.md)
- Meilisearch Docs: [Getting Started](https://www.meilisearch.com/docs/learn/getting_started), [Typo Tolerance](https://www.meilisearch.com/docs/learn/relevancy/typo_tolerance), [Faceted Search](https://www.meilisearch.com/docs/learn/filtering_and_sorting/faceted_search)