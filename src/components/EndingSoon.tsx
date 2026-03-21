import { getDeals } from '@/services/api';
import DealRow from './DealRow';
import styles from './EndingSoon.module.css';

export default async function EndingSoon() {
    const deals = await getDeals({ sortBy: 'Recent', pageSize: '8', onSale: '1' });

    if (deals.length === 0) return null;

    return (
        <div className={styles.listSection}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderRow}>
                    <div>
                        <h2>⏰ Ending Soon</h2>
                        <p>Act fast — these deals won't last.</p>
                    </div>
                    <a href="/search?sortBy=Recent" className={styles.seeAll}>SEE ALL ▶</a>
                </div>
            </div>
            <div className={styles.listCol}>
                {deals.map((deal) => (
                    <DealRow key={deal.dealID} deal={deal} />
                ))}
            </div>
        </div>
    );
}
