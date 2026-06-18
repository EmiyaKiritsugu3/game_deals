/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PriceAlertWithGame } from '@/types/price-alert';
import AlertCard from './AlertCard';

const baseAlert: PriceAlertWithGame = {
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

describe('AlertCard', () => {
  it('renders game title and target price', () => {
    render(
      <AlertCard alert={baseAlert} onDelete={vi.fn()} isDeleting={false} />,
    );

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('shows formatted current price', () => {
    render(
      <AlertCard alert={baseAlert} onDelete={vi.fn()} isDeleting={false} />,
    );

    expect(screen.getByText('$7.50')).toBeInTheDocument();
  });

  it('shows store name when storeId is present', () => {
    render(
      <AlertCard alert={baseAlert} onDelete={vi.fn()} isDeleting={false} />,
    );

    expect(screen.getByText(/Store: steam/)).toBeInTheDocument();
  });

  it('renders remove button and calls onDelete when clicked', () => {
    const onDelete = vi.fn();
    render(
      <AlertCard alert={baseAlert} onDelete={onDelete} isDeleting={false} />,
    );

    const removeBtn = screen.getByRole('button', { name: /Delete alert for/ });
    fireEvent.click(removeBtn);

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows "Removing…" when isDeleting is true and disables button', () => {
    render(
      <AlertCard alert={baseAlert} onDelete={vi.fn()} isDeleting={true} />,
    );

    const removeBtn = screen.getByRole('button', { name: /Delete alert for/ });
    expect(removeBtn).toBeDisabled();
    expect(screen.getByText('Removing\u2026')).toBeInTheDocument();
  });

  it('renders View Game link when cheapshark_id exists', () => {
    render(
      <AlertCard alert={baseAlert} onDelete={vi.fn()} isDeleting={false} />,
    );

    const link = screen.getByRole('link', { name: 'View Game' });
    expect(link).toHaveAttribute('href', '/game/cs-1');
  });

  it('shows "Unavailable" when cheapshark_id is empty', () => {
    const alertNoCs: PriceAlertWithGame = {
      ...baseAlert,
      cheapshark_id: '',
    };
    render(
      <AlertCard alert={alertNoCs} onDelete={vi.fn()} isDeleting={false} />,
    );

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('shows "Monitoring" status', () => {
    render(
      <AlertCard alert={baseAlert} onDelete={vi.fn()} isDeleting={false} />,
    );

    expect(screen.getByText('Monitoring')).toBeInTheDocument();
  });

  it('renders N/A when currentPrice is null', () => {
    const alertNoPrice: PriceAlertWithGame = {
      ...baseAlert,
      currentPrice: null,
    };
    render(
      <AlertCard alert={alertNoPrice} onDelete={vi.fn()} isDeleting={false} />,
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
