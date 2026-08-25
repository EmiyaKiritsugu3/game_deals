/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', fetchMock);

import PremiumPage from '@/app/premium/page';

beforeEach(() => {
  fetchMock.mockReset();
});

describe('PremiumPage', () => {
  it('renders benefits and CTA', () => {
    render(<PremiumPage />);
    expect(screen.getByRole('heading', { name: /premium/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /assinar/i })).toBeInTheDocument();
  });

  it('redirects to checkout url on success', async () => {
    const originalHref = window.location.href;
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ url: 'https://checkout.stripe.com/x' }), { status: 200 })
    );
    Reflect.deleteProperty(window, 'location');
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
      configurable: true,
    });
    const user = userEvent.setup();
    render(<PremiumPage />);
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(window.location.href).toBe('https://checkout.stripe.com/x'));
  });

  it('shows error message when checkout fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }));
    const user = userEvent.setup();
    render(<PremiumPage />);
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText(/não foi possível/i)).toBeInTheDocument());
  });
});
