/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProfilePage from '../page';

beforeAll(() => {
  process.env.TZ = 'UTC';
});

afterAll(() => {
  process.env.TZ = 'America/Sao_Paulo';
});

const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error('NEXT_REDIRECT');
  },
}));

const getUserMock = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
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

  it('redirects when no user is returned', async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    await expect(ProfilePage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/auth/auth-code-error');
  });
});
