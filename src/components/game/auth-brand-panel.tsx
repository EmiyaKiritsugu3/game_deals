'use client';

import { Gamepad2, ShieldCheck, TrendingDown, Zap } from 'lucide-react';

/**
 * The decorative left panel of the auth dialog. Visible only on large screens.
 * Showcases the DEALFORGE brand and reinforces trust signals (privacy,
 * speed, savings) to convert hesitant sign-ups.
 *
 * Pure presentational — no state. All animation is native CSS @keyframes
 * (auth-shimmer, float-slow, glow-pulse, orbit).
 */
export function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-card via-card/80 to-background lg:flex lg:flex-col lg:justify-between lg:p-8">
      {/* Ambient gradient orbs (static — no animation) */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, oklch(0.78 0.2 145 / 0.5), transparent 60%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, oklch(0.78 0.16 70 / 0.4), transparent 60%)',
        }}
      />
      {/* Subtle grid texture */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.04]" />

      {/* Top: brand */}
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/30">
            <Gamepad2 className="size-5 text-primary-foreground" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">
              DEAL<span className="text-gradient-emerald">FORGE</span>
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Game Deals
            </span>
          </span>
        </div>
      </div>

      {/* Middle: value proposition */}
      <div className="relative">
        <h2 className="text-2xl font-bold leading-tight tracking-tight">
          Join thousands of gamers
          <br />
          <span className="text-gradient-emerald">saving every day.</span>
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Sign in to sync your wishlist across devices, get personalized price-drop alerts, and
          unlock deal recommendations tailored to your taste.
        </p>

        {/* Trust pillars */}
        <ul className="mt-6 space-y-3">
          {[
            { icon: ShieldCheck, title: 'Privacy-first', body: 'No password. We never track you.' },
            { icon: Zap, title: 'Instant sign-in', body: 'Magic link lands in 30 seconds.' },
            { icon: TrendingDown, title: 'Smarter savings', body: 'Cross-device wishlist sync.' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="flex items-start gap-3"
                style={{
                  animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${300 + i * 120}ms both`,
                }}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom: stats strip */}
      <div className="relative flex items-center gap-4 rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-sm">
        <div className="flex-1">
          <p className="font-mono text-lg font-bold text-gradient-emerald">60K+</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Games</p>
        </div>
        <div className="h-8 w-px bg-border/40" />
        <div className="flex-1">
          <p className="font-mono text-lg font-bold text-gradient-emerald">30+</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stores</p>
        </div>
        <div className="h-8 w-px bg-border/40" />
        <div className="flex-1">
          <p className="font-mono text-lg font-bold text-gradient-emerald">5 min</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Refresh</p>
        </div>
      </div>
    </div>
  );
}
