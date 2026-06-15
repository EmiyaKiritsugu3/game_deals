import { describe, expect, it, vi } from 'vitest';
import type { RealPriceDataPoint } from './chart-data';
import {
  axisProps,
  chartTooltipStyle,
  formatChartData,
  priceFormatter,
  storeFormatter,
} from './chart-data';

vi.mock('@/utils/pricing', () => ({
  generatePriceHistory: vi.fn(() => [{ name: 'Simulated', price: 25 }]),
}));

describe('formatChartData', () => {
  it('uses realData when present and >2 points', () => {
    const realData: RealPriceDataPoint[] = [
      { bucket: '2024-01-15', avg_price: 20, min_price: 15, max_price: 25 },
      { bucket: '2024-02-15', avg_price: 18, min_price: 12, max_price: 22 },
      { bucket: '2024-03-15', avg_price: 15, min_price: 10, max_price: 20 },
    ];
    const result = formatChartData(realData, '59.99', '19.99', '9.99', 'Test Game');
    expect(result).toHaveLength(3);
    expect(result[0].name).toMatch(/^Jan \d{1,2}$/);
    expect(typeof result[0].price).toBe('number');
  });

  it('falls back to simulated when realData is empty', () => {
    const result = formatChartData([], '59.99', '19.99', '9.99', 'Test Game');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Simulated');
  });

  it('falls back when realData is undefined', () => {
    const result = formatChartData(undefined, '59.99', '19.99', '9.99', 'Test Game');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Simulated');
  });

  it('falls back when realData has exactly 2 points', () => {
    const realData: RealPriceDataPoint[] = [
      { bucket: '2024-01-15', avg_price: 20, min_price: 15, max_price: 25 },
      { bucket: '2024-02-15', avg_price: 18, min_price: 12, max_price: 22 },
    ];
    const result = formatChartData(realData, '59.99', '19.99', '9.99', 'Test Game');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Simulated');
  });

  it('uses avg_price when present', () => {
    const realData: RealPriceDataPoint[] = [
      { bucket: '2024-01-15', avg_price: 10, min_price: 8, max_price: 12 },
      { bucket: '2024-02-15', avg_price: 9, min_price: 7, max_price: 11 },
      { bucket: '2024-03-15', avg_price: 8, min_price: 6, max_price: 10 },
    ];
    const result = formatChartData(realData, '59.99', '19.99', '9.99', 'Test Game');
    expect(result).toHaveLength(3);
    expect(result[0].price).toBe(10);
  });
});

describe('priceFormatter', () => {
  it('returns [formatted, Price]', () => {
    const result = priceFormatter(10);
    expect(result).toEqual(['$10.00', 'Price']);
  });

  it('handles non-finite values', () => {
    const result = priceFormatter(NaN);
    expect(result).toEqual(['$0.00', 'Price']);
  });
});

describe('storeFormatter', () => {
  it('returns [formatted, Price]', () => {
    const result = storeFormatter(15.5);
    expect(result).toEqual(['$15.50', 'Price']);
  });
});

describe('axisProps', () => {
  it('has expected shape', () => {
    expect(axisProps).toHaveProperty('stroke', 'hsl(var(--muted-foreground))');
    expect(axisProps).toHaveProperty('fontSize', 12);
    expect(axisProps).toHaveProperty('tickLine', false);
    expect(axisProps).toHaveProperty('axisLine', false);
  });
});

describe('chartTooltipStyle', () => {
  it('has expected CSS properties', () => {
    expect(chartTooltipStyle.backgroundColor).toBe('hsl(var(--card))');
    expect(chartTooltipStyle.border).toBe('1px solid hsl(var(--border))');
    expect(chartTooltipStyle.borderRadius).toBe('8px');
    expect(chartTooltipStyle.color).toBe('hsl(var(--foreground))');
  });
});
