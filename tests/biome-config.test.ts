import { describe, expect, it } from 'vitest';
import biomeConfig from '../biome.json' with { type: 'json' };

describe('biome.json quality gates', () => {
  it('should not have global off for critical rules', () => {
    const rules = biomeConfig.linter?.rules || {};
    const globalOff: string[] = [];
    for (const [category, categoryRules] of Object.entries(rules)) {
      if (typeof categoryRules === 'object' && categoryRules !== null) {
        for (const [ruleName, value] of Object.entries(categoryRules as Record<string, unknown>)) {
          if (value === 'off') {
            globalOff.push(`${category}/${ruleName}`);
          }
        }
      }
    }
    expect(globalOff).toEqual([]);
  });

  it('should have overrides for noDangerouslySetInnerHtml in JSON-LD files', () => {
    const overrides = biomeConfig.overrides || [];
    const jsonLdOverride = overrides.find((o) =>
      o.includes?.some?.((i: string) => i.includes('layout.tsx'))
    );
    expect(
      (jsonLdOverride?.linter?.rules as { security?: { noDangerouslySetInnerHtml?: string } })
        ?.security?.noDangerouslySetInnerHtml
    ).toBe('off');
  });
});
