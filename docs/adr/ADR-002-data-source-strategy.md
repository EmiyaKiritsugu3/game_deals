# ADR-002: Data Source Strategy — CheapShark API + Keyshops Simulados

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10)
**Autor**: EmiyaKiritsugu3

---

## Contexto

Agregar preços de jogos de múltiplas fontes para:
- Comparar Official Stores vs Keyshops
- Historical Lows verificados
- Affiliate links
- Mercado brasileiro (região BR prioritária)

---

## Decisão

### Estratégia Híbrida

1. **Fonte Primária (Real-time)**: **CheapShark API** para lojas oficiais (Steam, Epic, GOG, Humble, Fanatical, GreenManGaming)
   - Endpoint: `https://www.cheapshark.com/api/1.0/deals`
   - Cache: `revalidate: 300` (5 min) via Next.js `use cache`
   - Fallback: `fallbackDeals.ts` em build time (compile-time data)

2. **Keyshops (Simulados)**: Deals sintéticos para CDKeys, Kinguin, Eneba, G2A, Instant Gaming
   - Lógica em `api.ts`: preço oficial mais baixo → desconto aleatório 15-35%
   - Badge visual "Keyshop" + disclaimer de risco

3. **Metadados**: **Steam Web API** + **IGDB** (via Twitch OAuth) para:
   - Cover art, screenshots, genres, platforms
   - HLTB (HowLongToBeat) → cost-per-hour metric
   - DRM detection (Steam/Epic/GOG)

4. **Affiliate Mapping**: Tabela no Supabase (Drizzle ORM) — `storeID` → `affiliate_network` + `tracking_template`

5. **Data Fetching Pattern (2026)**:
   ```typescript
   // src/actions/deals.ts — Server Actions
   'use server';
   import { unstable_cache } from 'next/cache';

   export const getDeals = unstable_cache(
     async (params: DealParams) => {
       const res = await fetch('https://www.cheapshark.com/api/1.0/deals?' + qs(params));
       if (!res.ok) return getFallbackDeals(); // Graceful degradation
       return res.json();
     },
     ['deals'],
     { revalidate: 300, tags: ['deals'] }
   );
   ```

---

### Plano de Evolução

- **Curto prazo**: CheapShark primário + keyshops simulados
- **Médio prazo**: ITAD quando aprovado → substitui keyshops simulados
- **Longo prazo**: Próprio scraper com Camofox para Nuuvem + lojas BR adicionais

---

## Referências
- [ADR-006: Affiliate Monetization](ADR-006-affiliate-monetization.md) — Cloaking `/out` route
- [ADR-003: State Management](ADR-003-state-management.md) — TanStack Query + Server Actions pattern
- `src/services/api.ts` — Lógica híbrida CheapShark + keyshops
- `src/data/fallbackDeals.ts` — Fallback compile-time data