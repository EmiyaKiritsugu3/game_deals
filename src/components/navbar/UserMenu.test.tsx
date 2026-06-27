/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserMenu } from './UserMenu';

const mockLogout = vi.fn();

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

vi.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: (callback: () => void) => {
    const { useRef, useEffect } = require('react');
    const ref = useRef(null);
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) callback();
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [callback]);
    return ref;
  },
}));

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} width={props.width} height={props.height} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const defaultProps = {
  user: { id: 'u1', name: 'TestUser', email: 'test@example.com', avatar: '/avatar.png' },
  serverUser: null,
};

describe('UserMenu', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('renders username from user prop', () => {
    render(<UserMenu {...defaultProps} />);
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('renders avatar image from user prop', () => {
    render(<UserMenu {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'TestUser' });
    expect(img).toHaveAttribute('src', '/avatar.png');
  });

  it('dropdown is hidden by default', () => {
    render(<UserMenu {...defaultProps} />);
    expect(screen.queryByText('Playlists')).not.toBeInTheDocument();
    expect(screen.queryByText('Price Alerts')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows dropdown with links on button click', () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Playlists')).toBeInTheDocument();
    expect(screen.getByText('Price Alerts')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('closes dropdown on second click', () => {
    render(<UserMenu {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Playlists')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText('Playlists')).not.toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('links to /playlists and /wishlist in dropdown', () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    const playlistsLink = screen.getByRole('link', { name: /Playlists/ });
    expect(playlistsLink).toHaveAttribute('href', '/playlists');

    const alertsLink = screen.getByRole('link', { name: /Price Alerts/ });
    expect(alertsLink).toHaveAttribute('href', '/wishlist');
  });

  it('falls back to serverUser metadata when user is null', () => {
    const serverUser = {
      id: 's1',
      user_metadata: { full_name: 'ServerName', avatar_url: '/server-avatar.png' },
    } as never;
    render(<UserMenu user={null} serverUser={serverUser} />);
    expect(screen.getByText('ServerName')).toBeInTheDocument();
    const img = screen.getByRole('img', { name: 'ServerName' });
    expect(img).toHaveAttribute('src', '/server-avatar.png');
  });

  it('falls back to "User" when serverUser has no full_name', () => {
    const serverUser = {
      id: 's2',
      user_metadata: {},
    } as never;
    render(<UserMenu user={null} serverUser={serverUser} />);
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('falls back to empty string avatar when neither has avatar', () => {
    const userNoAvatar = { ...defaultProps.user, avatar: '' };
    const serverUser = {
      id: 's3',
      user_metadata: {},
    } as never;
    render(<UserMenu user={userNoAvatar} serverUser={serverUser} />);
    const img = screen.getByRole('img', { name: 'TestUser' });
    // jsdom omits src attribute when value is empty string; component still renders
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src') || '').toBe('');
  });

  it('user prop takes priority over serverUser', () => {
    const serverUser = {
      id: 's4',
      user_metadata: { full_name: 'ServerUser', avatar_url: '/server.png' },
    } as never;
    render(<UserMenu user={defaultProps.user} serverUser={serverUser} />);
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.queryByText('ServerUser')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside the menu', () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Playlists')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Playlists')).not.toBeInTheDocument();
  });

  it('does not close dropdown when clicking inside', () => {
    render(<UserMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.mouseDown(screen.getByText('Playlists'));
    expect(screen.getByText('Playlists')).toBeInTheDocument();
  });

  it('has aria-haspopup="true" on the button', () => {
    render(<UserMenu {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'true');
  });

  it('aria-expanded reflects dropdown state', () => {
    render(<UserMenu {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens dropdown on Enter key', () => {
    render(<UserMenu {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByText('Playlists')).toBeInTheDocument();
  });

  it('opens dropdown on Space key', () => {
    render(<UserMenu {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });
    expect(screen.getByText('Playlists')).toBeInTheDocument();
  });

  it('closes dropdown on Escape key', () => {
    render(<UserMenu {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Playlists')).toBeInTheDocument();

    fireEvent.keyDown(button, { key: 'Escape' });
    expect(screen.queryByText('Playlists')).not.toBeInTheDocument();
  });

  it('toggles dropdown on repeated Enter key', () => {
    render(<UserMenu {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByText('Playlists')).toBeInTheDocument();

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.queryByText('Playlists')).not.toBeInTheDocument();
  });
});
