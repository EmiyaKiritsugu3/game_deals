import { describe, expect, it } from 'vitest';
import { parseRevenuePeriod, periodDays, periodLabel, toStoreCsv } from '@/lib/admin-revenue';

describe('parseRevenuePeriod', () => {
  it.each(['7d', '30d', '90d', 'all'] as const)('accepts %s', (p) => {
    expect(parseRevenuePeriod(p)).toBe(p);
  });

  it.each([undefined, null, 7, 'bogus', ['7d'], { period: '7d' }])(
    'falls back to 30d for %s',
    (v) => {
      expect(parseRevenuePeriod(v)).toBe('30d');
    }
  );
});

describe('periodDays / periodLabel', () => {
  it('maps periods to day counts', () => {
    expect(periodDays('7d')).toBe(7);
    expect(periodDays('90d')).toBe(90);
    expect(periodDays('all')).toBeNull();
  });

  it('labels periods', () => {
    expect(periodLabel('7d')).toBe('last 7 days');
    expect(periodLabel('all')).toBe('all time');
  });
});

describe('toStoreCsv', () => {
  it('emits header + one line per store', () => {
    expect(
      toStoreCsv([
        { store_id: 'steam', clicks: 2, conversions: 1, revenue_cents: 150 },
        { store_id: 'gog', clicks: 0, conversions: 0, revenue_cents: 0 },
      ])
    ).toBe('store_id,clicks,conversions,revenue_cents\nsteam,2,1,150\ngog,0,0,0\n');
  });

  it('quotes store ids with comma/quote/newline', () => {
    expect(toStoreCsv([{ store_id: 'we,"ird', clicks: 1, conversions: 0, revenue_cents: 0 }])).toBe(
      'store_id,clicks,conversions,revenue_cents\n"we,""ird",1,0,0\n'
    );
  });

  it('empty rows produce header only', () => {
    expect(toStoreCsv([])).toBe('store_id,clicks,conversions,revenue_cents\n');
  });
});
