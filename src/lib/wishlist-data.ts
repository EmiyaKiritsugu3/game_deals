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

interface GameDataInfo {
  title: string;
  thumb: string;
}

interface GameDataDeal {
  price: string;
  retailPrice: string;
  savings: string;
  storeID: string;
}

interface GameDataCheapest {
  price: string;
}

export interface GameDataShape {
  info?: GameDataInfo;
  deals: GameDataDeal[];
  cheapestPriceEver: GameDataCheapest;
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

export function buildGameEntry(gameData: GameDataShape | null, gameId: string): GameEntry | null {
  if (!gameData?.info) return null;
  const [currentBest] = [...gameData.deals].sort(
    (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)
  );
  if (currentBest) {
    return {
      gameID: gameId,
      title: gameData.info.title,
      thumb: getHighResImage(gameData.info.thumb),
      salePrice: currentBest.price,
      normalPrice: currentBest.retailPrice || gameData.cheapestPriceEver.price,
      savings: Math.round(Number.parseFloat(currentBest.savings)),
      storeID: currentBest.storeID || '1',
    };
  }
  return {
    gameID: gameId,
    title: gameData.info.title,
    thumb: getHighResImage(gameData.info.thumb),
    salePrice: gameData.cheapestPriceEver.price,
    normalPrice: gameData.cheapestPriceEver.price,
    savings: 0,
    storeID: '1',
  };
}

export function buildSharedGamesList(
  data: { games: (GameDataShape | null)[]; stores: Record<string, string> } | undefined,
  gameIds: string[]
): GameEntry[] {
  if (!data?.games || !gameIds.length) return [];
  return data.games.reduce((acc: GameEntry[], gameData, idx) => {
    const entry = buildGameEntry(gameData, gameIds[idx]);
    if (entry) acc.push(entry);
    return acc;
  }, []);
}
