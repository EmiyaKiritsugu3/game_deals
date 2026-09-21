import type { Metadata } from 'next';
import Link from 'next/link';
import { safeJsonLdStringify } from '@/lib/json-ld';
import { SITE_URL } from '@/lib/metadata-helpers';
import { getDealsCount } from '@/services/api';
import { formatCount, GENRE_HUB, PRICE_HUB, STORE_HUB } from './hub-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Todas as Ofertas | GameDeals',
  description:
    'Explore ofertas por loja, gênero e preço. Mais de 20 coleções curadas com os melhores descontos.',
  alternates: { canonical: `${SITE_URL}/deals` },
  openGraph: {
    title: 'Todas as Ofertas | GameDeals',
    description:
      'Explore ofertas por loja, gênero e preço. Mais de 20 coleções curadas com os melhores descontos.',
    url: `${SITE_URL}/deals`,
  },
};

async function safeCount(params: Record<string, string>): Promise<number> {
  try {
    return await getDealsCount(params);
  } catch {
    return 0;
  }
}

export default async function DealsHubPage() {
  // ⚡ Bolt Optimization: Batch Promise.all requests concurrently to prevent sequential async waterfalls and minimize server-side blocking time
  const [storeCounts, genreCounts, priceCounts] = await Promise.all([
    Promise.all(STORE_HUB.map((s) => safeCount({ storeID: s.storeId, onSale: '1' }))),
    Promise.all(GENRE_HUB.map((g) => safeCount({ ...g.query, onSale: '1' }))),
    Promise.all(PRICE_HUB.map((p) => safeCount({ ...p.query, onSale: '1' }))),
  ]);

  const allLinks = [
    ...STORE_HUB.map((s, i) => ({
      name: s.label,
      url: `${SITE_URL}/deals/by-store/${s.slug}`,
      count: storeCounts[i],
    })),
    ...GENRE_HUB.map((g, i) => ({
      name: g.label,
      url: `${SITE_URL}/deals/by-genre/${g.slug}`,
      count: genreCounts[i],
    })),
    ...PRICE_HUB.map((p, i) => ({
      name: p.label,
      url: `${SITE_URL}/deals/${p.slug}`,
      count: priceCounts[i],
    })),
  ];

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Todas as Ofertas',
    description:
      'Hub navegável de ofertas por loja, gênero e faixa de preço com contagem de ofertas ativas.',
    url: `${SITE_URL}/deals`,
    isPartOf: { '@type': 'WebSite', name: 'GameDeals', url: SITE_URL },
    numberOfItems: allLinks.length,
    hasPart: allLinks.map((l) => ({
      '@type': 'CollectionPage',
      name: l.name,
      url: l.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD escaped via safeJsonLdStringify
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(collectionJsonLd) }}
      />
      <main className="container">
        <div className="pt-8 pb-16">
          <h1 className="text-3xl font-bold mb-2">Todas as Ofertas</h1>
          <p className="text-muted-foreground mb-8">
            Navegue por loja, gênero ou faixa de preço. Contagens atualizadas a cada hora.
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Por loja</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {STORE_HUB.map((s, i) => (
                <Link
                  key={s.slug}
                  href={`/deals/by-store/${s.slug}`}
                  className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 no-underline text-inherit hover:border-primary hover:-translate-y-0.5 transition-all"
                >
                  <span className="font-medium">{s.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCount(storeCounts[i])}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Por gênero</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {GENRE_HUB.map((g, i) => (
                <Link
                  key={g.slug}
                  href={`/deals/by-genre/${g.slug}`}
                  className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 no-underline text-inherit hover:border-primary hover:-translate-y-0.5 transition-all"
                >
                  <span className="font-medium">{g.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCount(genreCounts[i])}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Por preço</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {PRICE_HUB.map((p, i) => (
                <Link
                  key={p.slug}
                  href={`/deals/${p.slug}`}
                  className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 no-underline text-inherit hover:border-primary hover:-translate-y-0.5 transition-all"
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCount(priceCounts[i])}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
