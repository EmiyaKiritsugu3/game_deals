/**
 * @vitest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type SavedGame, useSortedGames } from './useSortedGames';

describe('useSortedGames', () => {
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

  it('sorts by discount descending', () => {
    const games = [
      createGame({ gameID: '1', savings: 30, title: 'Game B' }),
      createGame({ gameID: '2', savings: 50, title: 'Game A' }),
      createGame({ gameID: '3', savings: 10, title: 'Game C' }),
    ];

    const { result } = renderHook(() => useSortedGames(games, 'discount'));

    expect(result.current[0].savings).toBe(50);
    expect(result.current[1].savings).toBe(30);
    expect(result.current[2].savings).toBe(10);
  });

  it('sorts by price ascending', () => {
    const games = [
      createGame({ gameID: '1', salePrice: '29.99', title: 'Game C' }),
      createGame({ gameID: '2', salePrice: '9.99', title: 'Game A' }),
      createGame({ gameID: '3', salePrice: '19.99', title: 'Game B' }),
    ];

    const { result } = renderHook(() => useSortedGames(games, 'price'));

    expect(result.current[0].salePrice).toBe('9.99');
    expect(result.current[1].salePrice).toBe('19.99');
    expect(result.current[2].salePrice).toBe('29.99');
  });

  it('sorts by name alphabetically', () => {
    const games = [
      createGame({ gameID: '1', title: 'Zelda' }),
      createGame({ gameID: '2', title: 'Animal Crossing' }),
      createGame({ gameID: '3', title: 'Mario' }),
    ];

    const { result } = renderHook(() => useSortedGames(games, 'name'));

    expect(result.current[0].title).toBe('Animal Crossing');
    expect(result.current[1].title).toBe('Mario');
    expect(result.current[2].title).toBe('Zelda');
  });

  it('returns empty array for empty input', () => {
    const { result } = renderHook(() => useSortedGames([], 'discount'));

    expect(result.current).toEqual([]);
  });

  it('does not mutate original array', () => {
    const games = [
      createGame({ gameID: '1', savings: 30 }),
      createGame({ gameID: '2', savings: 50 }),
      createGame({ gameID: '3', savings: 10 }),
    ];
    const originalOrder = [games[0], games[1], games[2]];

    renderHook(() => useSortedGames(games, 'discount'));

    expect(games[0]).toBe(originalOrder[0]);
    expect(games[1]).toBe(originalOrder[1]);
    expect(games[2]).toBe(originalOrder[2]);
  });

  it('updates when savedGames reference changes', () => {
    const gamesA = [
      createGame({ gameID: '1', title: 'Zelda' }),
      createGame({ gameID: '2', title: 'Animal Crossing' }),
    ];
    const gamesB = [
      createGame({ gameID: '1', title: 'Zelda' }),
      createGame({ gameID: '2', title: 'Animal Crossing' }),
    ];

    const { result, rerender } = renderHook(
      ({
        savedGames,
        sortMode,
      }: {
        savedGames: SavedGame[];
        sortMode: 'discount' | 'price' | 'name';
      }) => useSortedGames(savedGames, sortMode),
      { initialProps: { savedGames: gamesA, sortMode: 'name' as const } }
    );

    const initialSorted = result.current;

    rerender({ savedGames: gamesB, sortMode: 'name' });

    // Different reference → useMemo recomputes → different array
    expect(result.current).not.toBe(initialSorted);
    // But same data → identical order
    expect(result.current).toEqual(initialSorted);
  });
});
