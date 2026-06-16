export interface PriceAlert {
  gameID: string;
  gameTitle: string;
  targetPrice: number;
  currentPrice: number;
  isKeyshopAllowed: boolean;
  createdAt: number;
}

export interface PriceAlertWithGame {
  id: string;
  userId: string;
  gameId: string;
  targetPrice: number;
  storeId: string | null;
  isActive: number;
  currentPrice: number | null;
  lastCheckedAt: Date | null;
  createdAt: Date;
  title: string;
  thumbUrl: string | null;
  cheapshark_id: string;
}
