'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import styles from './FilterSidebar.module.css';

interface StoreInfo {
  storeID: string;
  storeName: string;
}

export default function FilterSidebar({ stores }: { stores: StoreInfo[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current params
  const _currentQuery = searchParams.get('q') || '';
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
    <aside className={styles.sidebar}>
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
          />
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.groupTitle}>Stores</h4>
        <div className={styles.storeList}>
          {stores
            .filter((s) => parseInt(s.storeID, 10) <= 25) // Keep list manageable for MVP
            .map((store) => (
              <label key={store.storeID} className={styles.storeLabel}>
                <input
                  type="checkbox"
                  checked={selectedStores.has(store.storeID)}
                  onChange={() => handleStoreToggle(store.storeID)}
                  className={styles.checkbox}
                />
                <span className={styles.storeName}>{store.storeName}</span>
              </label>
            ))}
        </div>
      </div>

      <button onClick={applyFilters} className={styles.applyBtn} type="button">
        Apply Filters
      </button>
    </aside>
  );
}
