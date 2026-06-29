'use client';

import { useRouter } from 'next/navigation';
import { DealGrid } from '@/components/game/deal-grid';
import type { DealWithStore } from '@/lib/deal-utils';

export function PopularDealsGrid({ deals }: Readonly<{ deals: DealWithStore[] }>) {
  const router = useRouter();

  if (!deals.length) return null;

  return (
    <div className="mb-12">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Most Popular Games
        </h2>
        <p className="text-sm text-muted-foreground">
          The best and most sought-after discounts right now.
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
