'use client';

import dynamic from 'next/dynamic';
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
}

interface DynamicStoreCompareProps {
  data: {
    storeName: string;
    price: string;
  }[];
}

export function DynamicPriceHistory(props: DynamicPriceHistoryProps) {
  return <PriceHistoryChartLazy {...props} />;
}

export function DynamicStoreCompare(props: DynamicStoreCompareProps) {
  return <StoreCompareChartLazy {...props} />;
}
