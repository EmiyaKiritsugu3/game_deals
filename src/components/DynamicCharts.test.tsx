/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/dynamic', () => ({
  default: (factory: () => Promise<{ default: React.ComponentType }>) => {
    const Component = () => {
      const [Comp, setComp] = React.useState<React.ComponentType | null>(null);
      React.useEffect(() => {
        factory().then((mod) => setComp(() => mod.default));
      }, []);
      return Comp ? <Comp /> : <div data-testid="loading">Loading...</div>;
    };
    return Component;
  },
}));

const mockUseDailyPriceHistory = vi.fn().mockReturnValue({ data: null });
vi.mock('@/hooks/usePriceHistory', () => ({
  useDailyPriceHistory: (...args: unknown[]) => mockUseDailyPriceHistory(...args),
}));

import React from 'react';
import { DynamicPriceHistory, DynamicStoreCompare } from './DynamicCharts';

describe('DynamicPriceHistory', () => {
  it('renders loading state initially', () => {
    render(
      <DynamicPriceHistory
        currentPrice="29.99"
        lowestPrice="9.99"
        lowestDate={1000000}
        gameId="123"
      />
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
});

describe('DynamicStoreCompare', () => {
  it('renders loading state initially', () => {
    render(<DynamicStoreCompare data={[{ storeName: 'Steam', price: '29.99' }]} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
});
