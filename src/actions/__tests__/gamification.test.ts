import { describe, expect, it, vi } from 'vitest';

const onConflictDoUpdateMock = vi.fn().mockResolvedValue({});
const getUserMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: onConflictDoUpdateMock,
      }),
    }),
  },
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

const { updateLeaderboardOptIn, updateLeaderboardOptInAction } = await import('../gamification');

describe('updateLeaderboardOptIn', () => {
  it('updates when authenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u-1' } } });
    await updateLeaderboardOptIn(true);

    expect(onConflictDoUpdateMock).toHaveBeenCalledWith({
      target: expect.anything(),
      set: { optInLeaderboard: true },
    });
  });

  it('throws when not authenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(updateLeaderboardOptIn(true)).rejects.toThrow('Not authenticated');
  });
});

describe('updateLeaderboardOptInAction', () => {
  it('extracts optIn from FormData', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u-1' } } });
    const formData = new FormData();
    formData.set('optIn', 'on');
    const result = await updateLeaderboardOptInAction(null, formData);
    expect(result).toEqual({ success: true });
  });
});
