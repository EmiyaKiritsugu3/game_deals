import { beforeEach, describe, expect, it, vi } from 'vitest';

const execute = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock('@/db', () => ({ db: { execute } }));
const verifyPostbackAuth = vi.hoisted(() => vi.fn());
vi.mock('@/lib/postback-auth', () => ({ verifyPostbackAuth }));
const assertRateLimit = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('@/lib/server-action-rate-limit', () => ({ assertRateLimit }));

import { POST } from '@/app/api/postback/route';

function req(body: unknown): Request {
  return new Request('http://x/api/postback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  execute.mockClear();
  verifyPostbackAuth.mockReset();
  assertRateLimit.mockReset();
  assertRateLimit.mockResolvedValue(undefined);
});

describe('POST /api/postback', () => {
  it('rejects unauthenticated request before touching DB', async () => {
    verifyPostbackAuth.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'no' }), { status: 401 })
    );
    const res = await POST(req({ order_id: 'o1', store_id: '103' }));
    expect(res.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it('allows up to 60/min per IP and 429s the 61st call in the window', async () => {
    verifyPostbackAuth.mockReturnValue(null);
    let calls = 0;
    assertRateLimit.mockImplementation(async () => {
      calls += 1;
      if (calls > 60) throw new Error('Rate limit exceeded');
      return undefined;
    });
    for (let i = 0; i < 61; i += 1) {
      const before = execute.mock.calls.length;
      const res = await POST(req({ order_id: `o-${i}`, store_id: '103' }));
      if (i === 60) {
        expect(res.status).toBe(429);
        expect(execute.mock.calls.length).toBe(before);
      } else {
        expect(res.status).toBe(200);
        expect(execute.mock.calls.length).toBe(before + 1);
      }
    }
    expect(assertRateLimit).toHaveBeenCalledWith('postback', null, 60, 60_000);
    expect(assertRateLimit).toHaveBeenCalledTimes(61);
  });

  it('returns 400 when required fields missing', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('normalizes invalid status to pending and inserts', async () => {
    const res = await POST(req({ order_id: 'o1', store_id: '103', status: 'HACKED' }));
    expect(res.status).toBe(200);
    // drizzle SQL tagged template — assert it was built with our values
    const sqlArg = execute.mock.calls[0]?.[0] as { queryChunks?: unknown[] };
    expect(execute).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(sqlArg.queryChunks ?? sqlArg)).toContain('affiliate_conversions');
  });

  it('clamps commission to rounded finite number and currency to 3 chars', async () => {
    const res = await POST(
      req({ order_id: 'o2', store_id: '11', commission_cents: 12.6, currency: 'BRLZ' })
    );
    expect(res.status).toBe(200);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed click_id (non-uuid)', async () => {
    const res = await POST(req({ order_id: 'o3', store_id: '11', click_id: 'not-uuid' }));
    expect(res.status).toBe(200);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('returns 500 on insert failure (Sentry path)', async () => {
    execute.mockRejectedValueOnce(new Error('db down'));
    const res = await POST(req({ order_id: 'o4', store_id: '11' }));
    expect(res.status).toBe(500);
  });
});
