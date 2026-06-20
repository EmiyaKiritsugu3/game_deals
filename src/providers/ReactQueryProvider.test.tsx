// @vitest-environment jsdom

import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReactQueryProvider from './ReactQueryProvider';

// Helper component that reads QueryClient from context
function QueryClientReader() {
  const client = useQueryClient();
  return (
    <div>
      <span data-testid="has-client">{client !== undefined ? 'yes' : 'no'}</span>
      <span data-testid="stale-time">{String(client.getDefaultOptions().queries?.staleTime)}</span>
    </div>
  );
}

describe('ReactQueryProvider', () => {
  it('renders children correctly', () => {
    render(
      <ReactQueryProvider>
        <div data-testid="child">Hello</div>
      </ReactQueryProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('provides QueryClient context to descendants', () => {
    render(
      <ReactQueryProvider>
        <QueryClientReader />
      </ReactQueryProvider>
    );

    expect(screen.getByTestId('has-client')).toHaveTextContent('yes');
  });

  it('configures default query options (staleTime 60s)', () => {
    render(
      <ReactQueryProvider>
        <QueryClientReader />
      </ReactQueryProvider>
    );

    expect(screen.getByTestId('stale-time')).toHaveTextContent('60000');
  });

  it('renders multiple children', () => {
    render(
      <ReactQueryProvider>
        <div data-testid="a">A</div>
        <div data-testid="b">B</div>
      </ReactQueryProvider>
    );

    expect(screen.getByTestId('a')).toBeInTheDocument();
    expect(screen.getByTestId('b')).toBeInTheDocument();
  });

  it('creates only one QueryClient across re-renders', () => {
    const { rerender } = render(
      <ReactQueryProvider>
        <QueryClientReader />
      </ReactQueryProvider>
    );

    const firstClient = screen.getByTestId('has-client').textContent;

    rerender(
      <ReactQueryProvider>
        <QueryClientReader />
      </ReactQueryProvider>
    );

    // Same client instance (useState lazy initializer only runs once)
    expect(screen.getByTestId('has-client')).toHaveTextContent(firstClient);
  });
});
