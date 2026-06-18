import type { User as SupabaseUser } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from './authStore';

const { mockSignOut } = vi.hoisted(() => ({
  mockSignOut: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/lib/supabase-browser', () => ({
  getBrowserClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

function createMockSupabaseUser(
  overrides: Partial<{ id: string; email: string; fullName: string; avatarUrl: string }> = {}
) {
  return {
    id: overrides.id ?? 'test-user-1',
    email: overrides.email ?? 'test@example.com',
    user_metadata: {
      full_name: overrides.fullName ?? 'Test User',
      avatar_url: overrides.avatarUrl ?? 'https://example.com/avatar.png',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01',
    role: '',
    updated_at: '2024-01-01',
  };
}

describe('authStore', () => {
  beforeEach(() => {
    useAuth.setState({ user: null, isLoggedIn: false });
    mockSignOut.mockClear();
  });

  it('starts with no user and not logged in', () => {
    const { user, isLoggedIn } = useAuth.getState();
    expect(user).toBeNull();
    expect(isLoggedIn).toBe(false);
  });

  describe('setUser', () => {
    it('sets user and isLoggedIn when supabaseUser is provided', () => {
      const { setUser } = useAuth.getState();
      const supabaseUser = createMockSupabaseUser();

      setUser(supabaseUser as unknown as SupabaseUser);

      const { user, isLoggedIn } = useAuth.getState();
      expect(isLoggedIn).toBe(true);
      expect(user).toEqual({
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.png',
      });
    });

    it('uses email prefix as fallback name when full_name is missing', () => {
      const { setUser } = useAuth.getState();
      const supabaseUser = createMockSupabaseUser({ fullName: '' });

      setUser(supabaseUser as unknown as SupabaseUser);

      const { user } = useAuth.getState();
      expect(user?.name).toBe('test');
    });

    it('skips update when same user id is set again (idempotent guard)', () => {
      const { setUser } = useAuth.getState();
      const supabaseUser = createMockSupabaseUser();

      setUser(supabaseUser as unknown as SupabaseUser);
      const stateAfterFirst = useAuth.getState();

      setUser(supabaseUser as unknown as SupabaseUser);
      const stateAfterSecond = useAuth.getState();

      expect(stateAfterSecond.isLoggedIn).toBe(true);
      expect(stateAfterSecond.user).toEqual(stateAfterFirst.user);
      expect(stateAfterSecond.user?.id).toBe('test-user-1');
    });

    it('does nothing when setUser(null) is called and no user exists (idempotent)', () => {
      const { user, isLoggedIn } = useAuth.getState();
      expect(user).toBeNull();
      expect(isLoggedIn).toBe(false);

      const { setUser } = useAuth.getState();
      setUser(null);

      const afterNull = useAuth.getState();
      expect(afterNull.user).toBeNull();
      expect(afterNull.isLoggedIn).toBe(false);
    });

    it('clears user when setUser(null) is called after user was set', () => {
      const { setUser } = useAuth.getState();
      const supabaseUser = createMockSupabaseUser();

      setUser(supabaseUser as unknown as SupabaseUser);
      expect(useAuth.getState().isLoggedIn).toBe(true);

      setUser(null);
      const { user, isLoggedIn } = useAuth.getState();
      expect(user).toBeNull();
      expect(isLoggedIn).toBe(false);
    });
  });

  describe('logout', () => {
    it('calls supabase.auth.signOut and clears state', async () => {
      const { setUser, logout } = useAuth.getState();
      const supabaseUser = createMockSupabaseUser();
      setUser(supabaseUser as unknown as SupabaseUser);
      expect(useAuth.getState().isLoggedIn).toBe(true);

      await logout();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      const { user, isLoggedIn } = useAuth.getState();
      expect(user).toBeNull();
      expect(isLoggedIn).toBe(false);
    });

    it('does not clear state when signOut fails (server rejects)', async () => {
      mockSignOut.mockRejectedValueOnce(new Error('network error'));

      const { setUser, logout } = useAuth.getState();
      const supabaseUser = createMockSupabaseUser();
      setUser(supabaseUser as unknown as SupabaseUser);
      expect(useAuth.getState().isLoggedIn).toBe(true);

      await expect(logout()).rejects.toThrow('network error');

      const { user, isLoggedIn } = useAuth.getState();
      expect(user).not.toBeNull();
      expect(isLoggedIn).toBe(true);
    });
  });
});
