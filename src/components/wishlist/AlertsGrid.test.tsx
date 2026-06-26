/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PriceAlert } from '@/types/price-alert';
import AlertsGrid from './AlertsGrid';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/store/alertStore', () => ({
  useAlerts: () => ({
    hasAlert: () => true,
  }),
}));

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({
    isLoggedIn: true,
    user: { id: 'u1', name: 'Test', email: 'test@test.com', avatar: '' },
  }),
}));

vi.mock('@/components/PriceAlertModal', () => ({
  default: () => null,
}));

vi.mock('@/components/AuthModal', () => ({
  default: () => null,
}));

const cssProxy = vi.hoisted(
  () => new Proxy({}, { get: (_: unknown, k: string) => (typeof k === 'string' ? k : '') })
);

vi.mock('./AlertsGrid.module.css', () => ({ default: cssProxy }));
vi.mock('@/components/PriceAlertModal.module.css', () => ({ default: cssProxy }));

const makeAlert = (overrides: Partial<PriceAlert> = {}): PriceAlert => ({
  gameID: 'g1',
  gameTitle: 'Test Game',
  targetPrice: 9.99,
  currentPrice: 14.99,
  isKeyshopAllowed: true,
  createdAt: Date.now(),
  ...overrides,
});

describe('AlertsGrid', () => {
  it('shows empty state when alerts array is empty', () => {
    render(<AlertsGrid alerts={[]} />);
    expect(screen.getByText('No alerts configured')).toBeInTheDocument();
    expect(screen.getByText(/Open any game page/)).toBeInTheDocument();
  });

  it('renders alert cards when alerts are provided', () => {
    const alerts = [makeAlert(), makeAlert({ gameID: 'g2', gameTitle: 'Game Two' })];
    render(<AlertsGrid alerts={alerts} />);

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('Game Two')).toBeInTheDocument();
  });

  it('shows target and current prices', () => {
    render(<AlertsGrid alerts={[makeAlert()]} />);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$14.99')).toBeInTheDocument();
  });

  it('shows "Includes Keyshops" when isKeyshopAllowed is true', () => {
    render(<AlertsGrid alerts={[makeAlert({ isKeyshopAllowed: true })]} />);
    expect(screen.getByText('✅ Includes Keyshops')).toBeInTheDocument();
  });

  it('shows "Official Only" when isKeyshopAllowed is false', () => {
    render(<AlertsGrid alerts={[makeAlert({ isKeyshopAllowed: false })]} />);
    expect(screen.getByText('❌ Official Only')).toBeInTheDocument();
  });

  it('renders PriceAlertTrigger for each alert', () => {
    render(<AlertsGrid alerts={[makeAlert()]} />);
    expect(screen.getByTestId('price-alert-trigger')).toBeInTheDocument();
  });

  it('renders "View Game" link with correct href', () => {
    render(<AlertsGrid alerts={[makeAlert()]} />);
    const link = screen.getByRole('link', { name: 'View Game' });
    expect(link).toHaveAttribute('href', '/game/g1');
  });

  it('shows "Active Monitoring" status', () => {
    render(<AlertsGrid alerts={[makeAlert()]} />);
    expect(screen.getByText('Active Monitoring')).toBeInTheDocument();
  });

  it('renders multiple alerts with different prices', () => {
    const alerts = [
      makeAlert({ gameID: 'g1', gameTitle: 'Game One', targetPrice: 5, currentPrice: 8 }),
      makeAlert({
        gameID: 'g2',
        gameTitle: 'Game Two',
        targetPrice: 3,
        currentPrice: 6,
        isKeyshopAllowed: false,
      }),
    ];
    render(<AlertsGrid alerts={alerts} />);
    expect(screen.getByText('Game One')).toBeInTheDocument();
    expect(screen.getByText('Game Two')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('$8.00')).toBeInTheDocument();
  });
});
