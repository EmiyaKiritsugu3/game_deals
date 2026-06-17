import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execute, authGetUser, revalidateMock, dbUpdate } = vi.hoisted(() => {
  const whereFn = vi.fn().mockResolvedValue(undefined);
  const setFn = vi.fn(() => ({ where: whereFn }));
  const updateFn = vi.fn(() => ({ set: setFn }));
  return {
    execute: vi.fn(),
    authGetUser: vi.fn(),
    revalidateMock: vi.fn(),
    dbUpdate: updateFn,
  };
});

vi.mock('@/db', () => ({ db: { execute, update: dbUpdate } }));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: () => authGetUser() } }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidateMock(path),
}));

import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from './notifications';

beforeEach(() => {
  execute.mockReset();
  authGetUser.mockReset();
  revalidateMock.mockReset();
  dbUpdate.mockReset();
});

describe('getNotificationsAction', () => {
  it('returns empty when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await getNotificationsAction();
    expect(result).toEqual({ items: [], unread: 0 });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns notifications and unread count for authed user', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([
      { rows: [{ id: 'n1', type: 'alert', userId: 'user-1' }], unread: 2 },
    ]);
    const result = await getNotificationsAction();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: 'n1', type: 'alert' });
    expect(result.unread).toBe(2);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('handles null rows gracefully', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([{ rows: null, unread: 0 }]);
    const result = await getNotificationsAction();
    expect(result.items).toEqual([]);
    expect(result.unread).toBe(0);
  });

  it('handles null unread gracefully', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([{ rows: [], unread: null }]);
    const result = await getNotificationsAction();
    expect(result.unread).toBe(0);
  });

  it('uses custom limit', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([{ rows: [], unread: 0 }]);
    await getNotificationsAction(5);
    expect(execute).toHaveBeenCalledTimes(1);
    const sqlObj = execute.mock.calls[0][0] as { queryChunks: Array<{ value: string[] } | number> };
    const sqlText = sqlObj.queryChunks
      .map((c: { value: string[] } | number) =>
        typeof c === 'object' ? (c.value[0] ?? '') : String(c)
      )
      .join('');
    expect(sqlText).toContain('LIMIT 5');
  });
});

describe('markNotificationReadAction', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(markNotificationReadAction('n1')).rejects.toThrow('Unauthorized');
    expect(dbUpdate).not.toHaveBeenCalled();
  });

  it('updates notification and revalidates', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    await markNotificationReadAction('n1');
    expect(dbUpdate).toHaveBeenCalledTimes(1);
    expect(revalidateMock).toHaveBeenCalledWith('/');
  });
});

describe('markAllNotificationsReadAction', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(markAllNotificationsReadAction()).rejects.toThrow('Unauthorized');
    expect(dbUpdate).not.toHaveBeenCalled();
  });

  it('updates all unread notifications and revalidates', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    await markAllNotificationsReadAction();
    expect(dbUpdate).toHaveBeenCalledTimes(1);
    expect(revalidateMock).toHaveBeenCalledWith('/');
  });
});
