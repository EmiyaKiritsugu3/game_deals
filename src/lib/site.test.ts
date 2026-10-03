import { describe, expect, it } from 'vitest';
import { formatUSD, SITE_URL } from './site';

describe('site defaults', () => {
  it('defaults to the global .com domain', () => {
    expect(SITE_URL).toContain('gamedeals.com');
    expect(SITE_URL).not.toContain('.com.br');
  });

  it('formats USD with dot decimals', () => {
    expect(formatUSD(4.5)).toBe('$4.50');
    expect(formatUSD(0)).toBe('$0.00');
  });
});
