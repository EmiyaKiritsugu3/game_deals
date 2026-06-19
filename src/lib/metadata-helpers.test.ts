import { describe, expect, it, vi } from 'vitest';
import { buildOG, buildTwitter, extractDescription, extractTitle } from './metadata-helpers';

vi.mock('@/services/api', () => ({
  getHighResImage: vi.fn((thumb: string) => (thumb ? `https://images.example.com/${thumb}` : '')),
}));

describe('extractTitle', () => {
  it('includes best price when provided', () => {
    expect(extractTitle('Dead Cells', '9.99')).toBe('Dead Cells — Best Price: $9.99');
  });

  it('falls back to N/A when bestPrice is undefined', () => {
    expect(extractTitle('Dead Cells', undefined)).toBe('Dead Cells — Best Price: $N/A');
  });

  it('handles empty title', () => {
    const result = extractTitle('', '9.99');
    expect(result).toBe(' — Best Price: $9.99');
  });

  it('handles zero price', () => {
    expect(extractTitle('Game', '0.00')).toBe('Game — Best Price: $0.00');
  });
});

describe('extractDescription', () => {
  it('includes all fields correctly', () => {
    const result = extractDescription('Dead Cells', '9.99', '4.99', 5);
    expect(result).toContain('Dead Cells');
    expect(result).toContain('$9.99');
    expect(result).toContain('$4.99');
    expect(result).toContain('5 stores');
  });

  it('handles dealCount of 0', () => {
    const result = extractDescription('Game', '9.99', '5.00', 0);
    expect(result).toContain('0 stores');
  });

  it('handles dealCount of 1', () => {
    const result = extractDescription('Game', '14.99', '10.00', 1);
    expect(result).toContain('1 stores');
  });
});

describe('buildOG', () => {
  it('returns valid OG object with all fields', () => {
    const result = buildOG('Dead Cells', 'Best deal', 'thumb.jpg', '123');
    expect(result).toMatchObject({
      title: 'Dead Cells',
      description: 'Best deal',
      siteName: 'GameDeals',
      type: 'website',
    });
    expect(result.url).toBe('https://gamedeals.com.br/game/123');
    const ogImages = result.images as Array<{ url: string; width: number; height: number }>;
    expect(ogImages).toHaveLength(1);
    expect(ogImages[0].url).toBe('https://images.example.com/thumb.jpg');
    expect(ogImages[0].width).toBe(600);
    expect(ogImages[0].height).toBe(300);
  });

  it('constructs URL with empty id', () => {
    const result = buildOG('Game', 'desc', 'thumb.jpg', '');
    expect(result.url).toBe('https://gamedeals.com.br/game/');
  });

  it('handles empty thumb string', () => {
    const result = buildOG('Game', 'desc', '', '456');
    const ogImages = result.images as Array<{ url: string }>;
    expect(ogImages[0].url).toBe('');
  });
});

describe('buildTwitter', () => {
  it('returns valid Twitter card object', () => {
    const result = buildTwitter('Dead Cells', 'Best deal', 'thumb.jpg');
    expect(result).toMatchObject({
      card: 'summary_large_image',
      title: 'Dead Cells',
      description: 'Best deal',
    });
    const twImages = result.images as Array<string>;
    expect(twImages).toHaveLength(1);
  });

  it('handles empty thumb', () => {
    const result = buildTwitter('Game', 'desc', '');
    const twImages = result.images as Array<string>;
    expect(twImages[0]).toBe('');
  });
});
