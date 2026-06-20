/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, fill: _fill, sizes: _sizes, className: _className, ...rest } = props;
    return <img src={String(src)} alt={String(alt)} {...rest} />;
  },
}));

const mockBundles = [
  {
    id: 'test-bundle-1',
    name: 'Test Bundle',
    store: 'Test Store',
    storeIcon: 'https://example.com/icon.png',
    price: 9.99,
    totalValue: 49.99,
    expiresAt: '2099-12-31T00:00:00Z',
    tier: 'Standard',
    url: 'https://example.com/bundle',
    games: [
      { title: 'Game A', retailPrice: 29.99, thumb: 'https://example.com/a.jpg' },
      { title: 'Game B', retailPrice: 19.99, thumb: 'https://example.com/b.jpg' },
    ],
  },
  {
    id: 'test-bundle-2',
    name: 'Expiring Bundle',
    store: 'Other Store',
    storeIcon: 'https://example.com/icon2.png',
    price: 4.99,
    totalValue: 30.0,
    expiresAt: '2025-01-01T00:00:00Z',
    url: 'https://example.com/bundle2',
    games: [{ title: 'Game C', retailPrice: 30.0, thumb: 'https://example.com/c.jpg' }],
  },
];

vi.mock('@/data/bundles', () => ({
  BUNDLES: mockBundles,
}));

// Must import AFTER mocks
const { default: BundlesPage } = await import('./page');

describe('BundlesPage', () => {
  it('renders page title', () => {
    render(<BundlesPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('🎁 Game Bundles');
  });

  it('renders description', () => {
    render(<BundlesPage />);
    expect(screen.getByText(/Multi-game packages/)).toBeInTheDocument();
  });

  it('renders bundle cards', () => {
    render(<BundlesPage />);
    expect(screen.getByText('Test Bundle')).toBeInTheDocument();
    expect(screen.getByText('Expiring Bundle')).toBeInTheDocument();
  });

  it('shows savings percentage', () => {
    render(<BundlesPage />);
    // Bundle 1: (49.99 - 9.99) / 49.99 * 100 = 80%
    expect(screen.getByText(/-80%/)).toBeInTheDocument();
  });

  it('shows bundle price', () => {
    render(<BundlesPage />);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$4.99')).toBeInTheDocument();
  });

  it('shows "days left" for future bundles', () => {
    render(<BundlesPage />);
    expect(screen.getByText(/days left/)).toBeInTheDocument();
  });

  it('shows "Expiring soon" for past bundles', () => {
    render(<BundlesPage />);
    expect(screen.getByText(/Expiring soon/)).toBeInTheDocument();
  });
});
