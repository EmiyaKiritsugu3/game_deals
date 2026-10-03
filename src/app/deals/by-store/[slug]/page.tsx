import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import { safeJsonLdStringify } from '@/lib/json-ld';
import { SITE_URL } from '@/lib/metadata-helpers';
import type { DealWithStore } from '@/lib/types';
import { getDeals, getStores } from '@/services/api';
import type { Deal } from '@/types/game';

/**
 * /deals/by-store/[slug] — programmatic pages per store (Task 5.1).
 * slug = kebab-case store name (humble, fanatical, eneba, cdkeys...).
 */

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function buildStoreMap(): Promise<Record<string, string>> {
  const stores = await getStores();
  const bySlug: Record<string, string> = {};
  // ponytail: keep synthetic stores (101-104) — they're configured affiliateConfig entries.
  for (const [id, name] of Object.entries(stores)) {
    if (!name) continue;
    bySlug[toSlug(name)] = id;
  }
  // short alias used in sitemap/hub: "humble" → Humble Store (11)
  if (bySlug['humble-store'] && !bySlug.humble) bySlug.humble = bySlug['humble-store'];
  return bySlug;
}

export async function generateStaticParams() {
  const map = await buildStoreMap();
  return Object.keys(map).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const map = await buildStoreMap();
  if (!map[slug]) return { title: 'Not Found' };
  const name = slugToName(slug);
  const title = `Melhores promoções ${name} — GameDeals`;
  const description = `Compare todas as ofertas ativas na loja ${name}. Atualizado a cada hora.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/deals/by-store/${slug}` },
    openGraph: { title, description, url: `${SITE_URL}/deals/by-store/${slug}` },
  };
}

export default async function DealsByStorePage({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const map = await buildStoreMap();
  const storeId = map[slug];
  if (!storeId) notFound();

  const name = slugToName(slug);
  const deals = await getDeals({
    storeID: storeId,
    sortBy: 'Savings',
    onSale: '1',
    pageSize: '60',
  });
  const items: DealWithStore[] = deals.map((d: Deal) => normaliseDeal(d));

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Melhores promoções ${name}`,
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
          <h1 className="text-3xl font-bold mb-2">Melhores promoções da {name}</h1>
          <p className="text-muted-foreground mb-6">
            Todas as ofertas ativas na {name}, ordenadas por desconto. Atualizado a cada hora.
          </p>
          {items.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma oferta ativa agora. Volte em breve.</p>
          ) : (
            <PopularDealsGrid
              deals={items}
              title={`Top ${items.length} ofertas na ${name}`}
              description="Ordenado por % de desconto. Atualizado a cada hora."
            />
          )}
        </div>
      </main>
    </>
  );
}
