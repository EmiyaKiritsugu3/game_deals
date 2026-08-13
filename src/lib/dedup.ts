import type { DealWithStore } from './types';

/**
 * Normalise a deal title for dedup grouping.
 * Strips: ™/® symbols, edition/variant suffixes (Deluxe, Digital Deluxe, GOTY,
 * Complete, Premium, Ultimate, Collector's, Standard, Base, Expansion, Bundle,
 * Edition, Pack), punctuation, case, leading/trailing spaces.
 *
 * Iteratively strips trailing keywords so multi-word suffixes like
 * "Deluxe Edition" or "Game of the Year Edition" are fully removed.
 *
 * e.g. "Suicide Squad: Kill the Justice League - Deluxe Edition" → "suicide squad kill the justice league"
 *      "Suicide Squad: Kill the Justice League" → "suicide squad kill the justice league"
 *      "Back 4 Blood: Deluxe Edition" → "back 4 blood"
 *      "CODE VEIN Deluxe Edition" → "code vein"
 *      "Dreamlight Valley: Game of the Year Edition" → "dreamlight valley"
 * (variants of the same base game collapse to one key so they're grouped)
 */
const EDITION_KEYWORDS =
  "deluxe|digital deluxe|game of the year|goty|complete|premium|ultimate|collector's|standard|base|expansion|bundle|edition|pack";
const TRAILING_EDITION_RE = new RegExp(
  `\\s*[-:,]?\\s*(${EDITION_KEYWORDS})(\\s+edition)?\\s*$`,
  'i'
);

export function normalizeTitle(title: string): string {
  let s = title.toLowerCase().replace(/[™®©]/g, '');
  // Iteratively strip trailing edition/variant keywords (up to 5 passes).
  // Handles "Deluxe Edition", "Edition", "Deluxe", "GOTY Edition", etc.
  for (let i = 0; i < 5; i++) {
    const prev = s;
    s = s.replace(TRAILING_EDITION_RE, '');
    if (s === prev) break;
  }
  return s
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a deduplication key for a deal. Prefers the normalized title so that
 * variant editions (Deluxe, GOTY, etc. — which have different steamAppIDs)
 * collapse into a single group with the base game. Falls back to steamAppID
 * for games whose title is empty/whitespace, then to gameID.
 */
export function dedupKey(deal: {
  steamAppID?: string | null;
  title: string;
  gameID?: string;
}): string {
  const t = normalizeTitle(deal.title);
  if (t) return `title:${t}`;
  if (deal.steamAppID && deal.steamAppID !== '0') {
    return `steam:${deal.steamAppID}`;
  }
  return `game:${deal.gameID ?? deal.title}`;
}

export interface DedupGroup {
  key: string;
  /** Canonical (best/cheapest) deal — what to render in the grid. */
  best: DealWithStore;
  /** All deals (variants) that share this key, including best. Sorted cheapest-first. */
  variants: DealWithStore[];
  /** Number of distinct stores carrying this game. */
  storeCount: number;
}

/**
 * Group a list of deals by dedup key, picking the cheapest variant as the
 * canonical "best" deal. Each group also exposes all variants so the detail
 * dialog can show cross-store comparison without an extra API call.
 *
 * @param deals flat list (already filtered/sorted upstream)
 * @param maxGroups cap the result count (default 60 — keep one page)
 */
export function dedupeDeals(
  deals: DealWithStore[],
  maxGroups = 60
): {
  groups: DedupGroup[];
  /** Map of dealID → group key, so the grid can re-lookup variants when clicked. */
  index: Map<string, DedupGroup>;
} {
  const map = new Map<string, DedupGroup>();

  for (const deal of deals) {
    const key = dedupKey(deal);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        best: deal,
        variants: [deal],
        storeCount: deal.store ? 1 : 0,
      });
    } else {
      existing.variants.push(deal);
      // Re-pick cheapest as the canonical best
      if (deal.salePriceNum < existing.best.salePriceNum) {
        existing.best = deal;
      }
      // Count distinct stores
      const storeIds = new Set(
        existing.variants.filter((v) => v.store).map((v) => v.store?.storeID)
      );
      existing.storeCount = storeIds.size;
    }
  }

  // Sort variants within each group cheapest-first so the dialog is consistent
  for (const g of map.values()) {
    g.variants.sort((a, b) => a.salePriceNum - b.salePriceNum);
  }

  // Convert to array, preserving the original input order (which is the
  // upstream sort order — deal-rating, savings, etc.) by insertion order
  const groups = Array.from(map.values()).slice(0, maxGroups);

  // Build the lookup index
  const index = new Map<string, DedupGroup>();
  for (const g of groups) {
    for (const v of g.variants) index.set(v.dealID, g);
  }

  return { groups, index };
}

/**
 * Variant of dedupeDeals that returns just the canonical "best" deals (one
 * per title) — used by the live ticker and featured carousel where we want
 * a flat list without duplicates.
 */
export function dedupeToList(deals: DealWithStore[], max = 20): DealWithStore[] {
  const { groups } = dedupeDeals(deals, max);
  return groups.map((g) => g.best);
}
