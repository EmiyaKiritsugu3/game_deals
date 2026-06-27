import FilterSidebar from '@/components/FilterSidebar';
import { getActiveStores, getDealsWithParams, SearchResults } from './SearchResults';

export const metadata = {
  title: 'Search Results | Game Deals',
};

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
