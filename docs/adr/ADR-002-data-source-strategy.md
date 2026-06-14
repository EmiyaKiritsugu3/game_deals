# ADR-002: Data Source Strategy — CheapShark API + Simulated Keyshops

**Status**: Accepted
**Date**: 2026-06-09 (Updated 2026-06-10)
**Author**: EmiyaKiritsugu3

---

## Context

Aggregate game prices from multiple sources to:
- Compare Official Stores vs Keyshops
- Verified Historical Lows
- Affiliate links
- Brazilian market (BR region priority)

---

## Decision

### Hybrid Strategy

1. **Primary Source (Real-time)**: **CheapShark API** for official stores (Steam, Epic, GOG, Humble, Fanatical, GreenManGaming)
   - Endpoint: `https://www.cheapshark.com/api/1.0/deals`
   - Cache: `revalidate: 300` (5 min) via Next.js `use cache`
   - Fallback: `fallbackDeals.ts` at build time (compile-time data)

2. **Simulated Keyshops**: Synthetic deals for CDKeys, Kinguin, Eneba, G2A, Instant Gaming
   - Logic in `api.ts`: lowest official price → random 15-35% discount
   - Visual "Keyshop" badge + risk disclaimer

3. **Metadata**: **Steam Web API** + **IGDB** (via Twitch OAuth) for:
   - Cover art, screenshots, genres, platforms
   - HLTB (HowLongToBeat) → cost-per-hour metric
   - DRM detection (Steam/Epic/GOG)

4. **Affiliate Mapping**: Table in Supabase (Drizzle ORM) — `storeID` → `affiliate_network` + `tracking_template`

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

### Evolution Plan

- **Short term**: Primary CheapShark + simulated keyshops
- **Medium term**: ITAD when approved → replaces simulated keyshops
- **Long term**: Own scraper with Camofox for Nuuvem + additional BR stores

---

## References
- [ADR-006: Affiliate Monetization](ADR-006-affiliate-monetization.md) — Cloaking `/out` route
- [ADR-003: State Management](ADR-003-state-management.md) — TanStack Query + Server Actions pattern
- `src/services/api.ts` — Hybrid CheapShark + keyshops logic
- `src/data/fallbackDeals.ts` — Fallback compile-time data