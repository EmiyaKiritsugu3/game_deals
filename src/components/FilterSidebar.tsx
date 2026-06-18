'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import styles from './FilterSidebar.module.css';
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
    <aside className={styles.sidebar} aria-label="Filters">
      <div className={styles.header}>
        <h3 className={styles.title}>Filters</h3>
        <button onClick={clearFilters} className={styles.clearBtn} type="button">
          Clear
        </button>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.groupTitle}>Max Price</h4>
        <div className={styles.priceInputWrapper}>
          <span className={styles.currencySymbol}>$</span>
          <input
            type="number"
            min="0"
            step="1"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Any"
            className={styles.priceInput}
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.groupTitle}>Stores</h4>
        <StoreFilter
          stores={stores}
          selectedStores={selectedStores}
          onToggle={handleStoreToggle}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
        />
      </div>

      <button onClick={applyFilters} className={styles.applyBtn} type="button">
        Apply Filters
      </button>
    </aside>
  );
}
