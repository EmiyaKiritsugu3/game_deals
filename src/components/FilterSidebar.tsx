"use client";

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface StoreInfo {
    storeID: string;
    storeName: string;
}

export default function FilterSidebar({ stores }: { stores: StoreInfo[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read current params
    const currentMaxPrice = searchParams.get('upperPrice') || '';
    const currentStoreStr = searchParams.get('storeID') || '';

    // Local state for immediate UI feedback before applying
    const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
    const [selectedStores, setSelectedStores] = useState<Set<string>>(
        new Set(currentStoreStr ? currentStoreStr.split(',') : [])
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleStoreToggle = (storeID: string) => {
        const newStores = new Set(selectedStores);
        if (newStores.has(storeID)) {
            newStores.delete(storeID);
        } else {
            newStores.add(storeID);
        }
        setSelectedStores(newStores);
    };

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (maxPrice) {
            params.set('upperPrice', maxPrice);
        } else {
            params.delete('upperPrice');
        }

        if (selectedStores.size > 0) {
            params.set('storeID', Array.from(selectedStores).join(','));
        } else {
            params.delete('storeID');
        }

        router.push(`/search?${params.toString()}`);
    }, [maxPrice, selectedStores, router, searchParams]);

    const clearFilters = () => {
        setMaxPrice('');
        setSelectedStores(new Set());
        const params = new URLSearchParams(searchParams.toString());
        params.delete('upperPrice');
        params.delete('storeID');
        router.push(`/search?${params.toString()}`);
    };

    return (
        <aside className="sticky top-[100px] flex h-fit flex-col gap-6 rounded-2xl border border-white/5 bg-card/50 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white">Filters</h3>
                <button onClick={clearFilters} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary" type="button">Clear</button>
            </div>

            <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Max Price</h4>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-muted-foreground">$</span>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Any"
                        className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-8 pr-4 font-bold text-white outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Stores</h4>
                <div className="flex max-h-[300px] flex-col gap-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {stores
                        .filter(s => parseInt(s.storeID) <= 25) // Keep list manageable for MVP
                        .map(store => (
                            <label key={store.storeID} className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-white/5 hover:border-white/5">
                                <div className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20 bg-black/40 transition-colors",
                                    selectedStores.has(store.storeID) && "border-primary bg-primary"
                                )}>
                                    {selectedStores.has(store.storeID) && (
                                        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 stroke-black stroke-[3px]"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm font-semibold text-muted-foreground transition-colors group-hover:text-white",
                                    selectedStores.has(store.storeID) && "text-white"
                                )}>{store.storeName}</span>
                            </label>
                        ))}
                </div>
            </div>

            <button onClick={applyFilters} className="mt-2 w-full rounded-xl bg-primary py-3 font-black text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-transform hover:scale-[1.02] hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] active:scale-95" type="button">
                Apply Filters
            </button>
        </aside>
    );
}
