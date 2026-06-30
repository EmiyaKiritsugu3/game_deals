'use client';

import { useRouter } from 'next/navigation';
import { DealGrid } from '@/components/game/deal-grid';
import type { DealWithStore } from '@/lib/types';

export function PopularDealsGrid({
  deals,
  title = 'Most Popular Games',
  description = 'The best and most sought-after discounts right now.',
}: Readonly<{
  deals: DealWithStore[];
  title?: string;
  description?: string;
}>) {
  const router = useRouter();

  if (!deals.length) return null;

  return (
    <div className="mb-12">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
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
