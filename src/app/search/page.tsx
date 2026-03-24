import { getDeals, getStores, Store } from '@/services/api';
import GameCard from '@/components/GameCard';
import FilterSidebar from '@/components/FilterSidebar';

export const metadata = {
    title: 'Search Results | Game Deals',
};

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const query = typeof params.q === 'string' ? params.q : '';
    const upperPrice = typeof params.upperPrice === 'string' ? params.upperPrice : undefined;
    const storeID = typeof params.storeID === 'string' ? params.storeID : undefined;

    // Fetch deals and stores in parallel
    const [, storesResponse] = await Promise.all([
        getStores(),
        fetch('https://www.cheapshark.com/api/1.0/stores').then(res => res.json()) as Promise<Store[]>
    ]);

    // Format active store array for sidebar
    const activeStores = storesResponse.filter(s => s.isActive === 1);

    const apiParams: Record<string, string> = { onSale: '1' };
    if (query) apiParams.title = query;
    if (upperPrice) apiParams.upperPrice = upperPrice;
    if (storeID) apiParams.storeID = storeID;

    let deals: import('@/services/api').Deal[] = [];
    try {
        deals = await getDeals(apiParams);
    } catch (error) {
        console.error(error);
    }

    return (
        <main className="flex min-h-screen flex-col bg-background pb-24">
            <div className="container mx-auto px-4 max-w-7xl mt-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1">
                    <FilterSidebar stores={activeStores} />
                </div>

                <div className="md:col-span-3 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                            Search Results {query ? `for "${query}"` : 'All Deals'}
                        </h2>
                        <p className="text-muted-foreground">Found {deals.length} deals matching your criteria.</p>
                    </div>

                    {deals.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {deals.map((deal) => (
                                <GameCard key={deal.dealID} deal={deal} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <h3 className="text-xl font-bold mb-2">No deals found.</h3>
                            <p>Try adjusting your search query or filters.</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="mt-auto py-8 text-center text-sm border-t border-white/5">
                <div className="container mx-auto">
                    <p className="text-foreground">© {new Date().getFullYear()} GameDeals</p>
                    <p className="text-muted-foreground mt-1">Powered by CheapShark API</p>
                </div>
            </footer>
        </main>
    );
}
