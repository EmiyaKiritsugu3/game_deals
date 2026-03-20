import { getDeals, getStores, Store } from '@/services/api';
import GameCard from '@/components/GameCard';
import FilterSidebar from '@/components/FilterSidebar';
import styles from '../page.module.css';

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
    const [storesMap, storesResponse] = await Promise.all([
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
        <main className={styles.main}>
            <div className={`container ${styles.searchLayout}`} style={{ marginTop: '3rem' }}>
                <FilterSidebar stores={activeStores} />

                <div className={styles.resultsArea}>
                    <div className={styles.sectionHeader}>
                        <h2>Search Results {query ? `for "${query}"` : 'All Deals'}</h2>
                        <p>Found {deals.length} deals matching your criteria.</p>
                    </div>

                    {deals.length > 0 ? (
                        <div className={styles.grid}>
                            {deals.map((deal) => (
                                <GameCard key={deal.dealID} deal={deal} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'hsl(var(--muted-foreground))' }}>
                            <h3>No deals found.</h3>
                            <p>Try adjusting your search query or filters.</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className={styles.footer} style={{ marginTop: 'auto' }}>
                <div className="container">
                    <p>© {new Date().getFullYear()} GameDeals</p>
                    <p className={styles.footerMuted}>Powered by CheapShark API</p>
                </div>
            </footer>
        </main>
    );
}
