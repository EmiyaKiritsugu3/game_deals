import { getDeals, Store } from '@/services/api';
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

    // Fetch active stores for the sidebar
    const storesResponse = await fetch('https://www.cheapshark.com/api/1.0/stores').then(res => res.json()) as Store[];
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
        <main className="min-h-screen flex flex-col pb-12">
            <div className="container grid grid-cols-1 gap-8 mt-12 lg:grid-cols-[280px_1fr] flex-1">
                <FilterSidebar stores={activeStores} />

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-baseline justify-between gap-4 border-b border-white/10 pb-4">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">Search Results {query ? `for "${query}"` : 'All Deals'}</h2>
                        <p className="text-sm font-medium text-muted-foreground">Found {deals.length} deals matching your criteria.</p>
                    </div>

                    {deals.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 lg:gap-8">
                            {deals.map((deal) => (
                                <GameCard key={deal.dealID} deal={deal} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-muted-foreground">
                            <h3 className="mb-2 text-xl font-bold">No deals found.</h3>
                            <p>Try adjusting your search query or filters.</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="mt-20 border-t border-white/10 bg-black/40 py-12 text-center md:text-left shrink-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="font-bold text-white">© {new Date().getFullYear()} GameDeals</p>
                    <p className="text-sm font-medium text-muted-foreground">Powered by CheapShark API</p>
                </div>
            </footer>
        </main>
    );
}
