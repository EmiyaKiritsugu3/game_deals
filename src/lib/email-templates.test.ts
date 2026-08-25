import { describe, expect, it } from 'vitest';
import { welcomeEmail } from './email-templates';

describe('email-templates', () => {
  it('welcomeEmail returns subject and html', () => {
    const { subject, html } = welcomeEmail();
    expect(subject).toContain('GameDeals');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('/deals/under-10');
  });

  it('html contains no script tags (fixed content only)', () => {
    const { html } = welcomeEmail();
    expect(html).not.toContain('<script');
  });
});
