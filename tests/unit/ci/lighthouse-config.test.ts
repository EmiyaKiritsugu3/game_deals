import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../../..');

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(join(root, path), 'utf8')) as unknown;
}

describe('lighthouserc.json budgets (T10)', () => {
  it(`carries no collect.url — URLs come from CLI flags (LHCI does not expand \${} in JSON)`, () => {
    const cfg = loadJson('lighthouserc.json') as {
      ci: { collect: { url?: string[] } };
    };
    expect(cfg.ci.collect.url).toBeUndefined();
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

  it('passes the three spec pages via CLI flags with shell-expanded URL', () => {
    expect(yml).toContain('lighthouse:');
    expect(yml).toMatch(/bunx @lhci\/cli@[\d.]+ autorun/);
    for (const path of ['/', '/deals/under-10', '/search']) {
      expect(yml).toContain(`--collect.url="$LHCI_URL${path}"`);
    }
    expect(yml).toContain('VERCEL_APP_URL');
  });
});
