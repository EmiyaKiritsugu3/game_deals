// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockOnAuthStateChange, mockUnsubscribe } = vi.hoisted(() => ({
  mockOnAuthStateChange: vi.fn(),
  mockUnsubscribe: vi.fn(),
}));

vi.mock('@/lib/supabase-browser', () => ({
  getBrowserClient: () => ({
    auth: { onAuthStateChange: mockOnAuthStateChange },
  }),
}));

const mockSetUser = vi.fn();
vi.mock('@/store/authStore', () => ({
  useAuth: () => ({ setUser: mockSetUser }),
}));

import { useAuthSubscription } from './useAuthSubscription';

describe('useAuthSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes to onAuthStateChange on mount', () => {
    renderHook(() => useAuthSubscription());
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAuthSubscription());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('calls setUser when session has a user', () => {
    renderHook(() => useAuthSubscription());
    const callback = mockOnAuthStateChange.mock.calls[0][0];
    const user = { id: 'u1', email: 'test@test.com' };
    act(() => {
      callback('SIGNED_IN', { user });
    });
    expect(mockSetUser).toHaveBeenCalledWith(user);
  });

  it('calls setUser(null) when session has no user', () => {
    renderHook(() => useAuthSubscription());
    const callback = mockOnAuthStateChange.mock.calls[0][0];
    act(() => {
      callback('SIGNED_OUT', null);
    });
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });
});
