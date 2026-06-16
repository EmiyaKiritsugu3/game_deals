/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PriceAlertWithGame } from '@/types/price-alert';

const mockAlert: PriceAlertWithGame = {
  id: 'a-1',
  userId: 'u-1',
  gameId: 'g-1',
  targetPrice: 9.99,
  storeId: 'steam',
  isActive: 1,
  currentPrice: 7.5,
  lastCheckedAt: null,
  createdAt: new Date('2026-06-15'),
  title: 'Test Game',
  thumbUrl: 'https://example.com/thumb.jpg',
  cheapshark_id: 'cs-1',
};

const mocks = vi.hoisted(() => ({
  queryMock: vi.fn(),
  mutationMock: vi.fn(),
  invalidateMock: vi.fn(),
  removeAlertMock: vi.fn(),
  authState: { isLoggedIn: false },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.queryMock,
  useMutation: mocks.mutationMock,
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateMock }),
}));

vi.mock('@/actions/alerts', () => ({
  getUserAlertsAction: vi.fn(),
  deletePriceAlertAction: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({ isLoggedIn: mocks.authState.isLoggedIn }),
}));

vi.mock('@/store/alertStore', () => ({
  useAlerts: () => ({ removeAlert: mocks.removeAlertMock }),
}));

function makeMutationResult(overrides?: Record<string, unknown>) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    data: null,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    variables: null,
    reset: vi.fn(),
    status: 'idle' as const,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    ...overrides,
  };
}

function setQueryResult(overrides: Record<string, unknown>) {
  mocks.queryMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    isPending: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  });
}

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState.isLoggedIn = false;
    // Provide a default return value for useQuery so the component doesn't crash
    mocks.queryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    // Provide a default return value for useMutation
    mocks.mutationMock.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      data: null,
      error: null,
      isError: false,
      isSuccess: false,
      isIdle: true,
      variables: null,
      reset: vi.fn(),
      status: 'idle' as const,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
    });
  });

  it('1. renders SignInPrompt when not logged in', async () => {
    const AlertsPage = (await import('@/app/alerts/page')).default;
    render(<AlertsPage />);
    expect(screen.getByText('Sign in to see your alerts')).toBeInTheDocument();
  });

  it('2. renders LoadingState when query is in-flight', async () => {
    mocks.authState.isLoggedIn = true;
    setQueryResult({ isLoading: true });
    mocks.mutationMock.mockReturnValue(makeMutationResult());

    const AlertsPage = (await import('@/app/alerts/page')).default;
    render(<AlertsPage />);
    expect(screen.getByText('Loading alerts\u2026')).toBeInTheDocument();
  });

  it('3. renders ErrorState when query errors', async () => {
    mocks.authState.isLoggedIn = true;
    setQueryResult({ isError: true, error: new Error('Database connection failed') });
    mocks.mutationMock.mockReturnValue(makeMutationResult());

    const AlertsPage = (await import('@/app/alerts/page')).default;
    render(<AlertsPage />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('4. renders EmptyState when alerts array is empty', async () => {
    mocks.authState.isLoggedIn = true;
    setQueryResult({ data: [], isSuccess: true });
    mocks.mutationMock.mockReturnValue(makeMutationResult());

    const AlertsPage = (await import('@/app/alerts/page')).default;
    render(<AlertsPage />);
    expect(screen.getByText('No price alerts yet')).toBeInTheDocument();
  });

  it('5. renders alert cards when alerts are populated', async () => {
    mocks.authState.isLoggedIn = true;
    setQueryResult({ data: [mockAlert], isSuccess: true });
    mocks.mutationMock.mockReturnValue(makeMutationResult());

    const AlertsPage = (await import('@/app/alerts/page')).default;
    render(<AlertsPage />);

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('1 alert active')).toBeInTheDocument();
    expect(screen.getByText('View Game')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('6. calls deleteMutation.mutate with correct params on Remove click', async () => {
    mocks.authState.isLoggedIn = true;
    setQueryResult({ data: [mockAlert], isSuccess: true });
    const mutate = vi.fn();
    mocks.mutationMock.mockReturnValue(makeMutationResult({ mutate }));

    const AlertsPage = (await import('@/app/alerts/page')).default;
    render(<AlertsPage />);

    const removeBtn = screen.getByRole('button', { name: /Delete alert for/ });
    fireEvent.click(removeBtn);

    expect(mutate).toHaveBeenCalledWith({ alertId: 'a-1', cheapsharkId: 'cs-1' });
  });

  it('7. shows error banner when mutation fails', async () => {
    mocks.authState.isLoggedIn = true;
    setQueryResult({ data: [mockAlert], isSuccess: true });

    let capturedOnError: ((err: Error) => void) | undefined;
    mocks.mutationMock.mockImplementation((options: { onError?: (err: Error) => void }) => {
      capturedOnError = options.onError;
      return makeMutationResult();
    });

    const AlertsPage = (await import('@/app/alerts/page')).default;
    render(<AlertsPage />);

    const onError = capturedOnError;
    if (onError) {
      act(() => {
        onError(new Error('Server error'));
      });
    }

    await waitFor(() => {
      expect(screen.getByText(/Failed to remove alert/)).toBeInTheDocument();
    });
  });

  it('8. calls removeAlert on successful delete', async () => {
    mocks.authState.isLoggedIn = true;
    setQueryResult({ data: [mockAlert], isSuccess: true });

    let capturedOnSuccess: ((_data: unknown, params: { cheapsharkId: string }) => void) | undefined;
    const mutate = vi.fn((params: { cheapsharkId: string }) => {
      if (capturedOnSuccess) capturedOnSuccess(null, params);
    });
    mocks.mutationMock.mockImplementation(
      (options: { onSuccess?: (_data: unknown, params: { cheapsharkId: string }) => void }) => {
        capturedOnSuccess = options.onSuccess;
        return makeMutationResult({ mutate });
      }
    );

    const AlertsPage = (await import('@/app/alerts/page')).default;
    render(<AlertsPage />);

    const removeBtn = screen.getByRole('button', { name: /Delete alert for/ });
    fireEvent.click(removeBtn);

    expect(mocks.removeAlertMock).toHaveBeenCalledWith('cs-1');
  });
});
