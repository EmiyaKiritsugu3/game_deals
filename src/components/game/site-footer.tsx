'use client';

import { Activity, Gamepad2, Heart, Rss, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

/** Simple inline SVGs for brand icons removed from lucide 1.21 */
function TwitterIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
      <title>X (Twitter)</title>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function GithubIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
      <title>GitHub</title>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

import { openConsentBanner } from '@/components/game/cookie-consent';
import { type LegalDocKey, openLegalDoc } from '@/components/game/legal-modal';
import { cn } from '@/lib/utils';

interface StatusState {
  ok: boolean;
  lastCheck: number | null;
  loading: boolean;
}

/**
 * Lightweight API health indicator. Pings /api/stores every 60s; shows a
 * green dot when healthy, amber when degraded, red when down.
 */
function useStatusIndicator(): StatusState {
  const [state, setState] = React.useState<StatusState>({
    ok: true,
    lastCheck: null,
    loading: true,
  });

  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/stores', { cache: 'no-store' });
        if (cancelled) return;
        setState({ ok: res.ok, lastCheck: Date.now(), loading: false });
      } catch {
        if (!cancelled) setState({ ok: false, lastCheck: Date.now(), loading: false });
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}

function StatusBadge() {
  const status = useStatusIndicator();
  const label = status.loading
    ? 'Checking…'
    : status.ok
      ? 'All systems operational'
      : 'Degraded — using cache';
  const dotCls = status.loading
    ? 'bg-muted-foreground animate-pulse'
    : status.ok
      ? 'bg-emerald-400 animate-blink-soft'
      : 'bg-amber-400 animate-blink-soft';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-[10px] font-medium"
      title={
        status.lastCheck
          ? `Last checked ${new Date(status.lastCheck).toLocaleTimeString()}`
          : 'Checking status…'
      }
    >
      <Activity className="size-3 text-muted-foreground" />
      <span className={cn('size-1.5 rounded-full', dotCls)} />
      {label}
    </span>
  );
}

const LEGAL_LINKS: { label: string; docKey: LegalDocKey }[] = [
  { label: 'Privacy', docKey: 'privacy' },
  { label: 'Terms', docKey: 'terms' },
  { label: 'Affiliate disclosure', docKey: 'affiliate' },
  { label: 'Cookies', docKey: 'cookies' },
  { label: 'Accessibility', docKey: 'accessibility' },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto relative overflow-hidden border-t border-border/40 glass-nav">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="#top" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/30">
                <Gamepad2 className="size-5 text-primary-foreground" />
              </span>
              <span className="text-[15px] font-bold tracking-tight">
                DEAL<span className="text-gradient-emerald">FORGE</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The premium game deals aggregator. Live prices across every major storefront,
              refreshed every 5 minutes.
            </p>
            <div className="mt-3">
              <StatusBadge />
            </div>
            <div className="mt-3 flex items-center gap-2">
              {[
                { Icon: TwitterIcon, label: 'Twitter' },
                { Icon: GithubIcon, label: 'GitHub' },
                { Icon: Rss, label: 'RSS' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="/privacy"
                  aria-label={label}
                  className="grid size-8 place-items-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { label: 'All deals', href: '#deals' },
                { label: 'Featured', href: '#featured' },
                { label: 'Free games', href: '#free' },
                { label: 'Newly added', href: '#newly-added' },
                { label: 'Trending', href: '#trending' },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Resources
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="#how"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#trust"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Why trust us
                </a>
              </li>
              <li>
                <a
                  href="https://apidocs.cheapshark.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  CheapShark API
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openConsentBanner()}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cookie preferences
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('dealforge:open-preferences'))
                  }
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  User preferences
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Legal
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}>
                  <button
                    type="button"
                    onClick={() => openLegalDoc(l.docKey)}
                    className="text-left text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Affiliate disclosure strip — visible, honest, FTC-compliant */}
        <div className="mt-8 rounded-xl border border-border/40 bg-card/30 p-3">
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              <strong className="font-semibold text-foreground/90">Affiliate disclosure:</strong>{' '}
              Deal links on DEALFORGE are affiliate links. We may earn a commission when you
              complete a purchase — at <strong>no extra cost to you</strong>. Rankings are never
              influenced by commission.{' '}
              <button
                type="button"
                onClick={() => openLegalDoc('affiliate')}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Read full disclosure
              </button>
              .
            </span>
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DEALFORGE. Data by{' '}
            <a
              href="https://apidocs.cheapshark.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              CheapShark
            </a>
            . Not affiliated with Steam, Epic, or any retailer.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            Built with <Heart className="size-3 fill-primary text-primary" /> for gamers
          </p>
        </div>
      </div>
    </footer>
  );
}
