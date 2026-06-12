import { describe, expect, it } from 'vitest';
import { calculateCostPerHour, estimatePlaytime } from './hltb';

describe('estimatePlaytime', () => {
  it('produces deterministic results for same title', () => {
    const title = 'Cyberpunk 2077';
    const res1 = estimatePlaytime(title);
    const res2 = estimatePlaytime(title);
    expect(res1).toEqual(res2);
  });

  it('returns mainStory in 6-80h range for varied inputs', () => {
    const titles = [
      'A',
      'Very Long Game Title That Might Affect Hash',
      '',
      '!@#$%^&*()',
      '🎮 Video Game',
    ];
    titles.forEach((t) => {
      const res = estimatePlaytime(t);
      expect(res.mainStory).toBeGreaterThanOrEqual(6);
      expect(res.mainStory).toBeLessThanOrEqual(80);
    });
  });

  it('mainStory <= mainExtra <= completionist (hierarchical)', () => {
    const titles = [
      'A',
      'Very Long Game Title That Might Affect Hash',
      '',
      '!@#$%^&*()',
      '🎮 Video Game',
    ];
    titles.forEach((t) => {
      const res = estimatePlaytime(t);
      expect(res.mainExtra).toBeGreaterThanOrEqual(res.mainStory);
      expect(res.completionist).toBeGreaterThanOrEqual(res.mainExtra);
    });
  });

  it('handles unicode / emoji characters', () => {
    const res = estimatePlaytime('🔥 EPIC DEAL');
    expect(res.found).toBe(true);
  });
});

describe('calculateCostPerHour', () => {
  it('returns FREE for zero price', () => {
    expect(calculateCostPerHour(0, 50)).toBe('FREE');
  });

  it('returns N/A for zero hours', () => {
    expect(calculateCostPerHour(10, 0)).toBe('N/A');
  });

  it('calculates standard rate', () => {
    expect(calculateCostPerHour(10, 20)).toBe('$0.50/hr');
  });

  it('formats rounding correctly', () => {
    expect(calculateCostPerHour(59.99, 100)).toBe('$0.60/hr');
  });
});
