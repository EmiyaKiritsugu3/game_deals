'use client';

import dynamic from 'next/dynamic';

// Lazy load Recharts components
const PriceHistoryChartLazy = dynamic(() => import('./Charts').then(mod => mod.PriceHistoryChart), {
    ssr: false,
    loading: () => <div className="flex h-[300px] w-full items-center justify-center rounded-xl border border-white/5 bg-card/20 text-muted-foreground">Loading History...</div>
});

const StoreCompareChartLazy = dynamic(() => import('./Charts').then(mod => mod.StoreCompareChart), {
    ssr: false,
    loading: () => <div className="flex h-[250px] w-full items-center justify-center rounded-xl border border-white/5 bg-card/20 text-muted-foreground">Loading Prices...</div>
});

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
