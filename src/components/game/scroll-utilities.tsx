'use client';

import { ArrowUp } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Two utilities in one:
 *  1. A top scroll-progress bar (scaleX driven by a CSS custom property).
 *  2. A floating back-to-top button that fades in after scrolling down.
 *
 * Minimal JS — only a passive scroll listener updating a CSS var and a
 * visibility flag. All motion is CSS transitions.
 */
export function ScrollUtilities() {
  const [progress, setProgress] = React.useState(0);
  const [showTop, setShowTop] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(Math.max(p, 0), 1));
      setShowTop(scrollTop > 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] pointer-events-none" aria-hidden="true">
        <div
          className="scroll-progress h-full origin-left bg-gradient-to-r from-primary via-emerald-300 to-hot"
          style={{ ['--scroll-progress' as string]: progress }}
        />
      </div>

      {/* Back to top */}
      <button
        type="button"
        onClick={scrollTop}
        aria-label="Back to top"
        className={cn(
          'fixed bottom-6 right-6 z-50 grid size-11 place-items-center rounded-full border border-border/60 glass-strong shadow-lg shadow-black/30 transition-all duration-500 hover:border-primary/50 hover:shadow-primary/30',
          showTop
            ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
            : 'translate-y-4 opacity-0 scale-90 pointer-events-none'
        )}
      >
        <ArrowUp className="size-5 text-foreground transition-colors group-hover:text-primary" />
        <span className="absolute inset-0 rounded-full ring-1 ring-primary/0 transition-all hover:ring-primary/30" />
      </button>
    </>
  );
}
