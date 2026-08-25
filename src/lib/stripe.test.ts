import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCheckoutSession, StripeError, verifyWebhookSignature } from './stripe';

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_test123';
  const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });

  function makeSig(ts: number): string {
    const hmac = createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex');
    return `t=${ts},v1=${hmac}`;
  }

  it('accepts valid fresh signature', () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(verifyWebhookSignature(payload, makeSig(ts), secret)).toBe(true);
  });

  it('rejects tampered payload', () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(verifyWebhookSignature(`${payload}x`, makeSig(ts), secret)).toBe(false);
  });

  it('rejects expired timestamp (replay)', () => {
    const old = Math.floor(Date.now() / 1000) - 3600;
    expect(verifyWebhookSignature(payload, makeSig(old), secret)).toBe(false);
  });

  it('rejects missing v1', () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(verifyWebhookSignature(payload, `t=${ts}`, secret)).toBe(false);
  });

  it('rejects garbage header', () => {
    expect(verifyWebhookSignature(payload, 'garbage', secret)).toBe(false);
  });
});

describe('createCheckoutSession', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_PRICE_ID = 'price_test';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID;
  });

  it('throws when not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    await expect(
      createCheckoutSession({ userId: 'u1', userEmail: 'x@y.com', origin: 'https://g.com' })
    ).rejects.toThrow(StripeError);
  });

  it('returns checkout url on success', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/abc' }), {
        status: 200,
      })
    );
    const url = await createCheckoutSession({
      userId: 'u1',
      userEmail: 'x@y.com',
      origin: 'https://g.com',
    });
    expect(url).toContain('checkout.stripe.com');
  });
});
