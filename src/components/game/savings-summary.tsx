'use client';

import { PiggyBank, TrendingDown, Wallet } from 'lucide-react';
import * as React from 'react';
import type { DealWithStore } from '@/lib/types';

interface SavingsSummaryProps {
  deals: DealWithStore[];
}

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = React.useState(0);
  const prev = React.useRef(0);
  React.useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const from = prev.current;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      const eased = p === 1 ? 1 : 1 - 2 ** (-10 * p);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function SavingsSummary({ deals }: SavingsSummaryProps) {
  const stats = React.useMemo(() => {
    const totalRetail = deals.reduce((s, d) => s + d.normalPriceNum, 0);
    const totalCurrent = deals.reduce((s, d) => s + d.salePriceNum, 0);
    const totalSaved = Math.max(0, totalRetail - totalCurrent);
    const freeCount = deals.filter((d) => d.isFree).length;
    return {
      totalRetail,
      totalCurrent,
      totalSaved,
      freeCount,
      count: deals.length,
    };
  }, [deals]);

  const saved = useCountUp(stats.totalSaved);
  const current = useCountUp(stats.totalCurrent);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <PiggyBank className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            You could save
          </p>
          <p className="font-mono text-lg font-bold tabular-nums text-gradient-emerald">
            ${saved.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2.5 rounded-xl border border-border/40 bg-card/30 px-3.5 py-2">
        <span className="grid size-8 place-items-center rounded-lg bg-card/60 text-muted-foreground">
          <Wallet className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total for {stats.count} deals
          </p>
          <p className="font-mono text-lg font-bold tabular-nums">${current.toFixed(2)}</p>
        </div>
      </div>

      {stats.freeCount > 0 && (
        <div className="inline-flex items-center gap-2.5 rounded-xl border border-hot/30 bg-hot/10 px-3.5 py-2">
          <span className="grid size-8 place-items-center rounded-lg bg-hot/20 text-hot">
            <TrendingDown className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hot">
              Free to claim
            </p>
            <p className="font-mono text-lg font-bold tabular-nums text-hot">
              {stats.freeCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
