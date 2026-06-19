/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PriceAlert } from '@/types/price-alert';

vi.mock('@/store/alertStore', () => ({
  useAlerts: vi.fn(),
}));

vi.mock('@/actions/alerts', () => ({
  createPriceAlertAction: vi.fn(),
  deletePriceAlertAction: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children?: ReactNode } & HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

import { createPriceAlertAction, deletePriceAlertAction } from '@/actions/alerts';
import { useAlerts } from '@/store/alertStore';
import PriceAlertModal from './PriceAlertModal';

const mockAddAlert = vi.fn();
const mockRemoveAlert = vi.fn();
const mockHasAlert = vi.fn().mockReturnValue(false);
const mockGetAlert = vi.fn().mockReturnValue(undefined);

function createMockStore(overrides?: Partial<ReturnType<typeof useAlerts>>) {
  return {
    alerts: [],
    addAlert: mockAddAlert,
    removeAlert: mockRemoveAlert,
    hasAlert: mockHasAlert,
    getAlert: mockGetAlert,
    setAlertId: vi.fn(),
    ...overrides,
  };
}

describe('PriceAlertModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasAlert.mockReturnValue(false);
    mockGetAlert.mockReturnValue(undefined);
    vi.mocked(useAlerts).mockReturnValue(createMockStore());
  });

  it('renders with game title and heading', () => {
    render(
      <PriceAlertModal
        isOpen={true}
        onClose={vi.fn()}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    expect(screen.getByText('Set Price Alert')).toBeInTheDocument();
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('shows "Create Alert" button when no alert exists', () => {
    render(
      <PriceAlertModal
        isOpen={true}
        onClose={vi.fn()}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    expect(screen.getByText('Create Alert')).toBeInTheDocument();
  });

  it('shows "Update Alert" and remove button when alert already exists', () => {
    mockHasAlert.mockReturnValue(true);
    mockGetAlert.mockReturnValue({
      gameID: 'game-1',
      gameTitle: 'Test Game',
      targetPrice: 39.99,
      currentPrice: 59.99,
      isKeyshopAllowed: true,
      alertId: 'alert-1',
      createdAt: Date.now(),
    });
    vi.mocked(useAlerts).mockReturnValue(createMockStore());

    render(
      <PriceAlertModal
        isOpen={true}
        onClose={vi.fn()}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    expect(screen.getByText('Update Alert')).toBeInTheDocument();
    expect(screen.getByText('Stop tracking this game')).toBeInTheDocument();
  });

  it('disables buttons and shows "Saving…" when isSaving is true', () => {
    mockHasAlert.mockReturnValue(true);
    mockGetAlert.mockReturnValue({
      gameID: 'game-1',
      gameTitle: 'Test Game',
      targetPrice: 39.99,
      currentPrice: 59.99,
      isKeyshopAllowed: true,
      alertId: 'alert-1',
      createdAt: Date.now(),
    });
    vi.mocked(useAlerts).mockReturnValue(createMockStore());

    const mockCreate = vi.mocked(createPriceAlertAction);
    // Keep the promise pending so isSaving stays true
    mockCreate.mockReturnValueOnce(new Promise(() => {}));

    render(
      <PriceAlertModal
        isOpen={true}
        onClose={vi.fn()}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    fireEvent.click(screen.getByText('Update Alert'));

    expect(screen.getByText('Saving\u2026')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <PriceAlertModal
        isOpen={true}
        onClose={onClose}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls createPriceAlertAction and addAlert when save is clicked', async () => {
    const onClose = vi.fn();
    const mockCreate = vi.mocked(createPriceAlertAction);
    mockCreate.mockResolvedValueOnce({ id: 'alert-new-1' });

    render(
      <PriceAlertModal
        isOpen={true}
        onClose={onClose}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    fireEvent.click(screen.getByText('Create Alert'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith('game-1', expect.any(Number));
    });

    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        gameID: 'game-1',
        gameTitle: 'Test Game',
        alertId: 'alert-new-1',
      })
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows error message when save fails', async () => {
    const mockCreate = vi.mocked(createPriceAlertAction);
    mockCreate.mockRejectedValueOnce(new Error('Network error'));

    render(
      <PriceAlertModal
        isOpen={true}
        onClose={vi.fn()}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    fireEvent.click(screen.getByText('Create Alert'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('dismisses error when Dismiss button is clicked', async () => {
    const mockCreate = vi.mocked(createPriceAlertAction);
    mockCreate.mockRejectedValueOnce(new Error('Network error'));

    render(
      <PriceAlertModal
        isOpen={true}
        onClose={vi.fn()}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    fireEvent.click(screen.getByText('Create Alert'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dismiss'));

    expect(screen.queryByText('Network error')).not.toBeInTheDocument();
  });

  it('calls removeAlert and onClose when remove is clicked with no alertId', async () => {
    const onClose = vi.fn();
    mockHasAlert.mockReturnValue(true);
    mockGetAlert.mockReturnValue({
      gameID: 'game-1',
      gameTitle: 'Test Game',
      targetPrice: 39.99,
      currentPrice: 59.99,
      isKeyshopAllowed: true,
      // no alertId — early return path
      createdAt: Date.now(),
    } as PriceAlert);
    vi.mocked(useAlerts).mockReturnValue(createMockStore());

    render(
      <PriceAlertModal
        isOpen={true}
        onClose={onClose}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    fireEvent.click(screen.getByText('Stop tracking this game'));

    await waitFor(() => {
      expect(mockRemoveAlert).toHaveBeenCalledWith('game-1');
    });
    expect(onClose).toHaveBeenCalledOnce();
    expect(deletePriceAlertAction).not.toHaveBeenCalled();
  });

  it('calls deletePriceAlertAction when remove is clicked with alertId', async () => {
    const onClose = vi.fn();
    mockHasAlert.mockReturnValue(true);
    mockGetAlert.mockReturnValue({
      gameID: 'game-1',
      gameTitle: 'Test Game',
      targetPrice: 39.99,
      currentPrice: 59.99,
      isKeyshopAllowed: true,
      alertId: 'alert-existing-1',
      createdAt: Date.now(),
    });
    vi.mocked(useAlerts).mockReturnValue(createMockStore());

    const mockDelete = vi.mocked(deletePriceAlertAction);
    mockDelete.mockResolvedValueOnce(true);

    render(
      <PriceAlertModal
        isOpen={true}
        onClose={onClose}
        gameID="game-1"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );

    fireEvent.click(screen.getByText('Stop tracking this game'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('alert-existing-1');
    });
    expect(mockRemoveAlert).toHaveBeenCalledWith('game-1');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
