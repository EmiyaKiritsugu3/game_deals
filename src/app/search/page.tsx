import FilterSidebar from '@/components/FilterSidebar';
import styles from '../page.module.css';
import { getActiveStores, getDealsWithParams, SearchResults } from './SearchResults';

export const metadata = {
  title: 'Search Results | Game Deals',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';
  const upperPrice = typeof params.upperPrice === 'string' ? params.upperPrice : undefined;
  const storeID = typeof params.storeID === 'string' ? params.storeID : undefined;

  const [activeStores, deals] = await Promise.all([
    getActiveStores(),
    getDealsWithParams(query, upperPrice, storeID),
  ]);

  return (
    <main className={styles.main}>
      <div className={`container ${styles.searchLayout}`} style={{ marginTop: '3rem' }}>
        <FilterSidebar stores={activeStores} />
        <SearchResults deals={deals} query={query} />
      </div>

      <footer className={styles.footer} style={{ marginTop: 'auto' }}>
        <div className="container">
          <p>
            {'\u00a9'} {new Date().getFullYear()} GameDeals
          </p>
          <p className={styles.footerMuted}>Powered by CheapShark API</p>
        </div>
      </footer>
    </main>
  );
}
