import Link from 'next/link';
import { COLLECTIONS } from '@/data/collections';
import styles from './collections.module.css';

export const metadata = {
    title: 'Curated Collections | GameDeals',
    description: 'Hand-picked game lists curated by theme and budget. Find your next favorite game in our expert collections.',
};

export default function CollectionsPage() {
    return (
        <main className="container">
            <div className={styles.collectionsPage}>
                <div className={styles.collectionsHeader}>
                    <h1>📚 Curated Collections</h1>
                    <p>Hand-picked game lists to help you find your next favorite — all at the best prices.</p>
                </div>

                <div className={styles.collectionsGrid}>
                    {COLLECTIONS.map((col) => (
                        <Link 
                            key={col.slug} 
                            href={`/collections/${col.slug}`} 
                            className={styles.collectionCard}
                        >
                            <span className={styles.collectionEmoji}>{col.emoji}</span>
                            <h2 className={styles.collectionTitle}>{col.title}</h2>
                            <p className={styles.collectionDesc}>{col.description}</p>
                            <div className={styles.collectionMeta}>
                                <span className={styles.collectionCount}>{col.gameIDs.length} games</span>
                                <span className={styles.collectionArrow}>View →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
