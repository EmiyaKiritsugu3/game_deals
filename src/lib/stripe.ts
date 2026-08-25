/**
 * Minimal Stripe client - raw fetch + stdlib crypto, zero deps.
 * ponytail: stripe SDK adds ~1MB; we use exactly 2 endpoints (checkout session,
 * webhook signature verify). Swap to SDK if we add subscriptions/billing portal.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID (monthly price).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const API_BASE = 'https://api.stripe.com/v1';

export class StripeError extends Error {
  readonly status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'StripeError';
    this.status = status;
  }
}

/**
 * Create a Checkout Session for the premium subscription.
 * Returns the hosted checkout URL to redirect to.
 */
export async function createCheckoutSession(args: {
  userId: string;
  userEmail: string;
  origin: string;
}): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!key || !priceId) {
    throw new StripeError('Stripe not configured');
  }

  const body = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${args.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${args.origin}/premium`,
    client_reference_id: args.userId,
    customer_email: args.userEmail,
  });

  const res = await fetch(`${API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new StripeError(`Checkout failed (${res.status}): ${await res.text()}`, res.status);
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new StripeError('Checkout returned no URL', res.status);
  return data.url;
}

/**
 * Verify a Stripe webhook signature header against the raw payload.
 * Format: t=<ts>,v1=<hmac_sha256(ts.payload)>[,v1=...]
 * Rejects signatures older than 5 minutes (replay protection).
 */
export function verifyWebhookSignature(
  payload: string,
  sigHeader: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  const parts = Object.fromEntries(
    sigHeader.split(',').map((kv) => kv.split('=') as [string, string])
  );
  const timestamp = parts.t;
  const signatures = sigHeader.split(',').filter((kv) => kv.startsWith('v1='));

  if (!timestamp || signatures.length === 0) return false;

  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > toleranceSeconds) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest();

  for (const kv of signatures) {
    const given = Buffer.from(kv.slice(3), 'hex');
    if (given.length === expected.length && timingSafeEqual(given, expected)) {
      return true;
    }
  }
  return false;
}
