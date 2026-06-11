'use client';

import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PriceHistoryPoint } from '@/types/game';
import { generatePriceHistory } from '@/utils/pricing';
import styles from './Charts.module.css';

interface StorePrice {
  storeName: string;
  price: string;
}

export function StoreCompareChart({ data }: { data: StorePrice[] }) {
  const chartData = data.map((d) => ({
    name: d.storeName,
    price: parseFloat(d.price),
  }));

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Current Prices by Store</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: any) => {
                const numValue = Number(value);
                return [`$${!Number.isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`, 'Price'];
              }}
            />
            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
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
  currentPrice: string;
  lowestPrice: string;
  lowestDate: number;
  retailPrice?: string;
  gameTitle?: string;
  gameId?: string;
  realData?: Array<{ bucket: string; avg_price: number; min_price: number; max_price: number }>;
}

export function PriceHistoryChart({
  currentPrice,
  lowestPrice,
  lowestDate,
  retailPrice = '9.99',
  gameTitle = 'Default',
  gameId,
  realData,
}: PriceHistoryChartProps) {
  // Usar dados reais se disponíveis, senão gerar simulados
  let chartData: PriceHistoryPoint[];

  if (realData && realData.length > 2) {
    chartData = realData.map((d) => ({
      name: new Date(d.bucket).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: d.avg_price || d.min_price,
    }));
  } else {
    chartData = generatePriceHistory(
      parseFloat(retailPrice),
      parseFloat(currentPrice),
      parseFloat(lowestPrice),
      gameTitle
    );
  }

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
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: any) => {
                const numValue = Number(value);
                return [`$${!Number.isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`, 'Price'];
              }}
            />
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
