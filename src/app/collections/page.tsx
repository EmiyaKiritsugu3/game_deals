import Link from 'next/link';
import { COLLECTIONS } from '@/data/collections';

export const metadata = {
  title: 'Curated Collections | GameDeals',
  description:
    'Hand-picked game lists curated by theme and budget. Find your next favorite game in our expert collections.',
};

export default function CollectionsPage() {
  return (
    <main className="container">
      <div className="pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl mb-1">📚 Curated Collections</h1>
          <p className="text-muted-foreground">
            Hand-picked game lists to help you find your next favorite — all at the best prices.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
          {COLLECTIONS.map((col) => (
            <Link
              key={col.slug}
              href={`/collections/${col.slug}`}
              className="flex flex-col bg-card border border-border rounded-xl p-6 no-underline text-inherit transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-primary"
            >
              <span className="text-4xl mb-3">{col.emoji}</span>
              <h2 className="text-lg font-extrabold mb-1">{col.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed grow">
                {col.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{col.gameIDs.length} games</span>
                <span className="text-sm text-primary font-bold">View →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
