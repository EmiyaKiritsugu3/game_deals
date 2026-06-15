import { getHighResImage } from '@/services/api';

export type GameEntry = {
  gameID: string;
  title: string;
  thumb: string;
  salePrice: string;
  normalPrice: string;
  savings: number;
  storeID: string;
};

export interface GameDataInfo {
  title: string;
  thumb: string;
}

export interface GameDataDeal {
  price: string;
  retailPrice: string;
  savings: string;
  storeID: string;
}

export interface GameDataCheapest {
  price: string;
}

export interface GameDataShape {
  info?: GameDataInfo;
  deals: GameDataDeal[];
  cheapestPriceEver: GameDataCheapest;
}

export function processGameResult(
  acc: GameEntry[],
  gameData: GameDataShape | null,
  idx: number,
  gameIDs: string[]
): GameEntry[] {
  if (!gameData?.info) return acc;
  const currentBest = [...gameData.deals].sort(
    (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)
  )[0];
  acc.push({
    gameID: gameIDs[idx],
    title: gameData.info.title,
    thumb: getHighResImage(gameData.info.thumb),
    salePrice: currentBest?.price || gameData.cheapestPriceEver.price,
    normalPrice: currentBest?.retailPrice || gameData.cheapestPriceEver.price,
    savings: currentBest ? Math.round(Number.parseFloat(currentBest.savings)) : 0,
    storeID: currentBest?.storeID || '1',
  });
  return acc;
}

export function decodeSharedWishlistIds(idsParam: string | null): string[] {
  if (!idsParam) return [];
  try {
    const decoded = atob(idsParam);
    return decoded
      .split(',')
      .filter(Boolean)
      .filter((id) => /^[a-zA-Z0-9]+$/.test(id));
  } catch {
    console.error('Invalid wishlist data');
    return [];
  }
}

export function buildSharedGamesList(
  data: { games: (GameDataShape | null)[]; stores: Record<string, string> } | undefined,
  gameIds: string[]
): GameEntry[] {
  if (!data?.games || !gameIds.length) return [];
  return data.games.reduce(
    (acc, gameData, idx) => processGameResult(acc, gameData, idx, gameIds),
    [] as GameEntry[]
  );
}
