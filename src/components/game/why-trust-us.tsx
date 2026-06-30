'use client';

import { Activity, ArrowRight, BadgeCheck, Eye, ShieldOff } from 'lucide-react';
import { openLegalDoc } from '@/components/game/legal-modal';
import { cn } from '@/lib/utils';

const PILLARS = [
  {
    icon: Activity,
    title: 'Real-time data',
    body: 'Prices stream directly from the CheapShark API and refresh every 5 minutes. No stale caches, no scraped screenshots — just live retailer data.',
    accent: 'from-primary/20 to-primary/5',
    iconBg: 'bg-primary/15 text-primary',
    stat: '5 min',
    statLabel: 'refresh cycle',
  },
  {
    icon: ShieldOff,
    title: 'No middleman',
    body: "DEALFORGE never touches your payment. When you click a deal, you're redirected to the retailer's own checkout. We don't store cards, we don't process keys, we don't handle refunds.",
    accent: 'from-hot/20 to-hot/5',
    iconBg: 'bg-hot/15 text-hot',
    stat: '0',
    statLabel: 'payments processed',
  },
  {
    icon: Eye,
    title: 'Privacy-first',
    body: "Your wishlist lives in your browser's local storage — never on our servers. No account, no email, no tracking cookies, no analytics. Your data stays on your device.",
    accent: 'from-fuchsia-500/20 to-fuchsia-500/5',
    iconBg: 'bg-fuchsia-500/15 text-fuchsia-300',
    stat: '0',
    statLabel: 'tracking cookies',
  },
  {
    icon: BadgeCheck,
    title: 'Transparent',
    body: "We're upfront about our affiliate model, our data sources, and our ranking methodology. Official retailers get a Verified badge so you know which stores are safe.",
    accent: 'from-primary/20 to-primary/5',
    iconBg: 'bg-primary/15 text-primary',
    stat: '100%',
    statLabel: 'open about funding',
  },
] as const;

export function WhyTrustUs() {
  return (
    <section id="trust" className="mx-auto mt-24 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary animate-fade-in-down">
          <BadgeCheck className="size-3.5" />
          Trust &amp; transparency
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl animate-fade-in-up">
          Why you can trust <span className="text-gradient-emerald">DEALFORGE</span>
        </h2>
        <p
          className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          We built this site to be the deals aggregator we'd want to use ourselves — honest,
          private, and obsessively accurate. Here's our commitment to you.
        </p>
      </div>

      {/* Pillars grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="group relative overflow-hidden rounded-2xl glass p-5 lift-on-hover hover:border-primary/40"
              style={{
                animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 100}ms both`,
              }}
            >
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                  p.accent
                )}
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'grid size-11 place-items-center rounded-xl border border-border/60 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6',
                      p.iconBg
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold tabular-nums text-gradient-emerald">
                      {p.stat}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {p.statLabel}
                    </p>
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commitment strip — links to legal docs */}
      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/40 glass p-4 sm:flex-row sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Our commitments, in writing</p>
            <p className="text-xs text-muted-foreground">
              Read the policies that back up every promise above.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CommitmentButton label="Privacy policy" docKey="privacy" />
          <CommitmentButton label="Affiliate disclosure" docKey="affiliate" />
          <CommitmentButton label="Terms of use" docKey="terms" />
        </div>
      </div>
    </section>
  );
}

function CommitmentButton({
  label,
  docKey,
}: {
  label: string;
  docKey: 'privacy' | 'terms' | 'affiliate' | 'cookies' | 'accessibility';
}) {
  return (
    <button
      onClick={() => openLegalDoc(docKey)}
      className="group inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
    >
      {label}
      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
