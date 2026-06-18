/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OfflinePage from '../page';

describe('OfflinePage', () => {
  it('renders offline message', () => {
    render(<OfflinePage />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('renders try again link pointing to home', () => {
    render(<OfflinePage />);
    const link = screen.getByRole('link', { name: 'Try again' });
    expect(link).toHaveAttribute('href', '/');
  });
});
