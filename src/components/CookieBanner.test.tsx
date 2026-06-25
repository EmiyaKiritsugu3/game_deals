/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CookieBanner from './CookieBanner';

describe('CookieBanner', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        get length() {
          return Object.keys(store).length;
        },
        key: vi.fn((_i: number) => null),
      },
      writable: true,
    });
  });

  it('shows banner when no consent stored', () => {
    render(<CookieBanner />);
    expect(screen.getByText(/We use cookies/)).toBeInTheDocument();
  });

  it('hides banner when consent already stored', () => {
    store.gd_cookie_consent = 'accepted';
    const { container } = render(<CookieBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('accept stores accepted and hides banner', () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByText('Accept'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('gd_cookie_consent', 'accepted');
  });

  it('reject stores rejected and hides banner', () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByText('Reject'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('gd_cookie_consent', 'rejected');
  });

  it('links to privacy policy', () => {
    render(<CookieBanner />);
    const link = screen.getByText('Privacy Policy.');
    expect(link).toHaveAttribute('href', '/privacy');
  });
});
