import type { DealWithStore } from '@/lib/deal-utils';

const EDITION_KEYWORDS =
  "deluxe|digital deluxe|game of the year|goty|complete|premium|ultimate|collector's|standard|base|expansion|bundle|edition|pack";
const TRAILING_EDITION_RE = new RegExp(
  `\\s*[-:,]?\\s*(${EDITION_KEYWORDS})(\\s+edition)?\\s*$`,
  'i'
);

export function normalizeTitle(title: string): string {
  let s = title.toLowerCase().replace(/[™®©]/g, '');
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
  best: DealWithStore;
  variants: DealWithStore[];
  storeCount: number;
}

export function dedupeDeals(
  deals: DealWithStore[],
  maxGroups = 60
): {
  groups: DedupGroup[];
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
      if (deal.salePriceNum < existing.best.salePriceNum) {
        existing.best = deal;
      }
      const storeIds = new Set(
        existing.variants.filter((v) => v.store).map((v) => v.store?.storeID)
      );
      existing.storeCount = storeIds.size;
    }
  }

  for (const g of map.values()) {
    g.variants.sort((a, b) => a.salePriceNum - b.salePriceNum);
  }

  const groups = Array.from(map.values()).slice(0, maxGroups);

  const index = new Map<string, DedupGroup>();
  for (const g of groups) {
    for (const v of g.variants) index.set(v.dealID, g);
  }

  return { groups, index };
}

export function dedupeToList(deals: DealWithStore[], max = 20): DealWithStore[] {
  const { groups } = dedupeDeals(deals, max);
  return groups.map((g) => g.best);
}

export function findVariants(deal: DealWithStore, all: DealWithStore[]): DealWithStore[] {
  const key = dedupKey(deal);
  return all.filter((d) => dedupKey(d) === key).sort((a, b) => a.salePriceNum - b.salePriceNum);
}
