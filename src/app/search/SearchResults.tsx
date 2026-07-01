'use client';

import { useRouter } from 'next/navigation';
import { DealGrid } from '@/components/game/deal-grid';
import type { DealWithStore } from '@/lib/types';

export function SearchResults({
  deals,
  query,
}: Readonly<{ deals: DealWithStore[]; query: string }>) {
  const router = useRouter();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Search Results {query ? `for "${query}"` : 'All Deals'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Found {deals.length} deal{deals.length !== 1 ? 's' : ''} matching your criteria.
        </p>
      </div>

      <DealGrid
        deals={deals}
        loading={false}
        error={false}
        onOpenDetail={(deal) => router.push(`/game/${deal.gameID}`)}
      />
    </div>
  );
}
