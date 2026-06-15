'use client';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  axisProps,
  chartTooltipStyle,
  formatChartData,
  priceFormatter,
  storeFormatter,
} from '@/lib/chart-data';
import styles from './Charts.module.css';

interface StorePrice {
  storeName: string;
  price: string;
}
export function StoreCompareChart({ data }: { readonly data: StorePrice[] }) {
  const chartData = data.map((d) => ({
    name: d.storeName,
    price: Number.parseFloat(d.price),
  }));
  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Current Prices by Store</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <XAxis dataKey="name" {...axisProps} angle={-45} textAnchor="end" />
            <YAxis {...axisProps} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
              contentStyle={chartTooltipStyle}
              formatter={storeFormatter}
            />
            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={_entry.name}
                  fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
interface PriceHistoryChartProps {
  readonly currentPrice: string;
  readonly lowestPrice: string;
  readonly lowestDate: number;
  readonly retailPrice?: string;
  readonly gameTitle?: string;
  readonly gameId?: string;
  readonly realData?: Array<{
    bucket: string;
    avg_price: number;
    min_price: number;
    max_price: number;
  }>;
}
export function PriceHistoryChart({
  currentPrice,
  lowestPrice,
  lowestDate: _lowestDate,
  retailPrice = '9.99',
  gameTitle = 'Default',
  gameId: _gameId,
  realData,
}: PriceHistoryChartProps) {
  const chartData = formatChartData(realData, retailPrice, currentPrice, lowestPrice, gameTitle);
  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>
        {realData && realData.length > 2 ? 'Price History (Real Data)' : 'Price History (6 Months)'}
      </h3>
      <p className={styles.chartSubtitle}>
        {realData && realData.length > 2
          ? `Based on ${realData.length} data points from price tracking`
          : 'Algorithmic market simulation based on official data drops'}
      </p>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <XAxis dataKey="name" {...axisProps} />
            <YAxis
              {...axisProps}
              tickFormatter={(value) => `$${value}`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip contentStyle={chartTooltipStyle} formatter={priceFormatter} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{
                fill: 'hsl(var(--card))',
                stroke: 'hsl(var(--primary))',
                strokeWidth: 2,
                r: 6,
              }}
              activeDot={{ r: 8, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
