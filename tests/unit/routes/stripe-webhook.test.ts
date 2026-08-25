import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dbUpdate } = vi.hoisted(() => ({ dbUpdate: vi.fn().mockResolvedValue([{}]) }));

vi.mock('@/db', () => ({
  db: { update: () => ({ set: () => ({ where: (...args: unknown[]) => dbUpdate(...args) }) }) },
}));
vi.mock('@/lib/cron-log', () => ({
  cronError: vi.fn(),
  cronLog: vi.fn(),
}));
const verifyMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/stripe', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/stripe')>();
  return { ...actual, verifyWebhookSignature: verifyMock };
});

import { POST } from '@/app/api/stripe/webhook/route';

function signedRequest(payload: string): Request {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 't=1,v1=x' },
    body: payload,
  });
}

function expectSig(ok: boolean) {
  verifyMock.mockReturnValueOnce(ok);
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  dbUpdate.mockClear();
});

describe('POST /api/stripe/webhook', () => {
  it('returns 400 on invalid signature', async () => {
    expectSig(false);
    const res = await POST(signedRequest('{}'));
    expect(res.status).toBe(400);
    expect(dbUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid JSON with valid sig', async () => {
    expectSig(true);
    const res = await POST(signedRequest('not-json'));
    expect(res.status).toBe(400);
    expect(dbUpdate).not.toHaveBeenCalled();
  });

  it('grants premium on checkout.session.completed', async () => {
    const payload = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'user-1', customer: 'cus_123' } },
    });
    expectSig(true);
    const res = await POST(signedRequest(payload));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { received?: boolean };
    expect(body.received).toBe(true);
    expect(dbUpdate).toHaveBeenCalled();
  });

  it('clears premium on subscription deleted', async () => {
    const payload = JSON.stringify({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_123' } },
    });
    expectSig(true);
    const res = await POST(signedRequest(payload));
    expect(res.status).toBe(200);
    expect(dbUpdate).toHaveBeenCalled();
  });

  it('returns 500 when webhook secret missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(signedRequest('{}'));
    expect(res.status).toBe(500);
  });
});
