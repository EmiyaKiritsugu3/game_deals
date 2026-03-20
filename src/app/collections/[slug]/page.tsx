import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COLLECTIONS } from '@/data/collections';
import { getGame } from '@/services/api';
import styles from '../collections.module.css';

export async function generateStaticParams() {
    return COLLECTIONS.map((col) => ({ slug: col.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const collection = COLLECTIONS.find(c => c.slug === slug);
    if (!collection) return { title: 'Not Found' };
    return {
        title: `${collection.title} | GameDeals Collections`,
        description: collection.description,
    };
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const collection = COLLECTIONS.find(c => c.slug === slug);

    if (!collection) {
        notFound();
    }

    // Fetch all games in the collection in parallel
    const gamesData = await Promise.all(
        collection.gameIDs.map(id => getGame(id).catch(() => null))
    );

    const games = gamesData.reduce((acc: any[], gameData, idx) => {
        if (!gameData || !gameData.info) return acc;
        const bestDeal = [...gameData.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
        acc.push({
            gameID: collection.gameIDs[idx],
            title: gameData.info.title,
            thumb: gameData.info.thumb,
            price: bestDeal?.price ?? gameData.cheapestPriceEver.price,
            retailPrice: bestDeal?.retailPrice ?? gameData.cheapestPriceEver.price,
        });
        return acc;
    }, []);

    return (
        <main className="container">
            <div className={styles.detailPage}>
                <Link href="/collections" className={styles.detailBackLink}>
                    ← Back to Collections
                </Link>

                <div className={styles.detailHeader}>
                    <h1>{collection.emoji} {collection.title}</h1>
                    <p>{collection.description}</p>
                </div>

                <div className={styles.detailGrid}>
                    {games.map((game: any) => (
                        <div key={game.gameID} className={styles.detailGameRow}>
                            <img 
                                src={game.thumb} 
                                alt={game.title} 
                                width={120} 
                                height={56} 
                                className={styles.detailGameThumb}
                            />
                            <div className={styles.detailGameInfo}>
                                <div className={styles.detailGameTitle}>{game.title}</div>
                                <div className={styles.detailGamePrice}>
                                    {parseFloat(game.price) === 0 ? 'FREE' : `$${game.price}`}
                                    {parseFloat(game.retailPrice) > parseFloat(game.price) && (
                                        <span style={{ textDecoration: 'line-through', color: 'hsl(var(--muted-foreground))', marginLeft: '0.5rem', fontWeight: 400 }}>
                                            ${game.retailPrice}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Link href={`/game/${game.gameID}`} className={styles.detailGameCta}>
                                View Deal →
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
