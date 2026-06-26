'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
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
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <section
      ref={ref}
      className="relative mb-12 flex min-h-[500px] items-center overflow-hidden rounded-xl"
    >
      {/* Parallax background */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgY }}>
        <Image
          src={highResThumb}
          alt=""
          fill
          className="object-cover blur-xl saturate-150"
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-background/20 to-transparent" />
      </motion.div>

      {/* Entrance-animated content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 mx-auto w-full max-w-4xl"
      >
        <Card className="border-0 bg-transparent pt-0 shadow-none">
          <CardContent className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
            <motion.div
              className="relative aspect-[460/215] w-full max-w-sm shrink-0 overflow-hidden rounded-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
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
            </motion.div>

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
      </motion.div>
    </section>
  );
}
