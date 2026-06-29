import FilterSidebar from '@/components/FilterSidebar';
import { normaliseDeal } from '@/lib/deal-utils';
import { getDeals, type Store } from '@/services/api';
import { SearchResults } from './SearchResults';

export const metadata = {
  title: 'Search Results | Game Deals',
};

async function getActiveStores(): Promise<Store[]> {
  const storesResponse = (await fetch('https://www.cheapshark.com/api/1.0/stores').then((res) =>
    res.json()
  )) as Store[];
  return storesResponse.filter((s) => s.isActive === 1);
}

async function getDealsWithParams(
  query: string,
  upperPrice?: string,
  storeID?: string
): Promise<ReturnType<typeof normaliseDeal>[]> {
  const apiParams: Record<string, string> = { onSale: '1' };
  if (query) apiParams.title = query;
  if (upperPrice) apiParams.upperPrice = upperPrice;
  if (storeID) apiParams.storeID = storeID;
  try {
    const deals = await getDeals(apiParams);
    return deals.map((d) => normaliseDeal(d));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';
  const upperPrice = typeof params.upperPrice === 'string' ? params.upperPrice : undefined;
  const storeID = typeof params.storeID === 'string' ? params.storeID : undefined;

  const [activeStores, deals] = await Promise.all([
    getActiveStores(),
    getDealsWithParams(query, upperPrice, storeID),
  ]);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="container grid grid-cols-[250px_1fr] gap-8" style={{ marginTop: '3rem' }}>
        <FilterSidebar stores={activeStores} />
        <SearchResults deals={deals} query={query} />
      </div>

      <footer className="mt-auto py-8 border-t border-border text-center text-sm text-muted-foreground">
        <div className="container">
          <p>
            {'©'} {new Date().getFullYear()} GameDeals
          </p>
          <p className="text-xs">Powered by CheapShark API</p>
        </div>
      </footer>
    </main>
  );
}
