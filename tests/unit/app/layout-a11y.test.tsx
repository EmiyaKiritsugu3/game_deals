/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));
vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-inter' }),
}));
vi.mock('nuqs/adapters/next/app', () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/CookieBanner', () => ({ default: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/SyncManager', () => ({ default: () => null }));
vi.mock('@/providers/ReactQueryProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('next/headers', () => ({
  headers: () => new Map(),
}));

describe('Layout accessibility', () => {
  it('has a skip-to-content link targeting main-content', async () => {
    const { default: RootLayout } = await import('@/app/layout');

    const layout = await RootLayout({
      children: <div>Page content</div>,
      modal: null,
    });

    render(layout);

    const skipLink = screen.getByRole('link', { name: /skip to content|skip to main/i });
    expect(skipLink).toHaveAttribute('href', '#main-content');

    const main = document.querySelector('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });
});
