'use client';

import { useMemo, useState } from 'react';
import styles from './StoreFilter.module.css';

interface StoreInfo {
  storeID: string;
  storeName: string;
}

interface StoreFilterProps {
  stores: StoreInfo[];
  selectedStores: Set<string>;
  onToggle: (storeID: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
}

export default function StoreFilter({
  stores,
  selectedStores,
  onToggle,
  onSelectAll,
  onClearAll,
}: Readonly<StoreFilterProps>) {
  const [search, setSearch] = useState('');

  const filteredStores = useMemo(() => {
    if (!search.trim()) return stores;
    const term = search.toLowerCase();
    return stores.filter((s) => s.storeName.toLowerCase().includes(term));
  }, [stores, search]);

  const selectedCount = selectedStores.size;

  return (
    <div className={styles.container}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search stores..."
        className={styles.searchInput}
        aria-label="Search stores"
      />
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onSelectAll}
          className={styles.actionBtn}
          disabled={!onSelectAll}
        >
          Select All
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className={styles.actionBtn}
          disabled={!onClearAll}
        >
          Clear All
        </button>
        <span className={styles.count}>
          {search.trim()
            ? `Showing ${filteredStores.length} store${filteredStores.length !== 1 ? 's' : ''}`
            : `${stores.length} stores`}
          {selectedCount > 0 && ` \u00b7 ${selectedCount} of ${stores.length}`}
        </span>
      </div>
      <div className={styles.storeList}>
        {filteredStores.map((store) => (
          <label key={store.storeID} className={styles.storeLabel}>
            <input
              type="checkbox"
              checked={selectedStores.has(store.storeID)}
              onChange={() => onToggle(store.storeID)}
              className={styles.checkbox}
              aria-label={store.storeName}
            />
            <span className={styles.storeName}>{store.storeName}</span>
          </label>
        ))}
        {filteredStores.length === 0 && (
          <p className={styles.noResults}>No stores match your search.</p>
        )}
      </div>
    </div>
  );
}
