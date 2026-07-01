/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import ProfilePage from '../page';

beforeAll(() => {
  process.env.TZ = 'UTC';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'placeholder-key';
});

afterAll(() => {
  process.env.TZ = 'America/Sao_Paulo';
});

const { redirectMock, getUserMock, profileMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getUserMock: vi.fn().mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  }),
  profileMock: vi.fn().mockResolvedValue({
    stats: { xp: 0, level: 0, optInLeaderboard: false },
    badges: [],
    recentActivity: [],
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error('NEXT_REDIRECT');
  },
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [{ name: 'sb-token', value: 'token' }],
    set: () => {},
  }),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({ auth: { getUser: getUserMock } }),
}));

vi.mock('@/services/gamification', () => ({
  getUserProfile: profileMock,
  RARITY_COLORS: {
    Common: '#9ca3af',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Epic: '#a855f7',
  },
}));

vi.mock('@/actions/gamification', () => ({
  updateLeaderboardOptIn: () => Promise.resolve(),
  updateLeaderboardOptInAction: () => Promise.resolve({ success: true }),
}));

vi.mock('@/db', () => ({
  db: {
    insert: () => ({
      values: () => ({ onConflictDoUpdate: () => Promise.resolve({}) }),
    }),
  },
}));

describe('ProfilePage', () => {
  it('renders user info when authenticated', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'test@example.com',
          created_at: '2024-06-01T00:00:00Z',
          identities: [{ provider: 'google' }],
        },
      },
      error: null,
    });

    render(await ProfilePage());

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('google')).toBeInTheDocument();
    expect(screen.getByText(/June 1, 2024/)).toBeInTheDocument();
  });

  it('shows gamification sections when profile data exists', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'p@x.com',
          created_at: '2025-01-15T00:00:00Z',
          identities: [{ provider: 'email' }],
        },
      },
      error: null,
    });
    profileMock.mockResolvedValue({
      stats: { xp: 250, level: 5, optInLeaderboard: true },
      badges: [
        {
          id: 'b1',
          name: 'Lucky',
          description: null,
          iconSvg: '<svg/>',
          rarity: 'Uncommon',
          awardedAt: new Date(),
        },
      ],
      recentActivity: [
        {
          id: 'a1',
          actionType: 'playlist_create',
          details: null,
          createdAt: new Date(),
        },
      ],
    });

    render(await ProfilePage());

    expect(screen.getByText('Badges')).toBeInTheDocument();
    expect(screen.getByText('Lucky')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Playlist Create')).toBeInTheDocument();
  });

  it('shows empty state when gamification returns null', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'e@x.com',
          created_at: '2025-01-15T00:00:00Z',
          identities: [{ provider: 'email' }],
        },
      },
      error: null,
    });
    profileMock.mockResolvedValue(null);

    render(await ProfilePage());

    expect(screen.getByText(/Start adding games/)).toBeInTheDocument();
  });

  it('redirects when no user is returned', async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    await expect(ProfilePage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/auth/auth-code-error');
  });
});
