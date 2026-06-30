import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COLLECTIONS } from '@/data/collections';
import { cn } from '@/lib/utils';

export default function DiscoveryGrid() {
  if (COLLECTIONS.length === 0) return null;

  return (
    <div className="mb-12 animate-fade-slide-in">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Discover Games</h2>
          <p className="text-sm text-muted-foreground">
            Curated collections for every mood and budget
          </p>
        </div>
        <Link
          href="/collections"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-sm font-semibold')}
        >
          All Collections &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((col, i) => (
          <div
            key={col.slug}
            className="animate-fade-slide-in hover:-translate-y-1.5 transition-transform duration-200 ease-out"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Link href={`/collections/${col.slug}`} className="block no-underline">
              <Card className="h-full transition-colors duration-200 hover:border-primary">
                <CardHeader>
                  <span className="text-3xl" role="img" aria-label={col.title}>
                    {col.emoji}
                  </span>
                  <CardTitle>{col.title}</CardTitle>
                  <CardDescription>{col.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">
                    {col.gameIDs.length} game
                    {col.gameIDs.length !== 1 ? 's' : ''}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
