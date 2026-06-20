/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

vi.mock('@/lib/chart-data', () => ({
  axisProps: {},
  chartTooltipStyle: {},
  formatChartData: vi.fn(() => [
    { name: 'Jan', price: 10 },
    { name: 'Feb', price: 20 },
  ]),
  priceFormatter: vi.fn((v: number) => [`$${v}`, 'Price']),
  storeFormatter: vi.fn((v: number) => [`$${v}`, 'Price']),
}));

import { PriceHistoryChart, StoreCompareChart } from './Charts';

describe('StoreCompareChart', () => {
  it('renders chart title', () => {
    render(<StoreCompareChart data={[{ storeName: 'Steam', price: '29.99' }]} />);
    expect(screen.getByText('Current Prices by Store')).toBeInTheDocument();
  });

  it('renders bars for each data item', () => {
    render(
      <StoreCompareChart
        data={[
          { storeName: 'Steam', price: '29.99' },
          { storeName: 'GOG', price: '19.99' },
        ]}
      />
    );
    expect(screen.getAllByTestId('bar').length).toBeGreaterThan(0);
  });
});

describe('PriceHistoryChart', () => {
  it('renders "Price History (Real Data)" when realData has >2 items', () => {
    render(
      <PriceHistoryChart
        currentPrice="29.99"
        lowestPrice="9.99"
        lowestDate={1000000}
        realData={[
          { bucket: '2024-01', avg_price: 10, min_price: 5, max_price: 15 },
          { bucket: '2024-02', avg_price: 20, min_price: 15, max_price: 25 },
          { bucket: '2024-03', avg_price: 30, min_price: 25, max_price: 35 },
        ]}
      />
    );
    expect(screen.getByText('Price History (Real Data)')).toBeInTheDocument();
  });

  it('renders "Price History (6 Months)" when no realData', () => {
    render(<PriceHistoryChart currentPrice="29.99" lowestPrice="9.99" lowestDate={1000000} />);
    expect(screen.getByText('Price History (6 Months)')).toBeInTheDocument();
  });

  it('renders subtitle with data point count when realData', () => {
    render(
      <PriceHistoryChart
        currentPrice="29.99"
        lowestPrice="9.99"
        lowestDate={1000000}
        realData={[
          { bucket: '2024-01', avg_price: 10, min_price: 5, max_price: 15 },
          { bucket: '2024-02', avg_price: 20, min_price: 15, max_price: 25 },
          { bucket: '2024-03', avg_price: 30, min_price: 25, max_price: 35 },
        ]}
      />
    );
    expect(screen.getByText(/3 data points/)).toBeInTheDocument();
  });

  it('renders simulation subtitle when no realData', () => {
    render(<PriceHistoryChart currentPrice="29.99" lowestPrice="9.99" lowestDate={1000000} />);
    expect(screen.getByText(/Algorithmic market simulation/)).toBeInTheDocument();
  });
});
