import { beforeEach, describe, expect, it, vi } from 'vitest';

const { checkTriggeredAlertsAction } = vi.hoisted(() => ({
  checkTriggeredAlertsAction: vi.fn(),
}));

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@vercel/analytics/server', () => ({ track }));
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
  track.mockResolvedValue(undefined);
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
        { userId: 'u1', gameId: 'g1', currentLowest: 5, targetPrice: 10, notificationId: 'n1' },
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

  it('tracks each triggered alert', async () => {
    checkTriggeredAlertsAction.mockResolvedValueOnce({
      checked: 10,
      triggered: [
        {
          userId: 'u1',
          gameId: 'g1',
          currentLowest: 5,
          targetPrice: 10,
          notificationId: 'n1',
          storeId: 'steam',
        },
        {
          userId: 'u2',
          gameId: 'g2',
          currentLowest: 3,
          targetPrice: 8,
          notificationId: 'n2',
          storeId: null,
        },
      ],
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(200);
    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith('alert_triggered', {
      user_id: 'u1',
      game_id: 'g1',
      price: 5,
      target: 10,
      store_id: 'steam',
    });
    expect(track).toHaveBeenCalledWith('alert_triggered', {
      user_id: 'u2',
      game_id: 'g2',
      price: 3,
      target: 8,
      store_id: null,
    });
  });

  it('does not crash when track throws', async () => {
    track.mockRejectedValueOnce(new Error('Analytics down'));
    checkTriggeredAlertsAction.mockResolvedValueOnce({
      checked: 1,
      triggered: [
        {
          userId: 'u1',
          gameId: 'g1',
          currentLowest: 5,
          targetPrice: 10,
          notificationId: 'n1',
          storeId: null,
        },
      ],
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(200);
  });

  it('returns 200 with zero triggered alerts', async () => {
    checkTriggeredAlertsAction.mockResolvedValueOnce({
      checked: 25,
      triggered: [],
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ processed: 25, triggered: 0 });
    expect(body).toHaveProperty('details');
    expect(track).not.toHaveBeenCalled();
  });
});
