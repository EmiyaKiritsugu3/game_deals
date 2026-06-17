/**
 * @vitest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SavedGame } from './useSortedGames';
import { useWishlistStats } from './useWishlistStats';

describe('useWishlistStats', () => {
  const createGame = (overrides: Partial<SavedGame> = {}): SavedGame => ({
    gameID: '1',
    title: 'Test Game',
    thumb: 'https://example.com/thumb.jpg',
    salePrice: '19.99',
    normalPrice: '49.99',
    savings: 30,
    storeID: '1',
    ...overrides,
  });

  it('returns null bestDiscountGame and 0.00 totalValue for empty array', () => {
    const { result } = renderHook(() => useWishlistStats([]));

    expect(result.current.bestDiscountGame).toBeNull();
    expect(result.current.totalValue).toBe('0.00');
  });

  it('returns game with highest savings as bestDiscountGame', () => {
    const games = [
      createGame({ gameID: '1', savings: 10, title: 'Low' }),
      createGame({ gameID: '2', savings: 50, title: 'High' }),
      createGame({ gameID: '3', savings: 20, title: 'Mid' }),
    ];

    const { result } = renderHook(() => useWishlistStats(games));

    expect(result.current.bestDiscountGame).not.toBeNull();
    expect(result.current.bestDiscountGame?.savings).toBe(50);
    expect(result.current.bestDiscountGame?.title).toBe('High');
  });

  it('returns bestDiscountGame correctly when there is a tie', () => {
    const games = [
      createGame({ gameID: '1', savings: 50, title: 'First' }),
      createGame({ gameID: '2', savings: 50, title: 'Second' }),
    ];

    const { result } = renderHook(() => useWishlistStats(games));

    // reduce picks the later element when savings are equal (prev > current is false)
    expect(result.current.bestDiscountGame).not.toBeNull();
    expect(result.current.bestDiscountGame?.savings).toBe(50);
    expect(result.current.bestDiscountGame?.title).toBe('Second');
  });

  it('calculates total value correctly', () => {
    const games = [
      createGame({ gameID: '1', salePrice: '9.99' }),
      createGame({ gameID: '2', salePrice: '19.99' }),
      createGame({ gameID: '3', salePrice: '5.00' }),
    ];

    const { result } = renderHook(() => useWishlistStats(games));

    expect(result.current.totalValue).toBe('34.98');
  });

  it('totalValue handles single game', () => {
    const games = [createGame({ gameID: '1', salePrice: '14.99' })];

    const { result } = renderHook(() => useWishlistStats(games));

    expect(result.current.totalValue).toBe('14.99');
  });

  it('totalValue is a string with two decimal places', () => {
    const games = [createGame({ gameID: '1', salePrice: '10' })];

    const { result } = renderHook(() => useWishlistStats(games));

    expect(result.current.totalValue).toBe('10.00');
    expect(typeof result.current.totalValue).toBe('string');
  });
});
