import { beforeEach, describe, expect, it, vi } from 'vitest';

const { syncGamesToTypesenseAction } = vi.hoisted(() => ({
  syncGamesToTypesenseAction: vi.fn(),
}));

vi.mock('@/actions/search', () => ({ syncGamesToTypesenseAction }));
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
  return new Request('http://localhost:3000/api/cron/reindex-typesense', {
    headers: { authorization: auth },
  });
}

describe('GET /api/cron/reindex-typesense', () => {
  it('returns 200 on successful sync', async () => {
    syncGamesToTypesenseAction.mockResolvedValueOnce({
      success: true,
      indexed: 100,
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ success: true, indexed: 100 });
  });

  it('returns 500 on sync failure', async () => {
    syncGamesToTypesenseAction.mockResolvedValueOnce({
      success: false,
      indexed: 0,
      error: 'Typesense not configured',
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ success: false, error: 'Typesense not configured' });
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
