import { beforeEach, describe, expect, it, vi } from 'vitest';

const { ingestPricesAction } = vi.hoisted(() => ({
  ingestPricesAction: vi.fn(),
}));

vi.mock('@/actions/deals', () => ({ ingestPricesAction }));
vi.mock('@/lib/cron-auth', () => ({
  verifyCronAuth: (request: Request) => {
    const auth = request.headers.get('authorization');
    if (!auth || auth !== 'Bearer valid-secret') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    return null;
  },
}));

import { GET } from './route';

beforeEach(() => {
  vi.clearAllMocks();
});

function buildRequest(auth = 'Bearer valid-secret'): Request {
  return new Request('http://localhost:3000/api/cron/ingest-prices', {
    headers: { authorization: auth },
  });
}

describe('GET /api/cron/ingest-prices', () => {
  it('returns 200 on successful ingestion', async () => {
    ingestPricesAction.mockResolvedValueOnce({
      success: true,
      dealsIngested: 42,
      gamesUpserted: 10,
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ success: true, dealsIngested: 42, gamesUpserted: 10 });
  });

  it('returns 500 on ingestion failure', async () => {
    ingestPricesAction.mockResolvedValueOnce({
      success: false,
      error: 'CheapShark returned 429',
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ success: false, error: 'CheapShark returned 429' });
  });

  it('returns 401 with missing auth header', async () => {
    const response = await GET(buildRequest(''));
    expect(response.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const response = await GET(buildRequest('Bearer wrong-secret'));
    expect(response.status).toBe(401);
  });
});
