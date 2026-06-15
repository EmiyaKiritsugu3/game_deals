export interface CheapSharkDeal {
  gameID: string;
  title: string;
  thumb: string;
  salePrice: string;
  metacriticScore?: string;
  steamRatingPercent?: string;
}

export function mapDealsToTypesenseGames(deals: CheapSharkDeal[]) {
  return deals.map((deal) => ({
    gameID: deal.gameID,
    title: deal.title,
    thumb: deal.thumb,
    cheapest: deal.salePrice,
    metacriticScore: Number.parseInt(deal.metacriticScore || '0', 10) || 0,
    steamRating: Number.parseInt(deal.steamRatingPercent || '0', 10) || 0,
  }));
}
