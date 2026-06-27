import Image from 'next/image';
import Link from 'next/link';
import { type Deal, getHighResImage } from '@/services/api';

interface FreebiesProps {
  readonly deals: Deal[];
}

export default function Freebies({ deals }: FreebiesProps) {
  if (!deals || deals.length === 0) return null;

  return (
    <section className="bg-card border border-border border-l-[3px] border-l-primary rounded-lg px-6 py-5 mb-8 relative">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-widest m-0">
            🎁 FREE GAMES! (100% OFF)
          </h2>
          <span className="bg-primary text-primary-foreground text-xs font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">
            Claim Now
          </span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded">
        {deals.slice(0, 6).map((deal) => {
          return (
            <Link
              href={`/game/${deal.gameID}`}
              key={deal.dealID}
              className="flex-[0_0_200px] bg-muted/40 rounded-lg overflow-hidden no-underline border border-border/60 flex flex-col hover:-translate-y-1 hover:border-primary/50 transition-all snap-start"
            >
              <div className="relative w-full aspect-[460/215] bg-muted/50">
                <Image
                  src={getHighResImage(deal.thumb)}
                  alt={deal.title}
                  fill
                  className="object-cover"
                  sizes="220px"
                  unoptimized
                />
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-extrabold px-2 py-1 rounded">
                  FREE
                </div>
              </div>

              <div className="p-3 flex flex-col gap-3 grow">
                <h3 className="text-sm font-semibold text-foreground m-0 leading-tight line-clamp-2">
                  {deal.title}
                </h3>
                <div className="mt-auto">
                  <div className="flex items-center bg-muted border border-border rounded-sm overflow-hidden text-xs font-bold">
                    <div className="bg-muted-foreground/20 text-muted-foreground px-2 py-1 whitespace-nowrap text-xs tracking-wide uppercase">
                      COUPON
                    </div>
                    <div className="w-px bg-border self-stretch"></div>
                    <div className="grow text-primary font-extrabold text-sm px-2 py-1 text-center">
                      -100%
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
