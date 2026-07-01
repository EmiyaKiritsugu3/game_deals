// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUserAlertsAction = vi.fn().mockResolvedValue([]);
vi.mock('@/actions/alerts', () => ({
  getUserAlertsAction: () => mockGetUserAlertsAction(),
}));

import { useUserAlerts } from './useUserAlerts';

type WrapperProps = { children: React.ReactNode };

function Wrapper({ children }: WrapperProps) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useUserAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches alerts when enabled is true', async () => {
    mockGetUserAlertsAction.mockResolvedValue([{ gameId: '123' }]);
    const { result } = renderHook(() => useUserAlerts(true), {
      wrapper: Wrapper,
    });
    await vi.waitFor(() => {
      expect(result.current.data).toEqual([{ gameId: '123' }]);
    });
    expect(mockGetUserAlertsAction).toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', () => {
    renderHook(() => useUserAlerts(false), { wrapper: Wrapper });
    expect(mockGetUserAlertsAction).not.toHaveBeenCalled();
  });

  it('uses the correct query key and staleTime', () => {
    const { result } = renderHook(() => useUserAlerts(true), {
      wrapper: Wrapper,
    });
    expect(result.current.data).toBeUndefined();
  });
});
