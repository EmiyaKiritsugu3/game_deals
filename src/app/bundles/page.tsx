import Image from 'next/image';
import { BUNDLES } from '@/data/bundles';

export const metadata = {
  title: 'Game Bundles | GameDeals',
  description: 'Find best game bundle deals from Humble Bundle, Fanatical, more.',
};

export default function BundlesPage() {
  return (
    <main className="container">
      <div className="pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl mb-1">🎁 Game Bundles</h1>
          <p className="text-muted-foreground">
            Multi-game packages top stores — save up 90% vs buying individually.
          </p>
        </div>

        <div className="grid gap-6">
          {BUNDLES.map((bundle) => {
            const savings = Math.round(
              ((bundle.totalValue - bundle.price) / bundle.totalValue) * 100
            );
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(bundle.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div
                key={bundle.id}
                className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    {
                      // biome-ignore lint/performance/noImgElement: static store icons
                      <img
                        src={bundle.storeIcon}
                        alt={bundle.store}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                    }
                    <span className="text-xs text-muted-foreground">{bundle.store}</span>
                  </div>
                  {bundle.tier && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider">
                      {bundle.tier}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-extrabold mb-3">{bundle.name}</h2>
                  <div className="flex gap-2 flex-wrap">
                    {bundle.games.map((game) => {
                      return (
                        <Image
                          key={game.title}
                          src={game.thumb}
                          alt={game.title}
                          title={`${game.title} — $${game.retailPrice.toFixed(2)}`}
                          width={120}
                          height={56}
                          className="rounded-md"
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/30">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-extrabold text-foreground">
                      ${bundle.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {bundle.games.length} games · Value{' '}
                      <strong className="text-primary">${bundle.totalValue.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <a
                      href={bundle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm no-underline hover:opacity-85"
                    >
                      -{savings}% · Get Bundle →
                    </a>
                    <span className="text-xs text-muted-foreground mt-2 text-right">
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
