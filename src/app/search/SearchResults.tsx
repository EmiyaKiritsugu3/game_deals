import GameCard from '@/components/GameCard';
import { type Deal, getDeals, type Store } from '@/services/api';

export async function getActiveStores(): Promise<Store[]> {
  const storesResponse = (await fetch('https://www.cheapshark.com/api/1.0/stores').then((res) =>
    res.json()
  )) as Store[];
  return storesResponse.filter((s) => s.isActive === 1);
}

export async function getDealsWithParams(
  query: string,
  upperPrice?: string,
  storeID?: string
): Promise<Deal[]> {
  const apiParams: Record<string, string> = { onSale: '1' };
  if (query) apiParams.title = query;
  if (upperPrice) apiParams.upperPrice = upperPrice;
  if (storeID) apiParams.storeID = storeID;
  try {
    return await getDeals(apiParams);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function SearchResults({ deals, query }: Readonly<{ deals: Deal[]; query: string }>) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Search Results {query ? `for "${query}"` : 'All Deals'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Found {deals.length} deals matching your criteria.
        </p>
      </div>

      {deals.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {deals.map((deal) => (
            <GameCard key={deal.dealID} deal={deal} />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 0',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <h3>No deals found.</h3>
          <p>Try adjusting your search query or filters.</p>
        </div>
      )}
    </div>
  );
}
