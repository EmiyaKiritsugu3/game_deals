/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from '@/components/Navbar';

const mocks = vi.hoisted(() => {
  const store: {
    setUser: ReturnType<typeof vi.fn>;
    user: { id: string; name: string; email: string; avatar: string } | null;
    isLoggedIn: boolean;
  } = {
    setUser: vi.fn(),
    user: null,
    isLoggedIn: false,
  };
  return store;
});

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({
    user: mocks.user,
    isLoggedIn: mocks.isLoggedIn,
    setUser: mocks.setUser,
  }),
}));

vi.mock('@/hooks/useAuthSubscription', () => ({ useAuthSubscription: vi.fn() }));
vi.mock('@/components/AuthModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? React.createElement('div', { 'data-testid': 'auth-modal' }, 'AuthModal') : null,
}));
vi.mock('@/components/NotificationBell', () => ({
  default: () => React.createElement('div', { 'data-testid': 'notification-bell' }),
}));
vi.mock('@/components/WishlistIndicator', () => ({
  default: () => React.createElement('div', { 'data-testid': 'wishlist-indicator' }),
}));
vi.mock('@/components/navbar/AuthSection', () => ({
  AuthSection: ({ onLoginClickAction }: { onLoginClickAction: () => void }) =>
    React.createElement(
      'button',
      { type: 'button', 'data-testid': 'auth-section', onClick: onLoginClickAction },
      'Sign In'
    ),
}));
vi.mock('@/components/navbar/UserMenu', () => ({
  UserMenu: () => React.createElement('div', { 'data-testid': 'user-menu' }, 'User Menu'),
}));
vi.mock('@/components/navbar/SearchBox', () => ({
  SearchBox: () => React.createElement('div', { 'data-testid': 'search-box' }),
}));

vi.mock('@/components/ThemeToggle', () => ({
  default: () => React.createElement('button', { 'data-testid': 'theme-toggle' }, '🌙'),
}));
vi.mock('@/components/InstallPWAButton', () => ({
  default: () => React.createElement('div', { 'data-testid': 'install-pwa' }),
}));

vi.mock('@/components/Navbar.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css-class' }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => React.createElement('a', { href, className }, children),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('Navbar', () => {
  beforeEach(() => {
    mocks.setUser.mockReset();
    mocks.user = null;
    mocks.isLoggedIn = false;
  });

  it('renders logo and navigation links', () => {
    render(<Navbar />);

    const logo = screen.getByRole('link', { name: /GameDeals/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');

    expect(screen.getByRole('link', { name: /Bundles/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Collections/i })).toBeInTheDocument();
  });

  it('shows AuthSection when user is not logged in', () => {
    mocks.user = null;
    mocks.isLoggedIn = false;

    render(<Navbar />);

    expect(screen.getByTestId('auth-section')).toBeInTheDocument();
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('shows UserMenu when user is logged in', () => {
    mocks.user = { id: 'u1', name: 'Test', email: 'test@test.com', avatar: 'a.jpg' };
    mocks.isLoggedIn = true;

    render(<Navbar />);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-section')).not.toBeInTheDocument();
  });

  it('shows NotificationBell when user is logged in', () => {
    mocks.isLoggedIn = true;

    render(<Navbar />);

    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('does not show NotificationBell when user is not logged in', () => {
    mocks.isLoggedIn = false;

    render(<Navbar />);

    expect(screen.queryByTestId('notification-bell')).not.toBeInTheDocument();
  });

  it('opens AuthModal when AuthSection is clicked', () => {
    mocks.user = null;
    mocks.isLoggedIn = false;

    render(<Navbar />);

    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('auth-section'));

    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
  });

  it('renders SearchBox and WishlistIndicator always', () => {
    render(<Navbar />);

    expect(screen.getByTestId('search-box')).toBeInTheDocument();
    expect(screen.getByTestId('wishlist-indicator')).toBeInTheDocument();
  });

  it('renders ThemeToggle button', () => {
    render(<Navbar />);

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('calls setUser when serverUser is provided', () => {
    const serverUser = {
      id: 's1',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '',
    };

    render(<Navbar serverUser={serverUser} />);

    expect(mocks.setUser).toHaveBeenCalledWith(serverUser);
  });

  it('calls setUser(null) when serverUser is not provided', () => {
    render(<Navbar />);

    expect(mocks.setUser).toHaveBeenCalledWith(null);
  });

  it('serverUser is truthy overrides no local user', () => {
    mocks.user = null;
    mocks.isLoggedIn = false;

    const serverUser = {
      id: 'u2',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '',
    };

    render(<Navbar serverUser={serverUser} />);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-section')).not.toBeInTheDocument();
  });

  it('closes AuthModal on serverUser change', () => {
    mocks.user = null;
    mocks.isLoggedIn = false;

    const { rerender } = render(<Navbar />);

    fireEvent.click(screen.getByTestId('auth-section'));
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();

    rerender(
      <Navbar
        serverUser={{
          id: 'u3',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: '',
        }}
      />
    );

    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
  });
});
