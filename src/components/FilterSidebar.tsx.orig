'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import StoreFilter from './StoreFilter';

interface StoreInfo {
  storeID: string;
  storeName: string;
}

export default function FilterSidebar({ stores }: Readonly<{ stores: StoreInfo[] }>) {
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

  const handleStoreToggle = (storeID: string) => {
    const newStores = new Set(selectedStores);
    if (newStores.has(storeID)) {
      newStores.delete(storeID);
    } else {
      newStores.add(storeID);
    }
    setSelectedStores(newStores);
  };

  const handleSelectAll = useCallback(() => {
    setSelectedStores(new Set(stores.map((s) => s.storeID)));
  }, [stores]);

  const handleClearAll = useCallback(() => {
    setSelectedStores(new Set());
  }, []);

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
    <aside
      className="bg-card border border-border/50 rounded-lg p-6 sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/60"
      aria-label="Filters"
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <h3 className="text-xl font-bold text-foreground">Filters</h3>
        <button
          onClick={clearFilters}
          className="bg-transparent border-none text-muted-foreground text-sm cursor-pointer hover:text-foreground"
          type="button"
        >
          Clear
        </button>
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
          Max Price
        </h4>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-muted-foreground pointer-events-none">$</span>
          <input
            type="number"
            min="0"
            step="1"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Any"
            className="w-full py-3 pr-4 pl-8 bg-muted/50 border border-border rounded-lg text-foreground outline-none focus:border-primary"
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
          Stores
        </h4>
        <StoreFilter
          stores={stores}
          selectedStores={selectedStores}
          onToggle={handleStoreToggle}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
        />
      </div>

      <button
        onClick={applyFilters}
        className="w-full bg-primary text-primary-foreground border-none p-3 rounded-lg font-bold text-base cursor-pointer hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all"
        type="button"
      >
        Apply Filters
      </button>
    </aside>
  );
}
