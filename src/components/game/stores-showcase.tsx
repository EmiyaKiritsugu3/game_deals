'use client';

import { AlertCircle, ShieldCheck, Store as StoreIcon } from 'lucide-react';
import { getStoreTier, type StoreTier } from '@/lib/store-trust';
import type { Store } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StoresShowcaseProps {
  stores: Store[];
  onSelectStore?: (id: string) => void;
  activeStoreID?: string;
}

const TIER_LABEL: Record<StoreTier, { label: string; cls: string; icon: typeof ShieldCheck }> = {
  official: {
    label: 'Official retailer',
    cls: 'text-primary',
    icon: ShieldCheck,
  },
  marketplace: {
    label: 'Marketplace',
    cls: 'text-amber-400',
    icon: AlertCircle,
  },
  unknown: {
    label: 'Retailer',
    cls: 'text-muted-foreground',
    icon: StoreIcon,
  },
};

export function StoresShowcase({ stores, onSelectStore, activeStoreID }: StoresShowcaseProps) {
  const officialCount = stores.filter((s) => getStoreTier(s.storeID) === 'official').length;

  return (
    <section id="stores" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <StoreIcon className="size-3.5" />
              Storefronts
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                <ShieldCheck className="size-3" />
                {officialCount} verified
              </span>{' '}
              · {stores.length} total
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Compare across every store
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Look for the{' '}
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <ShieldCheck className="size-3" /> Verified
            </span>{' '}
            badge — these are official publishers' authorized retailers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {stores.map((store, i) => {
          const active = activeStoreID === store.storeID;
          const tier = getStoreTier(store.storeID);
          const tierInfo = TIER_LABEL[tier];
          const TierIcon = tierInfo.icon;
          return (
            <button
              key={store.storeID}
              type="button"
              onClick={() => onSelectStore?.(active ? '' : store.storeID)}
              className={cn(
                'group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl glass p-5 lift-on-hover',
                tier === 'official' ? 'hover:border-primary/40' : 'hover:border-border/60'
              )}
              style={{
                animation: `fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 40}ms both`,
              }}
            >
              <div
                className={cn(
                  'absolute -right-4 -top-4 size-16 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-100',
                  tier === 'official' ? 'bg-primary/15' : 'bg-amber-500/10'
                )}
              />
              {/* biome-ignore lint/performance/noImgElement: store logos from CDN */}
              <img
                src={store.logoUrl}
                alt={`${store.storeName} logo`}
                className="size-12 rounded-xl object-contain transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                loading="lazy"
              />
              <div className="text-center">
                <p className="text-sm font-semibold">{store.storeName}</p>
                <p
                  className={cn(
                    'mt-0.5 inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider',
                    tierInfo.cls
                  )}
                >
                  <TierIcon className="size-2.5" />
                  {tierInfo.label}
                </p>
              </div>
              {tier === 'official' && (
                <span
                  className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary backdrop-blur-md"
                  title="Official retailer"
                >
                  <ShieldCheck className="size-3" />
                </span>
              )}
              {active && (
                <span className="absolute left-2 top-2 size-2 rounded-full bg-primary shadow-md shadow-primary/50 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
