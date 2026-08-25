import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import { safeJsonLdStringify } from '@/lib/json-ld';
import { SITE_URL } from '@/lib/metadata-helpers';
import type { DealWithStore } from '@/lib/types';
import { getDeals } from '@/services/api';
import type { Deal } from '@/types/game';

const PAGES: Record<string, { title: string; description: string; upperPrice: number }> = {
  'under-10': {
    title: 'Best Game Deals Under $10',
    description: 'Quality games on sale for less than $10. Updated daily.',
    upperPrice: 10,
  },
  'under-20': {
    title: 'Best Game Deals Under $20',
    description: 'Indie gems and AA titles on sale for under $20.',
    upperPrice: 20,
  },
  'under-30': {
    title: 'Best Game Deals Under $30',
    description: 'Mid-tier and popular games discounted under $30.',
    upperPrice: 30,
  },
};

export async function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) return { title: 'Not Found' };
  return {
    title: `${page.title} | GameDeals`,
    description: page.description,
    alternates: { canonical: `${SITE_URL}/deals/${slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}/deals/${slug}`,
    },
  };
}

function dealToViewModel(deal: Deal): DealWithStore {
  return normaliseDeal(deal);
}

export default async function DealsByPricePage({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  const deals = await getDeals({
    upperPrice: String(page.upperPrice),
    sortBy: 'Deal Rating',
    onSale: '1',
    pageSize: '60',
  });

  const items: DealWithStore[] = deals.map(dealToViewModel);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: page.title,
    description: page.description,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((d, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE_URL}/game/${d.gameID}`,
      name: d.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD escaped via safeJsonLdStringify
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(itemListJsonLd) }}
      />
      <main className="container">
        <div className="pt-8 pb-16">
          <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
          <p className="text-muted-foreground mb-6">{page.description}</p>
          {items.length === 0 ? (
            <p className="text-muted-foreground">
              No deals in this range right now. Check back soon.
            </p>
          ) : (
            <PopularDealsGrid
              deals={items}
              title={`Top ${items.length} deals under $${page.upperPrice}`}
              description="Sorted by deal rating. Refreshed every hour."
            />
          )}
        </div>
      </main>
    </>
  );
}
