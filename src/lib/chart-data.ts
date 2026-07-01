import type { PriceHistoryPoint } from '@/types/game';
import { generatePriceHistory } from '@/utils/pricing';

export interface RealPriceDataPoint {
  bucket: string;
  avg_price: number;
  min_price: number;
  max_price: number;
}

export function formatChartData(
  realData: RealPriceDataPoint[] | undefined,
  retailPrice: string,
  currentPrice: string,
  lowestPrice: string,
  gameTitle: string
): PriceHistoryPoint[] {
  if (realData && realData.length > 2) {
    return realData.map((d) => ({
      name: new Date(d.bucket).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      price: d.avg_price || d.min_price,
    }));
  }
  return generatePriceHistory(
    Number.parseFloat(retailPrice),
    Number.parseFloat(currentPrice),
    Number.parseFloat(lowestPrice),
    gameTitle
  );
}

// biome-ignore lint/suspicious/noExplicitAny: Recharts Tooltip formatter signature
const priceFormatter = (value: any): [string, string] => {
  const numValue = Number(value);
  return [`$${Number.isFinite(numValue) ? numValue.toFixed(2) : '0.00'}`, 'Price'];
};

// biome-ignore lint/suspicious/noExplicitAny: Recharts Tooltip formatter signature
const storeFormatter = (value: any): [string, string] => {
  const numValue = Number(value);
  return [`$${Number.isFinite(numValue) ? numValue.toFixed(2) : '0.00'}`, 'Price'];
};

export { priceFormatter, storeFormatter };

export const axisProps = {
  stroke: 'hsl(var(--muted-foreground))' as const,
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
};
