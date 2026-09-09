'use client';

import { Activity, BarChart3, DollarSign, Store, TrendingDown } from 'lucide-react';
import * as React from 'react';
import { dedupeToList } from '@/lib/dedup';
import { isOfficialRetailer } from '@/lib/store-trust';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DealStatsDashboardProps {
  deals: DealWithStore[];
}

export function DealStatsDashboard({ deals }: DealStatsDashboardProps) {
  const stats = React.useMemo(() => {
    const deduped = dedupeToList(deals, 60);

    // Savings distribution (5 buckets)
    const buckets = [
      {
        label: '0-25%',
        min: 0,
        max: 25,
        count: 0,
        color: 'oklch(0.7 0.1 200)',
      },
      {
        label: '25-50%',
        min: 25,
        max: 50,
        count: 0,
        color: 'oklch(0.7 0.15 180)',
      },
      {
        label: '50-75%',
        min: 50,
        max: 75,
        count: 0,
        color: 'oklch(0.78 0.2 145)',
      },
      {
        label: '75-90%',
        min: 75,
        max: 90,
        count: 0,
        color: 'oklch(0.78 0.16 70)',
      },
      {
        label: '90-100%',
        min: 90,
        max: 101,
        count: 0,
        color: 'oklch(0.82 0.2 300)',
      },
    ];
    for (const d of deduped) {
      const b = buckets.find((b) => d.savingsNum >= b.min && d.savingsNum < b.max);
      if (b) b.count++;
    }
    let maxBucket = 1;
    for (const b of buckets) {
      if (b.count > maxBucket) maxBucket = b.count;
    }

    // Store share (top 5 stores)
    const storeCounts = new Map<
      string,
      { name: string; logo?: string; count: number; verified: boolean }
    >();
    for (const d of deduped) {
      if (!d.store) continue;
      const existing = storeCounts.get(d.store.storeID) ?? {
        name: d.store.storeName,
        logo: d.store.logoUrl,
        count: 0,
        verified: isOfficialRetailer(d.storeID),
      };
      existing.count++;
      storeCounts.set(d.store.storeID, existing);
    }
    const topStores = Array.from(storeCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const totalStoreDeals = topStores.reduce((s, st) => s + st.count, 0) || 1;

    // Price tier breakdown (donut chart)
    const tiers = [
      {
        label: 'Free',
        min: 0,
        max: 0.01,
        count: 0,
        color: 'oklch(0.82 0.2 300)',
      },
      {
        label: 'Under $5',
        min: 0.01,
        max: 5,
        count: 0,
        color: 'oklch(0.78 0.2 145)',
      },
      {
        label: '$5-$15',
        min: 5,
        max: 15,
        count: 0,
        color: 'oklch(0.78 0.16 70)',
      },
      {
        label: '$15-$30',
        min: 15,
        max: 30,
        count: 0,
        color: 'oklch(0.7 0.15 60)',
      },
      {
        label: '$30+',
        min: 30,
        max: Infinity,
        count: 0,
        color: 'oklch(0.6 0.1 240)',
      },
    ];
    for (const d of deduped) {
      const t = tiers.find((t) => d.salePriceNum >= t.min && d.salePriceNum < t.max);
      if (t) t.count++;
    }
    const totalTiers = tiers.reduce((s, t) => s + t.count, 0) || 1;

    // Aggregate stats
    const avgSavings = deduped.length
      ? Math.round(deduped.reduce((s, d) => s + d.savingsNum, 0) / deduped.length)
      : 0;
    const totalSavings = deduped.reduce((s, d) => s + (d.normalPriceNum - d.salePriceNum), 0);
    const verifiedCount = deduped.filter((d) => isOfficialRetailer(d.storeID)).length;

    return {
      buckets,
      maxBucket,
      topStores,
      totalStoreDeals,
      tiers,
      totalTiers,
      avgSavings,
      totalSavings,
      verifiedCount,
      totalDeals: deduped.length,
    };
  }, [deals]);

  if (stats.totalDeals < 5) return null;

  return (
    <section id="stats" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <BarChart3 className="size-3.5" />
              Live analytics
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary animate-ticker-pulse" />
              </span>
              Real-time
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Deal <span className="text-gradient-emerald">statistics</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live breakdown of {stats.totalDeals} deduplicated deals across every storefront.
          </p>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={TrendingDown}
          label="Avg. savings"
          value={`${stats.avgSavings}%`}
          accent="text-primary"
          delay={0}
        />
        <StatCard
          icon={DollarSign}
          label="Total saved"
          value={`$${Math.round(stats.totalSavings).toLocaleString()}`}
          accent="text-hot"
          delay={80}
        />
        <StatCard
          icon={Store}
          label="Verified deals"
          value={`${stats.verifiedCount}`}
          suffix={`/ ${stats.totalDeals}`}
          accent="text-emerald-400"
          delay={160}
        />
        <StatCard
          icon={Activity}
          label="Active stores"
          value={`${stats.topStores.length}`}
          accent="text-fuchsia-300"
          delay={240}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Savings distribution bar chart */}
        <div className="rounded-2xl glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Savings distribution</h3>
              <p className="text-xs text-muted-foreground">How discounts are spread</p>
            </div>
            <BarChart3 className="size-4 text-muted-foreground" />
          </div>
          <div className="flex h-40 items-end justify-around gap-2 sm:gap-4">
            {stats.buckets.map((b, i) => {
              const heightPct = (b.count / stats.maxBucket) * 100;
              return (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                    {b.count}
                  </span>
                  <div className="relative flex w-full flex-1 items-end overflow-hidden rounded-t-lg bg-card/40">
                    <div
                      className="animate-stat-bar-grow w-full rounded-t-lg"
                      style={{
                        height: `${heightPct}%`,
                        background: `linear-gradient(180deg, ${b.color}, ${b.color} / 40%)`,
                        animationDelay: `${i * 100}ms`,
                        minHeight: b.count > 0 ? '8px' : '0',
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground">{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price tier donut chart */}
        <div className="rounded-2xl glass p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Price tiers</h3>
              <p className="text-xs text-muted-foreground">By price range</p>
            </div>
            <DollarSign className="size-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-4">
            <PriceTierDonut tiers={stats.tiers} total={stats.totalTiers} />
            <ul className="flex-1 space-y-1.5">
              {stats.tiers.map((t, i) => (
                <li
                  key={t.label}
                  className="flex items-center gap-2 text-xs"
                  style={{ animation: `fade-in-up 0.4s ease ${i * 60}ms both` }}
                >
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: t.color }} />
                  <span className="flex-1 truncate text-muted-foreground">{t.label}</span>
                  <span className="font-mono font-bold tabular-nums">{t.count}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round((t.count / stats.totalTiers) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Store share — horizontal bars */}
      <div className="mt-4 rounded-2xl glass p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Top stores by deal count</h3>
            <p className="text-xs text-muted-foreground">Where the deals are</p>
          </div>
          <Store className="size-4 text-muted-foreground" />
        </div>
        <ul className="space-y-2.5">
          {stats.topStores.map((st, i) => {
            const pct = (st.count / stats.totalStoreDeals) * 100;
            return (
              <li
                key={st.name}
                className="flex items-center gap-3"
                style={{ animation: `fade-in-up 0.4s ease ${i * 80}ms both` }}
              >
                <div className="flex w-32 shrink-0 items-center gap-2">
                  {st.logo && (
                    // biome-ignore lint/performance/noImgElement: CDN store logos
                    <img
                      src={st.logo}
                      alt=""
                      className="size-4 rounded-[3px] object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <span className="truncate text-xs font-medium">{st.name}</span>
                  {st.verified && (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-primary"
                      title="Verified retailer"
                    />
                  )}
                </div>
                <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-card/40">
                  <div
                    className="animate-stat-bar-grow h-full rounded-md bg-gradient-to-r from-primary/60 to-primary"
                    style={{
                      width: `${pct}%`,
                      animationDelay: `${i * 80 + 200}ms`,
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums text-foreground/80">
                    {st.count} deals
                  </span>
                </div>
                <span className="w-10 shrink-0 text-right text-[10px] font-medium text-muted-foreground tabular-nums">
                  {Math.round(pct)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
  accent: string;
  delay: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl glass p-3.5 lift-on-hover hover:border-primary/40"
      style={{
        animation: `fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className={cn('grid size-8 place-items-center rounded-lg bg-card/60', accent)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xl font-bold tabular-nums">
        {value}
        {suffix && <span className="ml-1 text-xs font-medium text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

/** Zero-dependency SVG donut chart with animated stroke draw-in. */
function PriceTierDonut({
  tiers,
  total,
}: {
  tiers: Array<{ label: string; count: number; color: string }>;
  total: number;
}) {
  const size = 96;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pre-compute each tier's dash length + offset using a pure reduce.
  // Mutating a let-variable (even inside useMemo) triggers the
  // react-hooks/immutability lint rule, so we use a functional accumulator.
  const arcs = React.useMemo(() => {
    return tiers.reduce<
      Array<{
        label: string;
        count: number;
        color: string;
        dashLength: number;
        startOffset: number;
      }>
    >((acc, t) => {
      const pct = t.count / total;
      const dashLength = pct * circumference;
      const startOffset =
        acc.length > 0 ? acc[acc.length - 1].startOffset + acc[acc.length - 1].dashLength : 0;
      return [
        // biome-ignore lint/performance/noAccumulatingSpread: known-size array
        ...acc,
        {
          label: t.label,
          count: t.count,
          color: t.color,
          dashLength,
          startOffset,
        },
      ];
    }, []);
  }, [tiers, total, circumference]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label="Price tier distribution donut chart"
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="oklch(1 0 0 / 5%)"
        strokeWidth={stroke}
      />
      {/* Tier arcs */}
      {arcs.map((arc, i) => (
        <circle
          key={arc.label}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
          strokeDashoffset={-arc.startOffset}
          strokeLinecap="butt"
          className="animate-donut-draw"
          style={
            {
              '--donut-circumference': circumference,
              '--donut-offset': -arc.startOffset,
              animationDelay: `${i * 150}ms`,
              transformOrigin: 'center',
            } as React.CSSProperties
          }
        />
      ))}
      {/* Center label */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-mono text-[14px] font-bold"
      >
        {total}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 12}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-muted-foreground text-[7px] font-semibold uppercase tracking-wider"
      >
        deals
      </text>
    </svg>
  );
}
