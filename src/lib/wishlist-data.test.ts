import { describe, expect, it, vi } from 'vitest';
import {
  buildGameEntry,
  buildSharedGamesList,
  decodeSharedWishlistIds,
} from './wishlist-data';
import type { GameDataShape } from './wishlist-data';

vi.mock('@/utils/pricing', () => ({
  getHighResImage: vi.fn((url: string) =>
    url.includes('capsule_sm_120')
      ? url.replace('capsule_sm_120', 'header')
      : url,
  ),
}));

const mockGameData: GameDataShape = {
  info: { title: 'Test Game', thumb: 'https://example.com/capsule_sm_120_123.jpg' },
  deals: [
    { price: '19.99', retailPrice: '59.99', savings: '66.67', storeID: '1' },
    { price: '29.99', retailPrice: '59.99', savings: '50.01', storeID: '2' },
  ],
  cheapestPriceEver: { price: '9.99' },
};

const mockGameDataNoDeals: GameDataShape = {
  info: { title: 'No Deal Game', thumb: 'https://example.com/thumb.jpg' },
  deals: [],
  cheapestPriceEver: { price: '14.99' },
};

describe('decodeSharedWishlistIds', () => {
  it('returns [] for null param', () => {
    expect(decodeSharedWishlistIds(null)).toEqual([]);
  });

  it('returns [] for empty string param', () => {
    expect(decodeSharedWishlistIds('')).toEqual([]);
  });

  it('catches invalid base64 and returns [] with console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = decodeSharedWishlistIds('not-valid-base64!!!');
    expect(result).toEqual([]);
    expect(spy).toHaveBeenCalledWith('Invalid wishlist data');
    spy.mockRestore();
  });

  it('decodes valid base64 into array of IDs', () => {
    const ids = ['abc123', 'def456', 'ghi789'];
    const encoded = btoa(ids.join(','));
    const result = decodeSharedWishlistIds(encoded);
    expect(result).toEqual(ids);
  });

  it('filters out empty strings from decoded content', () => {
    const encoded = btoa('abc123,,def456,');
    const result = decodeSharedWishlistIds(encoded);
    expect(result).toEqual(['abc123', 'def456']);
  });

  it('filters IDs that do not match alphanumeric pattern', () => {
    const encoded = btoa('abc123,def!@#,ghi789');
    const result = decodeSharedWishlistIds(encoded);
    expect(result).toEqual(['abc123', 'ghi789']);
  });

  it('returns [] when only invalid IDs are present', () => {
    const encoded = btoa('!!!,@@@,###');
    const result = decodeSharedWishlistIds(encoded);
    expect(result).toEqual([]);
  });
});

describe('buildGameEntry', () => {
  it('returns null for null gameData', () => {
    expect(buildGameEntry(null, 'game-1')).toBeNull();
  });

  it('returns null for undefined gameData.info', () => {
    const data = { info: undefined, deals: [], cheapestPriceEver: { price: '10' } } as unknown as GameDataShape;
    expect(buildGameEntry(data, 'game-1')).toBeNull();
  });

  it('returns entry with best deal when gameData has deals', () => {
    const entry = buildGameEntry(mockGameData, 'game-1');
    expect(entry).not.toBeNull();
    expect(entry!.gameID).toBe('game-1');
    expect(entry!.title).toBe('Test Game');
    expect(entry!.thumb).toBe('https://example.com/header_123.jpg');
    expect(entry!.salePrice).toBe('19.99');
    expect(entry!.normalPrice).toBe('59.99');
    expect(entry!.savings).toBe(67);
    expect(entry!.storeID).toBe('1');
  });

  it('sorts deals and picks the cheapest price', () => {
    const data: GameDataShape = {
      info: { title: 'Sorted Game', thumb: 'https://example.com/thumb.jpg' },
      deals: [
        { price: '49.99', retailPrice: '59.99', savings: '16.67', storeID: '2' },
        { price: '9.99', retailPrice: '59.99', savings: '83.34', storeID: '1' },
        { price: '29.99', retailPrice: '59.99', savings: '50.01', storeID: '3' },
      ],
      cheapestPriceEver: { price: '5.99' },
    };
    const entry = buildGameEntry(data, 'sorted-1');
    expect(entry!.salePrice).toBe('9.99');
    expect(entry!.storeID).toBe('1');
  });

  it('uses cheapestPriceEver when no currentBest (deals empty)', () => {
    const entry = buildGameEntry(mockGameDataNoDeals, 'no-deals-1');
    expect(entry).not.toBeNull();
    expect(entry!.gameID).toBe('no-deals-1');
    expect(entry!.title).toBe('No Deal Game');
    expect(entry!.salePrice).toBe('14.99');
    expect(entry!.normalPrice).toBe('14.99');
    expect(entry!.savings).toBe(0);
    expect(entry!.storeID).toBe('1');
  });

  it('uses cheapestPriceEver.price as normalPrice when currentBest.retailPrice is falsy', () => {
    const data: GameDataShape = {
      info: { title: 'No Retail', thumb: 'https://example.com/thumb.jpg' },
      deals: [{ price: '9.99', retailPrice: '', savings: '0', storeID: '1' }],
      cheapestPriceEver: { price: '7.99' },
    };
    const entry = buildGameEntry(data, 'no-retail-1');
    expect(entry!.normalPrice).toBe('7.99');
  });

  it('defaults storeID to "1" when currentBest.storeID is falsy', () => {
    const data: GameDataShape = {
      info: { title: 'No Store', thumb: 'https://example.com/thumb.jpg' },
      deals: [{ price: '9.99', retailPrice: '19.99', savings: '50.01', storeID: '' }],
      cheapestPriceEver: { price: '5.99' },
    };
    const entry = buildGameEntry(data, 'no-store-1');
    expect(entry!.storeID).toBe('1');
  });

  it('rounds savings to nearest integer', () => {
    const data: GameDataShape = {
      info: { title: 'Savings Game', thumb: 'https://example.com/thumb.jpg' },
      deals: [{ price: '14.99', retailPrice: '29.99', savings: '50.01667', storeID: '5' }],
      cheapestPriceEver: { price: '9.99' },
    };
    const entry = buildGameEntry(data, 'savings-1');
    expect(entry!.savings).toBe(50);
  });
});

describe('buildSharedGamesList', () => {
  it('returns [] when data is undefined', () => {
    expect(buildSharedGamesList(undefined, ['a', 'b'])).toEqual([]);
  });

  it('returns [] when data.games is undefined', () => {
    expect(buildSharedGamesList({ games: undefined as unknown as (GameDataShape | null)[], stores: {} }, ['a'])).toEqual([]);
  });

  it('returns [] when data.games is null', () => {
    expect(buildSharedGamesList({ games: null as unknown as (GameDataShape | null)[], stores: {} }, ['a'])).toEqual([]);
  });

  it('returns [] when gameIds is empty', () => {
    expect(buildSharedGamesList({ games: [mockGameData], stores: {} }, [])).toEqual([]);
  });

  it('builds entries for valid game data', () => {
    const data = {
      games: [mockGameData, mockGameDataNoDeals],
      stores: { '1': 'Steam' },
    };
    const gameIds = ['game-1', 'game-2'];
    const result = buildSharedGamesList(data, gameIds);
    expect(result).toHaveLength(2);
    expect(result[0].gameID).toBe('game-1');
    expect(result[0].title).toBe('Test Game');
    expect(result[0].salePrice).toBe('19.99');
    expect(result[1].gameID).toBe('game-2');
    expect(result[1].title).toBe('No Deal Game');
    expect(result[1].salePrice).toBe('14.99');
  });

  it('skips null gameData entries', () => {
    const data = {
      games: [null, mockGameData],
      stores: {},
    };
    const result = buildSharedGamesList(data, ['game-1', 'game-2']);
    expect(result).toHaveLength(1);
    expect(result[0].gameID).toBe('game-2');
  });

  it('skips entries where buildGameEntry returns null (no info)', () => {
    const noInfoData = {
      info: undefined,
      deals: [],
      cheapestPriceEver: { price: '10' },
    } as unknown as GameDataShape;
    const data = {
      games: [noInfoData, mockGameData],
      stores: {},
    };
    const result = buildSharedGamesList(data, ['game-1', 'game-2']);
    expect(result).toHaveLength(1);
    expect(result[0].gameID).toBe('game-2');
  });

  it('returns [] when all entries are null/empty', () => {
    const data = {
      games: [null, null],
      stores: {},
    };
    const result = buildSharedGamesList(data, ['a', 'b']);
    expect(result).toEqual([]);
  });
});
