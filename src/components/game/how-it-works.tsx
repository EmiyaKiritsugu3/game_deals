'use client';

import { Bell, Search, ShieldCheck, ShoppingBag } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Discover',
    body: 'Search 60,000+ titles or browse curated deals across every major PC storefront in one place.',
    accent: 'from-primary/20 to-primary/5',
  },
  {
    icon: Bell,
    title: 'Track',
    body: 'Add games to your wishlist and watch live prices. We refresh deals every five minutes.',
    accent: 'from-hot/20 to-hot/5',
  },
  {
    icon: ShoppingBag,
    title: 'Claim',
    body: 'Click through to the verified store with the lowest price. No middleman, no markup.',
    accent: 'from-primary/20 to-primary/5',
  },
  {
    icon: ShieldCheck,
    title: 'Save',
    body: 'Rest easy knowing you paid the best available price. Average savings exceed 50%.',
    accent: 'from-primary/20 to-primary/5',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          How it works
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          From search to savings in 4 steps
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          No accounts, no friction. Just the lowest verified prices, refreshed constantly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="group relative overflow-hidden rounded-2xl glass p-6 lift-on-hover hover:border-primary/40"
            style={{
              animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 100}ms both`,
            }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${step.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl border border-border/60 bg-card/60 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <step.icon className="size-5 text-primary" />
                </span>
                <span className="font-mono text-3xl font-bold text-muted-foreground/20 transition-colors group-hover:text-primary/30">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
