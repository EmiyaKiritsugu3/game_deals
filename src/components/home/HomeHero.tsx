import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type Deal, getHighResImage } from '@/services/api';

interface HomeHeroProps {
  readonly deal: Deal;
}

function computeSavings(savings: string): number {
  return Math.round(Number.parseFloat(savings));
}

export default function HomeHero({ deal }: HomeHeroProps) {
  const highResThumb = getHighResImage(deal.thumb);
  const savings = computeSavings(deal.savings);

  return (
    <section className="relative mb-12 flex min-h-[500px] items-center overflow-hidden rounded-xl">
      {/* Parallax background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed blur-xl saturate-150"
          style={{ backgroundImage: `url(${highResThumb})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-background/20 to-transparent" />
      </div>

      {/* Entrance-animated content */}
      <div
        className="relative z-10 mx-auto w-full max-w-4xl animate-fade-slide-in"
        style={{ animationDuration: '0.6s' }}
      >
        <Card className="border-0 bg-transparent pt-0 shadow-none">
          <CardContent className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
            <div
              className="relative aspect-[460/215] w-full max-w-sm shrink-0 overflow-hidden rounded-lg animate-fade-slide-in"
              style={{ animationDuration: '0.5s', animationDelay: '0.15s' }}
            >
              <Image
                src={highResThumb}
                alt={deal.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
                unoptimized
              />
            </div>

            <div className="flex flex-col gap-4">
              <Badge variant="secondary" className="w-fit">
                FEATURED DEAL
              </Badge>

              <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                {deal.title}
              </h1>

              {savings > 0 && (
                <Badge variant="destructive" className="w-fit text-base">
                  -{savings}%
                </Badge>
              )}

              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-primary">${deal.salePrice}</span>
                {savings > 0 && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${deal.normalPrice}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/game/${deal.gameID}`}
                  className={cn(buttonVariants({ size: 'lg' }), 'font-bold')}
                >
                  View Deal
                </Link>
                <Link
                  href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'font-bold')}
                >
                  Buy Now
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
