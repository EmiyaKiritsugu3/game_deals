import { beforeEach, describe, expect, it, vi } from 'vitest';

const { checkTriggeredAlertsAction } = vi.hoisted(() => ({
  checkTriggeredAlertsAction: vi.fn(),
}));

vi.mock('@/actions/alerts', () => ({ checkTriggeredAlertsAction }));
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
  return new Request('http://localhost:3000/api/cron/check-alerts', {
    headers: { authorization: auth },
  });
}

describe('GET /api/cron/check-alerts', () => {
  it('returns processed count and triggered alerts on success', async () => {
    checkTriggeredAlertsAction.mockResolvedValueOnce({
      checked: 10,
      triggered: [
        { userId: 'u1', gameId: 'g1', currentLowest: 5.0, targetPrice: 10.0, notificationId: 'n1' },
      ],
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ processed: 10, triggered: 1 });
    expect(body).toHaveProperty('details');
  });

  it('returns 500 on check failure', async () => {
    checkTriggeredAlertsAction.mockRejectedValueOnce(new Error('DB connection failed'));
    const response = await GET(buildRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('timestamp');
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
