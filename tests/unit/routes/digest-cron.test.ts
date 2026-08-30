import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendDigest } = vi.hoisted(() => ({ sendDigest: vi.fn() }));
vi.mock('@/lib/digest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/digest')>();
  return { ...actual, sendDigestToSubscribers: sendDigest };
});
vi.mock('@/lib/cron-log', () => ({
  cronError: vi.fn(),
  cronLog: vi.fn(),
}));
const { getDeals } = vi.hoisted(() => ({ getDeals: vi.fn() }));
vi.mock('@/services/api', () => ({ getDeals }));

import { GET as topGET } from '@/app/api/cron/top-deals-digest/route';
import { GET as weeklyGET } from '@/app/api/cron/weekly-free-games/route';

const CRON_SECRET = 'loop-secret';

function cronRequest(): Request {
  return new Request('http://localhost/api/cron/x', {
    method: 'GET',
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

const baseDeal = {
  title: 'Eldritch Horizons',
  storeID: '1',
  gameID: '612',
  thumb: 'https://cdn.example/thumbs/612.jpg',
  salePrice: '9.99',
  normalPrice: '49.99',
  savings: '80',
};

beforeEach(() => {
  process.env.CRON_SECRET = CRON_SECRET;
  sendDigest.mockClear();
  getDeals.mockReset();
});

describe('GET /api/cron/weekly-free-games', () => {
  it('rejects request without bearer secret (401)', async () => {
    const res = await weeklyGET(new Request('http://localhost/api/cron'));
    expect(res.status).toBe(401);
    expect(sendDigest).not.toHaveBeenCalled();
  });

  it('returns 500 when CRON_SECRET unset', async () => {
    delete process.env.CRON_SECRET;
    const res = await weeklyGET(cronRequest());
    expect(res.status).toBe(500);
  });

  it('returns ok with sent 0 when no qualifying free games', async () => {
    getDeals.mockResolvedValueOnce([{ ...baseDeal, salePrice: '19.99' }]);
    const res = await weeklyGET(cronRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sent: number };
    expect(body.sent).toBe(0);
    expect(sendDigest).not.toHaveBeenCalled();
  });

  it('sends digest only for salePrice === 0 deals', async () => {
    const free = { ...baseDeal, salePrice: '0', savings: '100' };
    getDeals.mockResolvedValueOnce([{ ...baseDeal, salePrice: '5.00' }, free]);
    sendDigest.mockResolvedValueOnce(7);
    const res = await weeklyGET(cronRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sent: number; deals: number };
    expect(body.sent).toBe(7);
    expect(body.deals).toBe(1);
    const payload = sendDigest.mock.calls[0][1] as { title: string }[];
    expect(payload.map((d) => d.title)).toEqual(['Eldritch Horizons']);
  });

  it('returns error shape when getDeals throws', async () => {
    getDeals.mockRejectedValueOnce(new Error('cheapshark down'));
    const res = await weeklyGET(cronRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(sendDigest).not.toHaveBeenCalled();
  });
});

describe('GET /api/cron/top-deals-digest', () => {
  it('rejects request without bearer secret (401)', async () => {
    const res = await topGET(new Request('http://localhost/api/cron'));
    expect(res.status).toBe(401);
    expect(sendDigest).not.toHaveBeenCalled();
  });

  it('returns ok with sent 0 when no deal meets 50% gate', async () => {
    getDeals.mockResolvedValueOnce([{ ...baseDeal, savings: '30' }]);
    const res = await topGET(cronRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sent: number };
    expect(body.sent).toBe(0);
    expect(sendDigest).not.toHaveBeenCalled();
  });

  it('sends only deals with savings >= 50, sorted desc', async () => {
    getDeals.mockResolvedValueOnce([
      { ...baseDeal, title: 'Cheap', savings: '55' },
      { ...baseDeal, title: 'Hot', savings: '85' },
      { ...baseDeal, title: 'Meh', savings: '25' },
    ]);
    sendDigest.mockResolvedValueOnce(2);
    const res = await topGET(cronRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sent: number; deals: number };
    expect(body.sent).toBe(2);
    expect(body.deals).toBe(2);
    const payload = sendDigest.mock.calls[0][1] as { title: string }[];
    expect(payload.map((d) => d.title)).toEqual(['Hot', 'Cheap']);
  });

  it('returns error shape when getDeals throws', async () => {
    getDeals.mockRejectedValueOnce(new Error('upstream down'));
    const res = await topGET(cronRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
