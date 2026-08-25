import { describe, expect, it } from 'vitest';
import {
  ALLOWED_DOMAINS,
  affiliateConfig,
  isValidGameSlug,
  isValidStoreId,
} from './affiliate-config';

describe('affiliateConfig', () => {
  it('has 14 stores (Steam/GOG/Epic removed — closed programs)', () => {
    expect(Object.keys(affiliateConfig)).toHaveLength(14);
  });

  it('every config has a valid baseUrl', () => {
    Object.values(affiliateConfig).forEach((c) => {
      expect(() => new URL(c.baseUrl)).not.toThrow();
    });
  });

  it('params factory returns an object', () => {
    Object.values(affiliateConfig).forEach((c) => {
      expect(typeof c.params()).toBe('object');
    });
  });
});

describe('ALLOWED_DOMAINS', () => {
  it('does NOT include steam (program closed)', () => {
    expect(ALLOWED_DOMAINS.has('store.steampowered.com')).toBe(false);
  });

  it('matches each config entry', () => {
    Object.values(affiliateConfig).forEach((c) => {
      const hostname = new URL(c.baseUrl).hostname;
      expect(ALLOWED_DOMAINS.has(hostname)).toBe(true);
    });
  });
});

describe('isValidStoreId', () => {
  it('returns true for valid numeric IDs', () => {
    expect(isValidStoreId('11')).toBe(true); // Humble
    expect(isValidStoreId('15')).toBe(true); // Fanatical
    expect(isValidStoreId('104')).toBe(true); // Gamivo
  });

  it('returns false for removed store IDs', () => {
    expect(isValidStoreId('1')).toBe(false); // Steam removed
    expect(isValidStoreId('7')).toBe(false); // GOG removed
    expect(isValidStoreId('24')).toBe(false); // Epic removed
  });

  it('returns false for unknown store IDs', () => {
    expect(isValidStoreId('999')).toBe(false);
    expect(isValidStoreId('0')).toBe(false);
  });

  it('returns false for non-numeric input', () => {
    expect(isValidStoreId('abc')).toBe(false);
    expect(isValidStoreId('')).toBe(false);
    expect(isValidStoreId('12a')).toBe(false);
  });
});

describe('isValidGameSlug', () => {
  it('returns true for valid slugs', () => {
    expect(isValidGameSlug('half-life-2')).toBe(true);
    expect(isValidGameSlug('cyberpunk_2077')).toBe(true);
    expect(isValidGameSlug('a')).toBe(true);
  });

  it('returns false for empty slug', () => {
    expect(isValidGameSlug('')).toBe(false);
  });

  it('returns false for slug over 100 chars', () => {
    expect(isValidGameSlug('a'.repeat(101))).toBe(false);
  });

  it('returns false for slugs with special chars', () => {
    expect(isValidGameSlug('../etc/passwd')).toBe(false);
    expect(isValidGameSlug('game<script>')).toBe(false);
  });
});
