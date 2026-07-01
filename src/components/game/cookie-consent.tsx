'use client';

import { Check, Cookie, Info, ShieldCheck, X } from 'lucide-react';
import * as React from 'react';
import { openLegalDoc } from '@/components/game/legal-modal';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'dealforge-consent';

interface ConsentState {
  /** Has the user seen and dismissed the banner? */
  decided: boolean;
  /** ISO timestamp of the decision. */
  timestamp: string | null;
  /** Accepted (true) or rejected non-essential (false). Essential-only is always implied. */
  accepted: boolean;
  /** Schema version for future migration. */
  v: 1;
}

function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

function writeConsent(accepted: boolean) {
  const state: ConsentState = {
    decided: true,
    timestamp: new Date().toISOString(),
    accepted,
    v: 1,
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private-mode errors
  }
}

/**
 * LGPD/GDPR-compliant cookie consent banner. Shows once on first visit,
 * persists the decision in localStorage, and offers a "Manage preferences"
 * affordance that re-opens the banner from the footer.
 *
 * Designed to be honest: we set no tracking cookies, so the banner explains
 * what we actually use (local storage only) rather than dark-patterning.
 */
export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    // Small delay so the banner doesn't fight with the hero animation.
    const t = setTimeout(() => {
      const c = readConsent();
      if (!c?.decided) setVisible(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  // Allow re-opening from elsewhere (e.g. footer "Cookie preferences")
  React.useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('dealforge:open-consent', handler);
    return () => window.removeEventListener('dealforge:open-consent', handler);
  }, []);

  const accept = () => {
    writeConsent(true);
    setVisible(false);
  };

  const reject = () => {
    writeConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-6 sm:pb-6 animate-fade-in-up"
    >
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/60 glass-strong shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Cookie className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold leading-tight sm:text-base">
                We respect your privacy
              </h2>
              <button
                type="button"
                onClick={reject}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/30 hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              DEALFORGE uses <strong className="text-foreground/90">no tracking cookies</strong>. We
              use browser local storage to remember your wishlist, preferences, and alerts. We may earn
              a commission when you click deal links —{' '}
              <button
                type="button"
                onClick={() => openLegalDoc('affiliate')}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                read the disclosure
              </button>
              .
            </p>

            {expanded && (
              <div className="mt-3 space-y-2 rounded-xl border border-border/40 bg-card/30 p-3 animate-fade-in">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Essential local storage</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Wishlist, recently-viewed, theme, density. Required for the app to function.
                      <span className="ml-1 inline-flex items-center gap-0.5 font-semibold text-primary">
                        <Check className="size-3" /> Always on
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Analytics &amp; advertising</p>
                    <p className="mt-0.5 text-muted-foreground">
                      We don't use any. There's nothing to opt out of.{' '}
                      <button
                        type="button"
                        onClick={() => openLegalDoc('cookies')}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Cookie policy
                      </button>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Reset all local data (wishlist, compare, theme) — except consent itself
                    try {
                      localStorage.removeItem('dealforge-wishlist');
                      localStorage.removeItem('dealforge-compare');
                      localStorage.removeItem('dealforge-theme');
                    } catch {
                      /* ignore */
                    }
                    window.location.reload();
                  }}
                  className="mt-1 text-xs font-medium text-destructive underline-offset-2 hover:underline"
                >
                  Reset all local data
                </button>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                onClick={accept}
                size="sm"
                className="h-8 gap-1.5 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:brightness-110"
              >
                <Check className="size-3.5" />
                Accept
              </Button>
              <Button
                onClick={reject}
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-border/50 bg-card/40 px-3 text-xs font-medium hover:border-primary/40"
              >
                Essential only
              </Button>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="ml-auto text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {expanded ? 'Hide details' : 'Manage preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Trigger the consent banner to re-open (e.g. from a footer link). */
export function openConsentBanner() {
  window.dispatchEvent(new CustomEvent('dealforge:open-consent'));
}

/** Returns the current consent state (or null if undecided). */
export function getConsent(): ConsentState | null {
  return readConsent();
}
