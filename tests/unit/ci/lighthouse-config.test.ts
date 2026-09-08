import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../../..');

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(join(root, path), 'utf8')) as unknown;
}

describe('lighthouserc.json budgets (T10)', () => {
  it('covers the three spec pages', () => {
    const cfg = loadJson('lighthouserc.json') as {
      ci: { collect: { url: string[] } };
    };
    // biome-ignore lint/suspicious/noTemplateCurlyInString: asserting literal ${} placeholders
    expect(cfg.ci.collect.url).toEqual([
      // biome-ignore lint/suspicious/noTemplateCurlyInString: literal LHCI env placeholder
      '${LHCI_URL}/',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: literal LHCI env placeholder
      '${LHCI_URL}/deals/under-10',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: literal LHCI env placeholder
      '${LHCI_URL}/search',
    ]);
  });

  it('enforces LCP/CLS/TBT budgets from spec', () => {
    const cfg = loadJson('lighthouserc.json') as {
      ci: { assert: { assertions: Record<string, [string, { maxNumericValue: number }]> } };
    };
    const a = cfg.ci.assert.assertions;
    expect(a['largest-contentful-paint']).toEqual(['error', { maxNumericValue: 2500 }]);
    expect(a['cumulative-layout-shift']).toEqual(['error', { maxNumericValue: 0.1 }]);
    expect(a['total-blocking-time']).toEqual(['error', { maxNumericValue: 300 }]);
  });
});

describe('nightly.yml lighthouse job (T10)', () => {
  const yml = readFileSync(join(root, '.github/workflows/nightly.yml'), 'utf8');

  it('defines a lighthouse job using lighthouserc + preview URL', () => {
    expect(yml).toContain('lighthouse:');
    expect(yml).toMatch(/bunx @lhci\/cli@[\d.]+ autorun/);
    expect(yml).toContain('VERCEL_APP_URL');
    expect(yml).toContain('LHCI_URL');
  });
});
