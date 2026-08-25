import { describe, expect, it } from 'vitest';
import { type DigestDeal, digestHtml, qualityGate } from './digest';

const deal: DigestDeal = {
  title: 'Cyberpunk 2077',
  salePrice: 29.9,
  normalPrice: 199.9,
  savings: 85,
  thumb: 'https://example.com/thumb.png',
  dealUrl: '103/12345',
};

describe('qualityGate', () => {
  it('keeps deals >=30% with link', () => {
    expect(qualityGate([deal])).toHaveLength(1);
  });

  it('drops low savings', () => {
    expect(qualityGate([{ ...deal, savings: 10 }])).toHaveLength(0);
  });

  it('drops empty dealUrl', () => {
    expect(qualityGate([{ ...deal, dealUrl: '' }])).toHaveLength(0);
  });
});

describe('digestHtml', () => {
  it('contains deal title, prices and CTA link', () => {
    const html = digestHtml([deal], 'Test heading');
    expect(html).toContain('Cyberpunk 2077');
    expect(html).toContain('/out/103%2F12345');
    expect(html).toContain('-85%');
    expect(html).toContain('Test heading');
  });

  it('renders empty list without items', () => {
    const html = digestHtml([], 'Empty');
    expect(html).toContain('Empty');
    expect(html).not.toContain('/out/');
  });
});

describe('digestHtml escaping', () => {
  it('escapes HTML in untrusted deal title/thumb (XSS via CheapShark data)', () => {
    const malicious: DigestDeal = {
      title: '<script>alert(1)</script>',
      salePrice: 10,
      normalPrice: 20,
      savings: 50,
      thumb: 'https://x.com/a"onerror="alert(1)',
      dealUrl: '103/1',
    };
    const html = digestHtml([malicious], 'Head');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('"onerror=');
  });
});
