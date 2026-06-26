/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react', () => ({
  Bell: (props: Record<string, unknown>) => <div data-testid="bell-icon" {...props} />,
  BellRing: (props: Record<string, unknown>) => <div data-testid="bell-ring-icon" {...props} />,
}));

const mockHasAlert = vi.hoisted(() => vi.fn().mockReturnValue(false));

vi.mock('@/store/alertStore', () => ({
  useAlerts: vi.fn(() => ({ hasAlert: mockHasAlert })),
}));

const mockUseAuth = vi.hoisted(() => vi.fn(() => ({ isLoggedIn: false })));

vi.mock('@/store/authStore', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('./AuthModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="auth-modal" /> : null),
}));

vi.mock('./PriceAlertModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="alert-modal" /> : null),
}));

import PriceAlertTrigger from './PriceAlertTrigger';

const defaultProps = {
  gameID: '123',
  gameTitle: 'Test Game',
  currentPrice: 9.99,
};

describe('PriceAlertTrigger', () => {
  beforeEach(() => {
    mockHasAlert.mockReturnValue(false);
    mockUseAuth.mockReturnValue({ isLoggedIn: false });
  });

  it('renders button with data-testid', () => {
    render(<PriceAlertTrigger {...defaultProps} />);
    expect(screen.getByTestId('price-alert-trigger')).toBeInTheDocument();
  });

  it('shows "Alert Me" when no alert exists', () => {
    render(<PriceAlertTrigger {...defaultProps} />);
    expect(screen.getByText('Alert Me')).toBeInTheDocument();
  });

  it('shows "Alert Active" when alert exists', () => {
    mockHasAlert.mockReturnValue(true);
    render(<PriceAlertTrigger {...defaultProps} />);
    expect(screen.getByText('Alert Active')).toBeInTheDocument();
  });

  it('shows Bell icon when no alert', () => {
    render(<PriceAlertTrigger {...defaultProps} />);
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('shows BellRing icon when alert exists', () => {
    mockHasAlert.mockReturnValue(true);
    render(<PriceAlertTrigger {...defaultProps} />);
    expect(screen.getByTestId('bell-ring-icon')).toBeInTheDocument();
  });

  it('has title "Set Price Alert" when no alert', () => {
    render(<PriceAlertTrigger {...defaultProps} />);
    expect(screen.getByTitle('Set Price Alert')).toBeInTheDocument();
  });

  it('has title "Edit Price Alert" when alert exists', () => {
    mockHasAlert.mockReturnValue(true);
    render(<PriceAlertTrigger {...defaultProps} />);
    expect(screen.getByTitle('Edit Price Alert')).toBeInTheDocument();
  });

  it('applies custom className to button', () => {
    const { container } = render(<PriceAlertTrigger {...defaultProps} className="custom-cls" />);
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-cls');
  });

  describe('click opens correct modal', () => {
    it('opens AuthModal when not logged in', async () => {
      const user = userEvent.setup();
      render(<PriceAlertTrigger {...defaultProps} />);

      await user.click(screen.getByTestId('price-alert-trigger'));

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    it('opens PriceAlertModal when logged in', async () => {
      mockUseAuth.mockReturnValue({ isLoggedIn: true });
      const user = userEvent.setup();
      render(<PriceAlertTrigger {...defaultProps} />);

      await user.click(screen.getByTestId('price-alert-trigger'));

      expect(screen.getByTestId('alert-modal')).toBeInTheDocument();
    });

    it('does not open AuthModal when logged in', async () => {
      mockUseAuth.mockReturnValue({ isLoggedIn: true });
      const user = userEvent.setup();
      render(<PriceAlertTrigger {...defaultProps} />);

      await user.click(screen.getByTestId('price-alert-trigger'));

      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    });

    it('does not open PriceAlertModal when not logged in', async () => {
      const user = userEvent.setup();
      render(<PriceAlertTrigger {...defaultProps} />);

      await user.click(screen.getByTestId('price-alert-trigger'));

      expect(screen.queryByTestId('alert-modal')).not.toBeInTheDocument();
    });
  });
});
