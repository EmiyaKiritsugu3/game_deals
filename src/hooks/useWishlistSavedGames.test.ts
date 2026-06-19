// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  getHighResImage: vi.fn((thumb: string) => thumb.replace('/thumb/', '/capsule_616x353/')),
}));

import type { GameDetails } from '@/types/game';
import { useWishlistSavedGames } from './useWishlistSavedGames';

function makeGame(overrides?: Partial<GameDetails>): GameDetails {
  return {
    info: { title: 'Test Game', thumb: '/thumb/test.jpg', steamAppID: null },
    cheapestPriceEver: { price: '9.99', date: 1234567890 },
    deals: [
      {
        storeID: '1',
        dealID: 'deal1',
        price: '4.99',
        retailPrice: '59.99',
        savings: '91.68',
      },
      {
        storeID: '2',
        dealID: 'deal2',
        price: '5.99',
        retailPrice: '59.99',
        savings: '90.00',
      },
    ],
    ...overrides,
  } as GameDetails;
}

describe('useWishlistSavedGames', () => {
  it('returns an empty array when gameResults is empty', () => {
    const { result } = renderHook(() => useWishlistSavedGames([], []));
    expect(result.current).toEqual([]);
  });

  it('skips games with null info', () => {
    const emptyGame = { info: null } as unknown as GameDetails;
    const { result } = renderHook(() => useWishlistSavedGames([emptyGame], ['game1']));
    expect(result.current).toEqual([]);
  });

  it('uses the cheapest deal for salePrice and normalPrice', () => {
    const game = makeGame();
    const { result } = renderHook(() => useWishlistSavedGames([game], ['game1']));
    expect(result.current[0]).toMatchObject({
      gameID: 'game1',
      title: 'Test Game',
      salePrice: '4.99',
      normalPrice: '59.99',
      savings: 92,
      storeID: '1',
    });
  });

  it('falls back to cheapestPriceEver when there are no deals', () => {
    const game = makeGame({ deals: [] });
    const { result } = renderHook(() => useWishlistSavedGames([game], ['game1']));
    expect(result.current[0]).toMatchObject({
      salePrice: '9.99',
      normalPrice: '9.99',
      savings: 0,
      storeID: '1',
    });
  });

  it('returns a memoized result (stable reference for same inputs)', () => {
    const game = makeGame();
    const { result, rerender } = renderHook(() => useWishlistSavedGames([game], ['game1']));
    const first = result.current;
    rerender();
    expect(result.current).toStrictEqual(first);
  });
});
