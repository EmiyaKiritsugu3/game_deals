/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) =>
    (mocks.captureException as (...a: unknown[]) => unknown)(...args),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PageError', () => {
  it('renders heading with pageName', async () => {
    const PageError = (await import('@/components/PageError')).default;
    render(<PageError error={new Error('test error')} reset={vi.fn()} pageName="search" />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Something went wrong loading search/i })
      ).toBeInTheDocument();
    });
  });

  it('renders Try again button', async () => {
    const PageError = (await import('@/components/PageError')).default;
    render(<PageError error={new Error('test error')} reset={vi.fn()} pageName="search" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
    });
  });

  it('calls reset when Try again is clicked', async () => {
    const reset = vi.fn();

    const PageError = (await import('@/components/PageError')).default;
    render(<PageError error={new Error('test error')} reset={reset} pageName="search" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('sends error to Sentry via useEffect', async () => {
    const error = new Error('test error');

    const PageError = (await import('@/components/PageError')).default;
    render(<PageError error={error} reset={vi.fn()} pageName="search" />);

    await waitFor(() => {
      expect(mocks.captureException).toHaveBeenCalledWith(error);
    });
  });
});
