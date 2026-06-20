/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthSection } from './AuthSection';

vi.mock('../Navbar.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css-class' }),
}));

describe('AuthSection', () => {
  it('renders a login button with User icon and "Login" text', () => {
    render(<AuthSection onLoginClickAction={vi.fn()} />);

    const button = screen.getByRole('button', { name: /Login/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Login');
  });

  it('calls onLoginClickAction when button is clicked', () => {
    const onLoginClick = vi.fn();
    render(<AuthSection onLoginClickAction={onLoginClick} />);

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    expect(onLoginClick).toHaveBeenCalledOnce();
  });

  it('does not call onLoginClickAction when not clicked', () => {
    const onLoginClick = vi.fn();
    render(<AuthSection onLoginClickAction={onLoginClick} />);

    expect(onLoginClick).not.toHaveBeenCalled();
  });

  it('renders a button element (not a link or div)', () => {
    render(<AuthSection onLoginClickAction={vi.fn()} />);

    const button = screen.getByRole('button', { name: /Login/i });
    expect(button.tagName).toBe('BUTTON');
  });

  it('can be called multiple times without error', () => {
    const onLoginClick = vi.fn();
    const { unmount } = render(<AuthSection onLoginClickAction={onLoginClick} />);

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    expect(onLoginClick).toHaveBeenCalledOnce();

    unmount();

    render(<AuthSection onLoginClickAction={onLoginClick} />);
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });
});
