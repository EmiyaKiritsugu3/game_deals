/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react', () => ({
  BellRing: (props: Record<string, unknown>) => <div data-testid="bell-ring-icon" {...props} />,
}));

const mockHasAlert = vi.fn().mockReturnValue(false);
vi.mock('@/store/alertStore', () => ({
  useAlerts: vi.fn(() => ({ hasAlert: mockHasAlert })),
}));

import PriceAlertBadge from './PriceAlertBadge';

describe('PriceAlertBadge', () => {
  beforeEach(() => {
    mockHasAlert.mockReturnValue(false);
  });

  it('returns null when no alert exists for gameID', () => {
    const { container } = render(<PriceAlertBadge gameID="123" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when alert exists for gameID', () => {
    mockHasAlert.mockReturnValue(true);
    render(<PriceAlertBadge gameID="123" />);
    expect(screen.getByTestId('bell-ring-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockHasAlert.mockReturnValue(true);
    const { container } = render(<PriceAlertBadge gameID="123" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has correct title attribute', () => {
    mockHasAlert.mockReturnValue(true);
    render(<PriceAlertBadge gameID="123" />);
    expect(screen.getByTitle(/active price alert/)).toBeInTheDocument();
  });
});
