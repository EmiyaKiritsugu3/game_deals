/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock('@/lib/supabase-browser', () => ({
  getBrowserClient: () => ({
    auth: {
      signInWithOAuth: mocks.signInWithOAuth,
      signInWithOtp: mocks.signInWithOtp,
    },
  }),
}));

vi.mock('@/components/AuthModal.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css-class' }),
}));

vi.mock('@/components/ui/BaseModal', () => ({
  default: ({
    children,
    isOpen,
    ariaLabel,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    ariaLabel?: string;
  }) =>
    isOpen
      ? React.createElement(
          'div',
          { 'data-testid': 'base-modal', 'aria-label': ariaLabel },
          children
        )
      : null,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('AuthModal', () => {
  it('renders nothing when isOpen is false', async () => {
    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByTestId('base-modal')).not.toBeInTheDocument();
    expect(screen.queryByText(/Welcome to GameDeals/)).not.toBeInTheDocument();
  });

  it('renders modal with title when isOpen is true', async () => {
    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('base-modal')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to GameDeals/)).toBeInTheDocument();
  });

  it('calls signInWithOAuth with google provider on Google button click', async () => {
    mocks.signInWithOAuth.mockResolvedValue({});

    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: expect.any(String) },
      });
    });
  });

  it('calls signInWithOAuth with discord provider on Discord button click', async () => {
    mocks.signInWithOAuth.mockResolvedValue({});

    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Continue with Discord'));

    await waitFor(() => {
      expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'discord',
        options: { redirectTo: expect.any(String) },
      });
    });
  });

  it('shows error message when social login fails', async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      error: { message: 'Login failed' },
    });

    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });

  it('calls signInWithOtp with email on magic link form submit', async () => {
    mocks.signInWithOtp.mockResolvedValue({});

    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Send Magic Link'));

    await waitFor(() => {
      expect(mocks.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: { emailRedirectTo: expect.any(String) },
      });
    });
  });

  it('shows success message after magic link sent', async () => {
    mocks.signInWithOtp.mockResolvedValue({});

    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Send Magic Link'));

    await waitFor(() => {
      expect(screen.getByText('Check your email for the magic link!')).toBeInTheDocument();
    });
  });

  it('shows error message when magic link fails', async () => {
    mocks.signInWithOtp.mockResolvedValue({
      error: { message: 'Invalid email' },
    });

    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Send Magic Link'));

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  it('disables buttons while loading', async () => {
    mocks.signInWithOAuth.mockReturnValue(new Promise<never>(() => {}));

    const AuthModal = (await import('@/components/AuthModal')).default;
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    const googleButton = screen
      .getByText('Continue with Google')
      .closest('button') as HTMLButtonElement;
    const discordButton = screen
      .getByText('Continue with Discord')
      .closest('button') as HTMLButtonElement;
    const magicLinkButton = screen
      .getByText('Send Magic Link')
      .closest('button') as HTMLButtonElement;

    expect(googleButton).not.toBeDisabled();
    expect(discordButton).not.toBeDisabled();
    expect(magicLinkButton).not.toBeDisabled();

    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(googleButton).toBeDisabled();
      expect(discordButton).toBeDisabled();
      expect(magicLinkButton).toBeDisabled();
    });
  });
});
