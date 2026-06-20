/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WishlistTabs from './WishlistTabs';

const cssProxy = vi.hoisted(
  () => new Proxy({}, { get: (_: unknown, k: string) => (typeof k === 'string' ? k : '') })
);

vi.mock('./WishlistTabs.module.css', () => ({ default: cssProxy }));

const defaultProps = {
  activeTab: 'wishlist' as const,
  onTabChange: vi.fn(),
  wishlistCount: 5,
  alertsCount: 3,
};

describe('WishlistTabs', () => {
  it('renders both tab buttons with counts', () => {
    render(<WishlistTabs {...defaultProps} />);
    expect(screen.getByText('Wishlist (5)')).toBeInTheDocument();
    expect(screen.getByText('My Alerts (3)')).toBeInTheDocument();
  });

  it('calls onTabChange with "wishlist" when wishlist tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<WishlistTabs {...defaultProps} onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText('Wishlist (5)'));
    expect(onTabChange).toHaveBeenCalledWith('wishlist');
  });

  it('calls onTabChange with "alerts" when alerts tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<WishlistTabs {...defaultProps} onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText('My Alerts (3)'));
    expect(onTabChange).toHaveBeenCalledWith('alerts');
  });

  it('applies activeTab class to the active tab', () => {
    render(<WishlistTabs {...defaultProps} activeTab="wishlist" />);
    const wishlistBtn = screen.getByText('Wishlist (5)').closest('button');
    const alertsBtn = screen.getByText('My Alerts (3)').closest('button');

    expect(wishlistBtn?.className).toContain('activeTab');
    expect(alertsBtn?.className).not.toContain('activeTab');
  });

  it('applies activeTab class to alerts when activeTab is alerts', () => {
    render(<WishlistTabs {...defaultProps} activeTab="alerts" />);
    const alertsBtn = screen.getByText('My Alerts (3)').closest('button');
    const wishlistBtn = screen.getByText('Wishlist (5)').closest('button');

    expect(alertsBtn?.className).toContain('activeTab');
    expect(wishlistBtn?.className).not.toContain('activeTab');
  });

  it('shows zero counts correctly', () => {
    render(<WishlistTabs {...defaultProps} wishlistCount={0} alertsCount={0} />);
    expect(screen.getByText('Wishlist (0)')).toBeInTheDocument();
    expect(screen.getByText('My Alerts (0)')).toBeInTheDocument();
  });

  it('renders two buttons with correct roles', () => {
    render(<WishlistTabs {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('has accessible button elements', () => {
    render(<WishlistTabs {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.tagName).toBe('BUTTON');
    });
  });
});
