import type { PriceAlert } from '@/types/price-alert';

export function createMockAlert(overrides: Partial<PriceAlert> = {}): PriceAlert {
  return {
    gameID: 'test-game-1',
    gameTitle: 'Dead Cells',
    targetPrice: 9.99,
    currentPrice: 24.99,
    isKeyshopAllowed: false,
    createdAt: Date.now(),
    ...overrides,
  };
}
