export interface PriceAlert {
  gameID: string;
  gameTitle: string;
  targetPrice: number;
  currentPrice: number;
  isKeyshopAllowed: boolean;
  createdAt: number;
}
