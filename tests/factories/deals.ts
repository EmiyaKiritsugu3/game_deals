import type { Deal } from '@/types/game';

export function createMockDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    internalName: 'DEAD_CELLS',
    title: 'Dead Cells',
    metacriticLink: '/game/pc/dead-cells',
    dealID: 'test-deal-1',
    storeID: '1',
    gameID: '123',
    salePrice: '9.99',
    normalPrice: '24.99',
    isOnSale: '1',
    savings: '60.0',
    metacriticScore: '89',
    steamRatingText: 'Overwhelmingly Positive',
    steamRatingPercent: '96',
    steamRatingCount: '124563',
    steamAppID: '588650',
    releaseDate: 1513209600,
    lastChange: 1683759600,
    dealRating: '9.5',
    thumb: 'https://example.com/thumb.jpg',
    ...overrides,
  };
}
