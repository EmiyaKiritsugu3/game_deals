import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execute, authGetUser, resolveGameUuid } = vi.hoisted(() => ({
  execute: vi.fn(),
  authGetUser: vi.fn(),
  resolveGameUuid: vi.fn(),
}));

vi.mock('@/db', () => ({ db: { execute } }));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: () => authGetUser() } }),
}));

vi.mock('@/actions/deals', () => ({ resolveGameUuid }));

import {
  checkTriggeredAlertsAction,
  createPriceAlertAction,
  deletePriceAlertAction,
  getUserAlertsAction,
} from './alerts';

beforeEach(() => {
  execute.mockReset();
  authGetUser.mockReset();
  resolveGameUuid.mockReset();
});

describe('createPriceAlertAction', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(createPriceAlertAction('123', 9.99)).rejects.toThrow('Unauthorized');
    expect(execute).not.toHaveBeenCalled();
  });

  it('throws when game uuid not resolved', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    resolveGameUuid.mockResolvedValueOnce(null);
    await expect(createPriceAlertAction('999999', 9.99)).rejects.toThrow(
      'Game not found or not yet ingested'
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('inserts alert and returns raw row', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    resolveGameUuid.mockResolvedValueOnce('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    const fakeRow = { id: 'alert-1', userId: 'user-1', gameId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', targetPrice: 9.99 };
    execute.mockResolvedValueOnce([fakeRow]);
    const result = await createPriceAlertAction('123', 9.99);
    expect(result).toEqual(fakeRow);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('accepts optional storeId', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    resolveGameUuid.mockResolvedValueOnce('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    execute.mockResolvedValueOnce([{ id: 'alert-2' }]);
    await createPriceAlertAction('123', 5.0, 'steam');
    expect(execute).toHaveBeenCalledTimes(1);
  });
});

describe('getUserAlertsAction', () => {
  it('returns empty array when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await getUserAlertsAction();
    expect(result).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns alerts for authenticated user', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const fakeAlerts = [
      { id: 'alert-1', userId: 'user-1', title: 'Game A', thumbUrl: 'a.jpg' },
      { id: 'alert-2', userId: 'user-1', title: 'Game B', thumbUrl: 'b.jpg' },
    ];
    execute.mockResolvedValueOnce(fakeAlerts);
    const result = await getUserAlertsAction();
    expect(result).toEqual(fakeAlerts);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when db returns no rows', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([]);
    const result = await getUserAlertsAction();
    expect(result).toEqual([]);
  });
});

describe('deletePriceAlertAction', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(deletePriceAlertAction('alert-1')).rejects.toThrow('Unauthorized');
    expect(execute).not.toHaveBeenCalled();
  });

  it('throws when alert not found', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([]);
    await expect(deletePriceAlertAction('nonexistent')).rejects.toThrow('Forbidden');
  });

  it('throws when alert belongs to another user', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([{ userId: 'user-2' }]);
    await expect(deletePriceAlertAction('alert-other')).rejects.toThrow('Forbidden');
  });

  it('deletes alert when owner matches', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute
      .mockResolvedValueOnce([{ userId: 'user-1' }])
      .mockResolvedValueOnce(undefined);
    const result = await deletePriceAlertAction('alert-own');
    expect(result).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
  });
});

describe('checkTriggeredAlertsAction', () => {
  it('returns checked=0 and empty triggered when no active alerts', async () => {
    execute.mockResolvedValueOnce([{ cnt: 0 }]);
    execute.mockResolvedValueOnce([]);
    const result = await checkTriggeredAlertsAction();
    expect(result).toEqual({ checked: 0, triggered: [] });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('returns triggered alerts with mapped columns', async () => {
    execute.mockResolvedValueOnce([{ cnt: 2 }]);
    execute.mockResolvedValueOnce([
      {
        user_id: 'u1',
        game_id: 'g1',
        store_id: 's1',
        target_price: 9.99,
        current_price: 7.50,
        notification_id: 'n1',
      },
      {
        user_id: 'u2',
        game_id: 'g2',
        store_id: null,
        target_price: 5.00,
        current_price: 4.00,
        notification_id: 'n2',
      },
    ]);
    const result = await checkTriggeredAlertsAction();
    expect(result).toEqual({
      checked: 2,
      triggered: [
        {
          userId: 'u1',
          gameId: 'g1',
          storeId: 's1',
          targetPrice: 9.99,
          currentLowest: 7.50,
          notificationId: 'n1',
        },
        {
          userId: 'u2',
          gameId: 'g2',
          storeId: null,
          targetPrice: 5.00,
          currentLowest: 4.00,
          notificationId: 'n2',
        },
      ],
    });
  });

  it('handles missing cnt gracefully', async () => {
    execute.mockResolvedValueOnce([{ cnt: null }]);
    execute.mockResolvedValueOnce([]);
    const result = await checkTriggeredAlertsAction();
    expect(result).toEqual({ checked: 0, triggered: [] });
  });
});
