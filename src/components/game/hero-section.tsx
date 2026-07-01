'use client';

import { ArrowRight, ShieldCheck, Sparkles, TrendingDown, Zap } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

interface HeroStats {
  totalDeals: number;
  avgSavings: number;
  storesTracked: number;
  /** Optional suffix appended after the stores-tracked value (e.g. "+"). */
  storesTrackedSuffix?: string;
  topDiscount: number;
}

interface HeroSectionProps {
  stats: HeroStats;
  source: string;
}

function useCountUp(target: number, durationMs = 1400, start = true) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - 2 ** (-10 * p);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return value;
}

function StatCard({
  label,
  value,
  suffix,
  decimals = 0,
  icon: Icon,
  accent,
  delay,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  icon: React.ElementType;
  accent: string;
  delay: number;
}) {
  const animated = useCountUp(value, 1400, true);
  return (
    <div
      className="group relative overflow-hidden rounded-2xl glass p-4 sm:p-5 lift-on-hover hover:border-primary/30"
      style={{
        animation: `fade-in-up 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
      }}
    >
      <div
        className="absolute -right-6 -top-6 size-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight sm:text-3xl tabular-nums">
            {animated.toLocaleString('en-US', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
            {suffix && <span className="text-primary text-xl sm:text-2xl">{suffix}</span>}
          </p>
        </div>
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-border/50 bg-card/40 transition-transform group-hover:scale-110 group-hover:-rotate-6"
          style={{
            color: accent.includes('emerald') ? 'var(--primary)' : 'var(--hot)',
          }}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

export function HeroSection({ stats, source }: HeroSectionProps) {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      {/* Animated mesh gradient background — 3 drifting color blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="animate-mesh-drift absolute -left-20 top-0 size-[28rem] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.78 0.2 145 / 0.6), transparent 60%)',
          }}
        />
        <div
          className="animate-mesh-drift absolute -right-32 top-20 size-[32rem] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.78 0.16 70 / 0.6), transparent 60%)',
            animationDelay: '-6s',
          }}
        />
        <div
          className="animate-mesh-drift absolute bottom-0 left-1/3 size-[26rem] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.7 0.2 300 / 0.5), transparent 60%)',
            animationDelay: '-12s',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Announcement pill */}
        <div className="flex justify-center">
          <a
            href="#featured"
            className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-xs font-medium backdrop-blur-md animate-fade-in-down hover:border-primary/40 transition-colors"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-muted-foreground">Live deals from</span>
            <span className="font-semibold text-foreground">{stats.storesTracked}+ stores</span>
            <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Headline */}
        <h1 className="mx-auto mt-7 max-w-4xl text-center text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl animate-fade-in-up">
          <span className="block">Score legendary</span>
          <span className="relative mt-1 block">
            <span className="text-gradient-emerald animate-gradient-pan">game deals</span>
            <span
              className="absolute -bottom-2 left-1/2 h-[3px] w-3/4 -translate-x-1/2 rounded-full opacity-50 blur-md"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
              }}
            />
          </span>
          <span className="mt-1 block">across every store.</span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl text-center text-base text-muted-foreground sm:text-lg animate-fade-in-up"
          style={{ animationDelay: '120ms' }}
        >
          Real-time price tracking for{' '}
          <span className="font-semibold text-foreground">60,000+</span> PC games. Compare every
          storefront, get notified on drops, and never overpay again.
        </p>

        {/* CTAs */}
        <div
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <Button
            size="lg"
            className="h-12 w-full rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:shadow-primary/50 hover:brightness-110 sheen sm:w-auto"
          >
            <a href="#deals">
              <Sparkles className="size-4" />
              Explore all deals
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
          <a
            href="#how"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-card/40 px-7 text-base font-semibold backdrop-blur-md transition-all hover:border-primary/40 hover:bg-accent/30 sm:w-auto"
          >
            <ShieldCheck className="size-4" />
            How it works
          </a>
        </div>

        {/* Trust row */}
        <div
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-primary" /> Updated every 5 minutes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingDown className="size-3.5 text-primary" /> Best price guaranteed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" /> No sign-up required
          </span>
          {source === 'fallback' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-400 animate-blink-soft" />
              Cached snapshot
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Active deals"
            value={stats.totalDeals}
            icon={Sparkles}
            accent="radial-gradient(circle, oklch(0.78 0.2 145 / 0.6), transparent)"
            delay={360}
          />
          <StatCard
            label="Avg. savings"
            value={stats.avgSavings}
            suffix="%"
            icon={TrendingDown}
            accent="radial-gradient(circle, oklch(0.78 0.16 70 / 0.6), transparent)"
            delay={440}
          />
          <StatCard
            label="Stores tracked"
            value={stats.storesTracked}
            suffix={stats.storesTrackedSuffix ?? ''}
            icon={ShieldCheck}
            accent="radial-gradient(circle, oklch(0.7 0.2 300 / 0.6), transparent)"
            delay={520}
          />
          <StatCard
            label="Top discount"
            value={stats.topDiscount}
            suffix="%"
            icon={Zap}
            accent="radial-gradient(circle, oklch(0.78 0.2 145 / 0.6), transparent)"
            delay={600}
          />
        </div>
      </div>

      {/* Bottom fade into page */}
      <div className="pointer-events-none mt-16 h-px w-full bg-gradient-to-r from-transparent via-border/60 to-transparent" />
    </section>
  );
}
