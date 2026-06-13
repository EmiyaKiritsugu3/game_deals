import { describe, expect, it } from 'vitest';

interface CheapSharkDeal {
  gameID: string;
  title: string;
  thumb: string;
  storeID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  dealRating: string;
  dealID: string;
}

function isCheapSharkDeal(value: unknown): value is CheapSharkDeal {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.gameID === 'string' &&
    typeof v.title === 'string' &&
    typeof v.salePrice === 'string' &&
    typeof v.normalPrice === 'string' &&
    typeof v.thumb === 'string' &&
    typeof v.storeID === 'string' &&
    typeof v.savings === 'string' &&
    typeof v.dealRating === 'string' &&
    typeof v.dealID === 'string'
  );
}

function isCheapSharkDealArray(value: unknown): value is CheapSharkDeal[] {
  return Array.isArray(value) && value.length > 0 && value.every(isCheapSharkDeal);
}

describe('CheapShark API type narrowing', () => {
  it('should narrow unknown to CheapSharkDeal when shape matches', () => {
    const raw: unknown = {
      gameID: '612',
      title: 'Portal 2',
      thumb: 'https://example.com/thumb.jpg',
      storeID: '1',
      salePrice: '4.99',
      normalPrice: '19.99',
      savings: '0.750100',
      dealRating: '9.8',
      dealID: 'abc123',
    };

    expect(isCheapSharkDeal(raw)).toBe(true);
    if (isCheapSharkDeal(raw)) {
      expect(typeof raw.gameID).toBe('string');
      expect(typeof raw.salePrice).toBe('string');
      expect(typeof raw.title).toBe('string');
      expect(Number.parseFloat(raw.salePrice)).toBeCloseTo(4.99);
    }
  });

  it('should reject null', () => {
    expect(isCheapSharkDeal(null)).toBe(false);
  });

  it('should reject undefined', () => {
    expect(isCheapSharkDeal(undefined)).toBe(false);
  });

  it('should reject primitive values', () => {
    expect(isCheapSharkDeal('string')).toBe(false);
    expect(isCheapSharkDeal(42)).toBe(false);
    expect(isCheapSharkDeal(true)).toBe(false);
  });

  it('should reject array', () => {
    expect(isCheapSharkDeal([])).toBe(false);
  });

  it('should reject partial object with missing fields', () => {
    const partial: unknown = { title: 'Portal 2', salePrice: '4.99' };
    expect(isCheapSharkDeal(partial)).toBe(false);
  });

  it('should reject object with wrong field types', () => {
    const wrongTypes: unknown = {
      gameID: 612,
      title: 'Portal 2',
      thumb: 'https://example.com/thumb.jpg',
      storeID: '1',
      salePrice: '4.99',
      normalPrice: '19.99',
      savings: '0.750100',
      dealRating: '9.8',
      dealID: 'abc123',
    };
    expect(isCheapSharkDeal(wrongTypes)).toBe(false);
  });

  it('should reject empty object', () => {
    expect(isCheapSharkDeal({})).toBe(false);
  });

  it('should validate non-empty CheapSharkDeal array', () => {
    const raw: unknown = [
      {
        gameID: '612',
        title: 'Portal 2',
        thumb: 'https://example.com/thumb.jpg',
        storeID: '1',
        salePrice: '4.99',
        normalPrice: '19.99',
        savings: '0.750100',
        dealRating: '9.8',
        dealID: 'abc123',
      },
    ];

    expect(isCheapSharkDealArray(raw)).toBe(true);
    if (isCheapSharkDealArray(raw)) {
      expect(raw).toHaveLength(1);
      expect(raw[0].title).toBe('Portal 2');
    }
  });

  it('should reject empty array', () => {
    expect(isCheapSharkDealArray([])).toBe(false);
  });

  it('should reject array with invalid items', () => {
    const mixed: unknown = [{ title: 'Incomplete' }];
    expect(isCheapSharkDealArray(mixed)).toBe(false);
  });

  it('should handle deal array with as-cast pattern (simulating api response)', () => {
    const raw = [
      {
        gameID: '123',
        title: 'Game X',
        thumb: '',
        storeID: '1',
        salePrice: '9.99',
        normalPrice: '19.99',
        savings: '0.5',
        dealRating: '9.5',
        dealID: 'abc',
      },
    ] as CheapSharkDeal[];

    expect(raw).toHaveLength(1);
    expect(raw[0].title).toBe('Game X');
  });

  it('should verify numeric parsing of string price fields', () => {
    const deal: CheapSharkDeal = {
      gameID: '456',
      title: 'Game Y',
      thumb: '',
      storeID: '2',
      salePrice: '0.00',
      normalPrice: '59.99',
      savings: '1.0',
      dealRating: '10.0',
      dealID: 'def',
    };

    const price = Number.parseFloat(deal.salePrice);
    const retail = Number.parseFloat(deal.normalPrice);
    const saving = Number.parseFloat(deal.savings);

    expect(price).toBe(0);
    expect(retail).toBeCloseTo(59.99);
    expect(saving).toBe(1.0);
  });
});
