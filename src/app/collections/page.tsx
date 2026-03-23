import Link from 'next/link';
import { COLLECTIONS } from '@/data/collections';

export const metadata = {
    title: 'Curated Collections | GameDeals',
    description: 'Hand-picked game lists curated by theme and budget. Find your next favorite game in our expert collections.',
};

export default function CollectionsPage() {
    return (
        <main className="container">
            <div className="py-12 md:py-16">
                <div className="mb-12 text-center md:mb-16">
                    <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">📚 Curated Collections</h1>
                    <p className="mx-auto max-w-2xl text-lg font-medium text-muted-foreground md:text-xl">Hand-picked game lists to help you find your next favorite — all at the best prices.</p>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 md:gap-8">
                    {COLLECTIONS.map((col) => (
                        <Link 
                            key={col.slug} 
                            href={`/collections/${col.slug}`} 
                            className="group flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-card/60 p-8 text-center backdrop-blur-xs transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
                        >
                            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-4xl shadow-inner transition-transform group-hover:scale-110">{col.emoji}</span>
                            <h2 className="mb-2 text-xl font-bold text-white transition-colors group-hover:text-primary">{col.title}</h2>
                            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{col.description}</p>
                            <div className="mt-auto flex w-full items-center justify-between border-t border-white/10 pt-4 text-sm font-bold text-muted-foreground transition-colors group-hover:text-white">
                                <span className="rounded-full bg-white/5 px-3 py-1">{col.gameIDs.length} games</span>
                                <span className="text-primary transition-transform group-hover:translate-x-1">View →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
