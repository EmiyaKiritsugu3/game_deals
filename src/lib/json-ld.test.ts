import { describe, expect, it } from 'vitest';
import { safeJsonLdStringify } from './json-ld';

describe('safeJsonLdStringify', () => {
  it('escapa `<` impedindo breakout de <script> via título malicioso', () => {
    const payload = { name: 'Evil</script><script>alert(1)</script>' };
    const out = safeJsonLdStringify(payload);
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script>');
  });

  it('round-trip preserva o JSON original', () => {
    const payload = { name: 'Evil</script><script>alert(1)</script>' };
    expect(JSON.parse(safeJsonLdStringify(payload))).toEqual(payload);
  });

  it('mantém strings normais intactas', () => {
    expect(safeJsonLdStringify({ name: 'Cyberpunk 2077' })).toBe('{"name":"Cyberpunk 2077"}');
  });
});
