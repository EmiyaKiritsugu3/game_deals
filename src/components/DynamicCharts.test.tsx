/**
 * @vitest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/dynamic', () => ({
  default: (
    _factory: () => Promise<{ default: React.ComponentType }>,
    _opts?: Record<string, unknown>
  ) => {
    const Passthrough = (props: Record<string, unknown>) => (
      <div data-testid="dynamic-chart">{JSON.stringify(props)}</div>
    );
    return Passthrough;
  },
}));

const mockUseDailyPriceHistory = vi.fn().mockReturnValue({ data: null });
vi.mock('@/hooks/usePriceHistory', () => ({
  useDailyPriceHistory: (...args: unknown[]) => mockUseDailyPriceHistory(...args),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

vi.mock('@/lib/chart-data', () => ({
  axisProps: {},
  chartTooltipStyle: {},
  formatChartData: vi.fn(() => [{ name: 'Jan', price: 10 }]),
  priceFormatter: vi.fn((v: number) => [`$${v}`, 'Price']),
  storeFormatter: vi.fn((v: number) => [`$${v}`, 'Price']),
}));

import type React from 'react';
import { DynamicPriceHistory, DynamicStoreCompare } from './DynamicCharts';

function renderWithQuery(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('DynamicPriceHistory', () => {
  beforeEach(() => {
    mockUseDailyPriceHistory.mockReset();
    mockUseDailyPriceHistory.mockReturnValue({ data: null });
  });

  it('calls useDailyPriceHistory with gameId', () => {
    renderWithQuery(
      <DynamicPriceHistory
        currentPrice="29.99"
        lowestPrice="9.99"
        lowestDate={1000000}
        gameId="123"
      />
    );
    expect(mockUseDailyPriceHistory).toHaveBeenCalledWith('123');
  });

  it('passes realData to chart when hook returns data', async () => {
    const realData = [
      { bucket: '2024-01', avg_price: 10, min_price: 5, max_price: 15 },
      { bucket: '2024-02', avg_price: 20, min_price: 15, max_price: 25 },
      { bucket: '2024-03', avg_price: 30, min_price: 25, max_price: 35 },
    ];
    mockUseDailyPriceHistory.mockReturnValue({ data: realData });
    renderWithQuery(
      <DynamicPriceHistory
        currentPrice="29.99"
        lowestPrice="9.99"
        lowestDate={1000000}
        gameId="123"
      />
    );
    const chartDiv = screen.getByTestId('dynamic-chart');
    const props = JSON.parse(chartDiv.textContent || '{}') as Record<string, unknown>;
    expect(props.realData).toEqual(realData);
    expect(props.currentPrice).toBe('29.99');
    expect(props.gameId).toBe('123');
  });

  it('passes undefined realData when hook returns null', async () => {
    mockUseDailyPriceHistory.mockReturnValue({ data: null });
    renderWithQuery(
      <DynamicPriceHistory
        currentPrice="29.99"
        lowestPrice="9.99"
        lowestDate={1000000}
        gameId="123"
      />
    );
    const chartDiv = screen.getByTestId('dynamic-chart');
    const props = JSON.parse(chartDiv.textContent || '{}') as Record<string, unknown>;
    expect(props.realData).toBeUndefined();
  });

  it('passes undefined realData when hook returns empty array', async () => {
    mockUseDailyPriceHistory.mockReturnValue({ data: [] });
    renderWithQuery(
      <DynamicPriceHistory
        currentPrice="29.99"
        lowestPrice="9.99"
        lowestDate={1000000}
        gameId="123"
      />
    );
    const chartDiv = screen.getByTestId('dynamic-chart');
    const props = JSON.parse(chartDiv.textContent || '{}') as Record<string, unknown>;
    expect(props.realData).toBeUndefined();
  });

  it('disables query when gameId is null', () => {
    renderWithQuery(
      <DynamicPriceHistory currentPrice="29.99" lowestPrice="9.99" lowestDate={1000000} />
    );
    expect(mockUseDailyPriceHistory).toHaveBeenCalledWith(null);
  });
});

describe('DynamicStoreCompare', () => {
  it('passes store data to chart', () => {
    renderWithQuery(
      <DynamicStoreCompare
        data={[
          { storeName: 'Steam', price: '29.99' },
          { storeName: 'GOG', price: '19.99' },
        ]}
      />
    );
    const chartDiv = screen.getByTestId('dynamic-chart');
    const props = JSON.parse(chartDiv.textContent || '{}') as { data: { storeName: string; price: string }[] };
    expect(props.data).toHaveLength(2);
    expect(props.data[0].storeName).toBe('Steam');
  });

  it('passes empty data to chart', () => {
    renderWithQuery(<DynamicStoreCompare data={[]} />);
    const chartDiv = screen.getByTestId('dynamic-chart');
    const props = JSON.parse(chartDiv.textContent || '{}') as Record<string, unknown>;
    expect(props.data).toHaveLength(0);
  });
});
