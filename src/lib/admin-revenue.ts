export const REVENUE_PERIODS = ['7d', '30d', '90d', 'all'] as const;

export type RevenuePeriod = (typeof REVENUE_PERIODS)[number];

export const PERIOD_DAYS: Record<Exclude<RevenuePeriod, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function parseRevenuePeriod(value: unknown): RevenuePeriod {
  return typeof value === 'string' && (REVENUE_PERIODS as readonly string[]).includes(value)
    ? (value as RevenuePeriod)
    : '30d';
}

export function periodDays(period: RevenuePeriod): number | null {
  return period === 'all' ? null : PERIOD_DAYS[period];
}

export function periodLabel(period: RevenuePeriod): string {
  return period === 'all' ? 'all time' : `last ${PERIOD_DAYS[period]} days`;
}

export interface StoreRevenueRow {
  store_id: string;
  clicks: number;
  conversions: number;
  revenue_cents: number;
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toStoreCsv(rows: StoreRevenueRow[]): string {
  const lines = ['store_id,clicks,conversions,revenue_cents'];
  for (const r of rows) {
    lines.push([csvCell(r.store_id), r.clicks, r.conversions, r.revenue_cents].join(','));
  }
  return `${lines.join('\n')}\n`;
}
