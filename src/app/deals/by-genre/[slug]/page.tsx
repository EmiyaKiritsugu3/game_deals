import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import { safeJsonLdStringify } from '@/lib/json-ld';
import { SITE_URL } from '@/lib/metadata-helpers';
import type { DealWithStore } from '@/lib/types';
import { getDeals } from '@/services/api';
import type { Deal } from '@/types/game';

/**
 * /deals/by-genre/[slug] — curated genre pages (Task 5.2).
 * CheapShark não expõe genre/tag; cada "gênero" = filtro composto documentado.
 * ponytail: real genre data needs Typesense facets or Steam tags ingest — add when traffic justifies.
 */

interface GenrePage {
  title: string;
  description: string;
  query: Record<string, string>;
}

const GENRES: Record<string, GenrePage> = {
  aaa: {
    title: 'Promoções de Jogos AAA',
    description: 'Grandes lançamentos com desconto: blockbusters AAA em oferta agora.',
    query: { AAA: '1', sortBy: 'Savings', onSale: '1', pageSize: '60' },
  },
  'altamente-avaliados': {
    title: 'Jogos Altamente Avaliados',
    description: 'Metacritic 85+: os jogos mais bem avaliados com desconto.',
    query: { metacritic: '85', sortBy: 'Metacritic', onSale: '1', pageSize: '60' },
  },
  indie: {
    title: 'Promoções de Jogos Indie',
    description: 'Joias independentes baratas: indie games em promoção.',
    query: { upperPrice: '20', sortBy: 'Deal Rating', onSale: '1', pageSize: '60' },
  },
  rpg: {
    title: 'Promoções de RPG',
    description: 'RPGs em oferta — das sagas épicas aos indies de mundo aberto.',
    query: { metacritic: '75', sortBy: 'Savings', onSale: '1', pageSize: '60' },
  },
};

export async function generateStaticParams() {
  return Object.keys(GENRES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const page = GENRES[slug];
  if (!page) return { title: 'Not Found' };
  return {
    title: `${page.title} | GameDeals`,
    description: page.description,
    alternates: { canonical: `${SITE_URL}/deals/by-genre/${slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}/deals/by-genre/${slug}`,
    },
  };
}

export default async function DealsByGenrePage({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const page = GENRES[slug];
  if (!page) notFound();

  const deals = await getDeals(page.query);
  const items: DealWithStore[] = deals.map((d: Deal) => normaliseDeal(d));

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: page.title,
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
            <p className="text-muted-foreground">Nenhuma oferta ativa agora. Volte em breve.</p>
          ) : (
            <PopularDealsGrid
              deals={items}
              title={`Top ${items.length} ofertas`}
              description="Atualizado a cada hora."
            />
          )}
        </div>
      </main>
    </>
  );
}
