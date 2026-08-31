/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NewsletterStatusPage from './NewsletterStatusPage';

describe('NewsletterStatusPage', () => {
  it('renders title, message and CTA link', () => {
    render(
      <NewsletterStatusPage
        title="Enabled"
        message="You are subscribed."
        ctaLabel="Go to deals →"
      />
    );
    expect(screen.getByRole('heading', { name: 'Enabled' })).toBeDefined();
    expect(screen.getByText('You are subscribed.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Go to deals →' })).toHaveAttribute('href', '/deals');
  });
});
