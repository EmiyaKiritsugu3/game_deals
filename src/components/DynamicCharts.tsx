'use client';

import dynamic from 'next/dynamic';
import { useDailyPriceHistory } from '@/hooks/usePriceHistory';
import styles from './Charts.module.css';

// Lazy load Recharts components
const PriceHistoryChartLazy = dynamic(
  () => import('./Charts').then((mod) => mod.PriceHistoryChart),
  {
    ssr: false,
    loading: () => <div className={styles.chartPlaceholder}>Loading History...</div>,
  }
);

const StoreCompareChartLazy = dynamic(
  () => import('./Charts').then((mod) => mod.StoreCompareChart),
  {
    ssr: false,
    loading: () => <div className={styles.chartPlaceholder}>Loading Prices...</div>,
  }
);

interface DynamicPriceHistoryProps {
  readonly currentPrice: string;
  readonly lowestPrice: string;
  readonly retailPrice?: string;
  readonly gameTitle?: string;
  readonly gameId?: string;
}

interface DynamicStoreCompareProps {
  readonly data: {
    readonly storeName: string;
    readonly price: string;
  }[];
}

export function DynamicPriceHistory(props: DynamicPriceHistoryProps) {
  // Buscar dados reais se gameId disponível
  const { data: realData } = useDailyPriceHistory(props.gameId || null);

  const chartData =
    realData && realData.length > 0
      ? (realData as Array<{
          bucket: string;
          avg_price: number;
          min_price: number;
          max_price: number;
        }>)
      : undefined;

  return <PriceHistoryChartLazy {...props} realData={chartData} />;
}

export function DynamicStoreCompare(props: DynamicStoreCompareProps) {
  return <StoreCompareChartLazy {...props} />;
}
