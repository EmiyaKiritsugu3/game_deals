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
  currentPrice: string;
  lowestPrice: string;
  lowestDate: number;
  retailPrice?: string;
  gameTitle?: string;
  gameId?: string;
}

interface DynamicStoreCompareProps {
  data: {
    storeName: string;
    price: string;
  }[];
}

export function DynamicPriceHistory(props: DynamicPriceHistoryProps) {
  // Buscar dados reais se gameId disponível
  const { data: realData } = useDailyPriceHistory(props.gameId || null);

  return (
    <PriceHistoryChartLazy
      {...props}
      realData={realData && realData.length > 0 ? realData as any : undefined}
    />
  );
}

export function DynamicStoreCompare(props: DynamicStoreCompareProps) {
  return <StoreCompareChartLazy {...props} />;
}
