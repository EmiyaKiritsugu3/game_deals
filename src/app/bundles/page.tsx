import Image from 'next/image';
import { BUNDLES } from '@/data/bundles';
import { cn } from '@/lib/utils';

export const metadata = {
    title: 'Game Bundles | GameDeals',
    description: 'Find the best game bundle deals from Humble Bundle, Fanatical, and more.',
};

// Make sure this doesn't run during build render as a pure component.
const now = Date.now();

export default function BundlesPage() {
    return (
        <main className="container mx-auto px-4">
            <div className="py-12 md:py-16">
                <div className="mb-12 text-center md:mb-16 md:text-left">
                    <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">🎁 Game Bundles</h1>
                    <p className="text-lg font-medium text-muted-foreground md:text-xl">Multi-game packages from top stores — save up to 90% vs buying individually.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
                    {BUNDLES.map((bundle) => {
                        const savings = Math.round(((bundle.totalValue - bundle.price) / bundle.totalValue) * 100);
                        const daysLeft = Math.max(0, Math.ceil((new Date(bundle.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)));

                        return (
                            <div key={bundle.id} className="group flex flex-col rounded-2xl border border-white/10 bg-card/40 shadow-xl backdrop-blur-xs transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-card hover:shadow-2xl">
                                <div className="flex items-center justify-between border-b border-white/5 bg-white/2 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded bg-white p-1">
                                            <Image src={bundle.storeIcon} alt={bundle.store} width={20} height={20} className="object-contain" />
                                        </div>
                                        <span className="font-bold text-white">{bundle.store}</span>
                                    </div>
                                    {bundle.tier && <span className="rounded bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent-foreground">{bundle.tier}</span>}
                                </div>

                                <div className="flex flex-col gap-6 p-6">
                                    <h2 className="text-2xl font-black text-white group-hover:text-primary">{bundle.name}</h2>
                                    <div className="flex flex-wrap gap-3">
                                        {bundle.games.map((game, gi) => (
                                            <div key={gi} className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 sm:h-16 sm:w-28">
                                                <Image
                                                    src={game.thumb}
                                                    alt={game.title}
                                                    title={`${game.title} — $${game.retailPrice.toFixed(2)}`}
                                                    fill
                                                    sizes="112px"
                                                    className="object-cover transition-transform duration-300 hover:scale-110"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col items-center justify-between gap-6 border-t border-white/5 bg-black/20 p-6 sm:flex-row">
                                    <div className="flex flex-col items-center sm:items-start">
                                        <span className="text-4xl font-black text-white">${bundle.price.toFixed(2)}</span>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {bundle.games.length} games · Value <strong className="text-white line-through">${bundle.totalValue.toFixed(2)}</strong>
                                        </span>
                                    </div>

                                    <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:items-end">
                                        <a href={bundle.url} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-black text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] sm:w-auto">
                                            -{savings}% · Get Bundle →
                                        </a>
                                        <span className={cn("text-xs font-bold uppercase tracking-wider", daysLeft > 0 ? "text-muted-foreground" : "text-red-400")}>
                                            {daysLeft > 0 ? `⏳ ${daysLeft} days left` : '⚠️ Expiring soon'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
