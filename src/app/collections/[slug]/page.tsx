import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COLLECTIONS } from '@/data/collections';
import Image from 'next/image';
import { getGame } from '@/services/api';

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

    type CollectionGame = { gameID: string; title: string; thumb: string; price: string; retailPrice: string };

    const games = gamesData.reduce((acc: CollectionGame[], gameData, idx) => {
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
            <div className="mx-auto max-w-4xl py-12 md:py-16">
                <Link href="/collections" className="mb-8 inline-block text-sm font-bold text-muted-foreground transition-colors hover:text-white">
                    ← Back to Collections
                </Link>

                <div className="mb-12 text-center md:mb-16 md:text-left">
                    <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">{collection.emoji} {collection.title}</h1>
                    <p className="text-lg font-medium text-muted-foreground md:text-xl">{collection.description}</p>
                </div>

                <div className="flex flex-col gap-4">
                    {games.map((game: CollectionGame) => (
                        <div key={game.gameID} className="group flex flex-col items-center gap-4 rounded-xl border border-white/5 bg-card/40 p-4 transition-all hover:bg-card hover:shadow-lg sm:flex-row">
                            <Image
                                src={game.thumb} 
                                alt={game.title} 
                                width={120} 
                                height={56} 
                                className="h-[56px] w-[120px] rounded-md object-cover"
                            />
                            <div className="flex-1 text-center sm:text-left">
                                <div className="mb-1 text-lg font-bold text-white transition-colors group-hover:text-primary">{game.title}</div>
                                <div className="flex items-center justify-center gap-2 font-black text-white sm:justify-start">
                                    {parseFloat(game.price) === 0 ? <span className="text-primary">FREE</span> : `$${game.price}`}
                                    {parseFloat(game.retailPrice) > parseFloat(game.price) && (
                                        <span className="text-sm font-semibold text-muted-foreground line-through">
                                            ${game.retailPrice}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Link href={`/game/${game.gameID}`} className="w-full shrink-0 rounded-lg bg-primary/10 px-6 py-3 text-center text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:w-auto">
                                View Deal →
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
