'use client';

import { useMemo, useState } from 'react';

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
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search stores..."
        className="w-full py-2.5 px-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm font-inherit outline-none focus:border-primary [box-sizing:border-box] placeholder:text-muted-foreground"
        aria-label="Search stores"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onSelectAll}
          className="bg-transparent border border-border text-muted-foreground text-xs px-2 py-1 rounded-lg cursor-pointer font-inherit hover:text-foreground hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          disabled={!onSelectAll}
        >
          Select All
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className="bg-transparent border border-border text-muted-foreground text-xs px-2 py-1 rounded-lg cursor-pointer font-inherit hover:text-foreground hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          disabled={!onClearAll}
        >
          Clear All
        </button>
        <span className="text-xs text-muted-foreground ml-auto">
          {(() => {
            if (search.trim()) {
              const label = filteredStores.length === 1 ? 'store' : 'stores';
              return `Showing ${filteredStores.length} ${label}`;
            }
            return `${stores.length} stores`;
          })()}
          {selectedCount > 0 && ` \u00b7 ${selectedCount} of ${stores.length}`}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-[10px]">
        {filteredStores.map((store) => (
          <label key={store.storeID} className="flex items-center gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={selectedStores.has(store.storeID)}
              onChange={() => onToggle(store.storeID)}
              className="w-4 h-4 accent-[var(--primary)]"
              aria-label={store.storeName}
            />
            <span className="text-sm">{store.storeName}</span>
          </label>
        ))}
        {filteredStores.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">No stores match your search.</p>
        )}
      </div>
    </div>
  );
}
