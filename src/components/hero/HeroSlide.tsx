'use client';
import { Gamepad2, Monitor } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { type Deal, getHighResImage, getStoreLogo } from '../../services/api';

export function HeroSlide({
  deal,
  isActive,
  index,
}: Readonly<{
  deal: Deal;
  isActive: boolean;
  index: number;
}>) {
  const dealSavings = Math.round(Number.parseFloat(deal.savings));
  const dealThumb = getHighResImage(deal.thumb);

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isActive ? 'opacity-100 visible z-10' : 'opacity-0 invisible'}`}
      aria-hidden={!isActive}
    >
      <div className="absolute inset-0 z-0 opacity-40">
        <Image
          src={dealThumb}
          alt="background blur"
          fill
          className="object-cover [filter:blur(60px)_brightness(0.6)_saturate(1.5)] scale-110"
          unoptimized
        />
      </div>

      <div className="container">
        <div
          className={`w-full min-h-[380px] flex items-center relative z-20 bg-card/35 backdrop-blur-2xl border border-border/40 rounded-lg py-12 px-16 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.05)] transition-all duration-500 max-lg:py-8 max-lg:px-6 max-lg:min-h-[520px] max-lg:my-8 max-lg:mb-16 ${
            isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'
          }`}
        >
          <div className="w-full relative z-20 grid grid-cols-2 gap-16 items-center max-lg:grid-cols-1 max-lg:text-center max-lg:gap-10">
            <div className="flex flex-col gap-6">
              <span className="self-start text-xs font-extrabold tracking-[0.1em] text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20 max-lg:self-center">
                FEATURED DEAL
              </span>
              <h1 className="text-4xl font-black leading-none tracking-tighter bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent m-0 max-lg:text-3xl">
                {deal.title}
              </h1>

              <div className="flex items-center gap-6 mb-2 max-lg:justify-center">
                {getStoreLogo(deal.storeID) &&
                  (() => {
                    return (
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-card/70 px-2 py-1 rounded-lg border border-border/50">
                        <Image
                          src={getStoreLogo(deal.storeID) ?? ''}
                          alt="Store"
                          width={16}
                          height={16}
                          unoptimized
                        />
                        <span className="text-xs uppercase tracking-wider">View Deal</span>
                      </div>
                    );
                  })()}
                <div className="flex items-center gap-3 text-muted-foreground [&_svg]:opacity-70 [&_svg]:transition-opacity [&_svg:hover]:opacity-100">
                  <Monitor size={16} />
                  <Gamepad2 size={16} />
                </div>
              </div>

              <div className="flex items-center gap-5 max-lg:justify-center">
                {dealSavings > 0 && (
                  <span className="bg-primary text-primary-foreground font-extrabold px-4 py-2 rounded-lg text-xl">
                    Save {dealSavings}%
                  </span>
                )}
                <div className="flex flex-col justify-center">
                  {dealSavings > 0 && (
                    <span className="line-through text-muted-foreground text-base font-semibold leading-none mb-0.5">
                      ${deal.normalPrice}
                    </span>
                  )}
                  <span className="text-foreground text-3xl font-extrabold leading-none">
                    ${deal.salePrice}
                  </span>
                </div>
              </div>

              <Link
                href={`/game/${deal.gameID}`}
                className="inline-flex items-center justify-center bg-foreground text-background font-bold px-10 py-4 rounded-lg text-base w-fit mt-2 hover:opacity-90 transition-all max-lg:w-full max-lg:mt-0"
                tabIndex={isActive ? 0 : -1}
              >
                Get Deal Now
              </Link>
            </div>

            <div className="relative w-full max-w-[240px] h-[350px] justify-self-center max-lg:hidden">
              <Image
                src={dealThumb}
                alt={deal.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover bg-card rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                priority={index === 0}
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
