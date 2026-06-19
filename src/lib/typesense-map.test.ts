import { describe, expect, it } from 'vitest';
import type { CheapSharkDeal } from './typesense-map';
import { mapDealsToTypesenseGames } from './typesense-map';

const fullDeal: CheapSharkDeal = {
  gameID: '123',
  title: 'Dead Cells',
  thumb: 'https://example.com/thumb.jpg',
  salePrice: '9.99',
  metacriticScore: '85',
  steamRatingPercent: '96',
};

describe('mapDealsToTypesenseGames', () => {
  it('returns empty array for empty input', () => {
    expect(mapDealsToTypesenseGames([])).toEqual([]);
  });

  it('defaults metacriticScore to 0 when field is missing', () => {
    const { metacriticScore: _, ...deal } = fullDeal;
    const [result] = mapDealsToTypesenseGames([deal as CheapSharkDeal]);
    expect(result.metacriticScore).toBe(0);
  });

  it('defaults metacriticScore to 0 for non-numeric string', () => {
    const [result] = mapDealsToTypesenseGames([{ ...fullDeal, metacriticScore: 'abc' }]);
    expect(result.metacriticScore).toBe(0);
  });

  it('defaults steamRating to 0 when steamRatingPercent is missing', () => {
    const { steamRatingPercent: _, ...deal } = fullDeal;
    const [result] = mapDealsToTypesenseGames([deal as CheapSharkDeal]);
    expect(result.steamRating).toBe(0);
  });

  it('transforms all fields correctly when all values are present', () => {
    const [result] = mapDealsToTypesenseGames([fullDeal]);
    expect(result).toEqual({
      gameID: '123',
      title: 'Dead Cells',
      thumb: 'https://example.com/thumb.jpg',
      cheapest: '9.99',
      metacriticScore: 85,
      steamRating: 96,
    });
  });

  it('preserves order when transforming multiple deals', () => {
    const results = mapDealsToTypesenseGames([
      fullDeal,
      { ...fullDeal, gameID: '456', title: 'Hades' },
      { ...fullDeal, gameID: '789', title: 'Celeste' },
    ]);
    expect(results).toHaveLength(3);
    expect(results[0].gameID).toBe('123');
    expect(results[1].gameID).toBe('456');
    expect(results[2].gameID).toBe('789');
  });
});
