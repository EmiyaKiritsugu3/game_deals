'use client';

import {
  ArrowDown,
  ArrowUp,
  Clock,
  CornerDownLeft,
  Flame,
  Hash,
  Heart,
  Search,
  Star,
  TrendingDown,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface CommandPaletteProps {
  deals: DealWithStore[];
  onOpenDetail?: (deal: DealWithStore) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandResult {
  deal: DealWithStore;
  score: number;
  matches: Array<{ text: string; matched: boolean }>;
}

/**
 * Fuzzy-match scoring: returns a score (higher = better match) and the
 * tokenized title with matched characters highlighted.
 *
 * Simple subsequence matching: each query char must appear in order in the
 * title. Score = matched chars / title length, with a bonus for consecutive
 * matches and a penalty for gaps.
 */
function fuzzyMatch(query: string, title: string): { score: number; matches: boolean[] } | null {
  const q = query.toLowerCase();
  const t = title.toLowerCase();
  if (!q) return { score: 1, matches: new Array(t.length).fill(false) };

  let qi = 0;
  let score = 0;
  let consecutive = 0;
  const matches = new Array(t.length).fill(false);

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      matches[ti] = true;
      qi++;
      consecutive++;
      score += 1 + consecutive * 0.5; // bonus for consecutive
    } else {
      consecutive = 0;
      score -= 0.1; // small penalty for gaps
    }
  }

  if (qi < q.length) return null; // didn't match all query chars
  return { score: score / t.length, matches };
}

const RECENT_SEARCHES_KEY = 'dealforge-recent-searches';

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const recent = loadRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5)));
  } catch {
    // ignore
  }
}

export function CommandPalette({ deals, onOpenDetail, open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wishlistHas = useWishlist((s) => s.has);

  // Load recent searches on open
  React.useEffect(() => {
    if (open) {
      setRecentSearches(loadRecentSearches());
      setQuery('');
      setSelectedIndex(0);
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Dedupe deals for search corpus
  const corpus = React.useMemo(() => dedupeToList(deals, 60), [deals]);

  // Compute local results (instant fuzzy search on loaded deals)
  const localResults = React.useMemo<CommandResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.trim();
    const matched: CommandResult[] = [];
    for (const deal of corpus) {
      const match = fuzzyMatch(q, deal.title);
      if (match) {
        // Bonus for high-rated deals
        const ratingBonus = deal.dealRatingNum > 8 ? 0.2 : 0;
        const savingsBonus = deal.savingsNum > 80 ? 0.15 : 0;
        matched.push({
          deal,
          score: match.score + ratingBonus + savingsBonus,
          matches: match.matches.map((m) => ({ text: '', matched: m })),
        });
      }
    }
    return matched.sort((a, b) => b.score - a.score);
  }, [query, corpus]);

  // Server-side search (debounced, for broader 60K+ catalog coverage)
  const [serverResults, setServerResults] = React.useState<CommandResult[]>([]);
  const [serverLoading, setServerLoading] = React.useState(false);
  // Use a ref for local deal IDs so the effect doesn't depend on localResults array identity
  const localDealIdsRef = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    localDealIdsRef.current = new Set(localResults.map((r) => r.deal.dealID));
  }, [localResults]);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setServerResults([]);
      setServerLoading(false);
      return;
    }
    setServerLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games?title=${encodeURIComponent(q)}`);
        // biome-ignore lint/suspicious/noExplicitAny: API JSON shape
        const data: any = await res.json();
        if (data.games && Array.isArray(data.games)) {
          // Convert GameSearchResult → DealWithStore-like for uniform rendering
          // Note: CheapShark's game search returns `external` for the title, not `title`
          const serverDeals: DealWithStore[] = data.games
            .slice(0, 8)
            .map(
              (g: {
                gameID: string;
                title?: string;
                external?: string;
                thumb: string;
                cheapest: string;
                cheapestDealID: string;
              }) => {
                const title = g.title || g.external || 'Unknown';
                return {
                  internalName:
                    // biome-ignore lint/suspicious/noExplicitAny: API JSON
                    (g as any).internalName || title.toLowerCase().replace(/[^a-z0-9]/g, ''),
                  title,
                  metacriticLink: null,
                  dealID: g.cheapestDealID,
                  storeID: '',
                  gameID: g.gameID,
                  steamAppID: null,
                  salePrice: g.cheapest,
                  normalPrice: g.cheapest,
                  isOnSale: 'false',
                  savings: '0',
                  metacriticScore: '0',
                  steamRatingPercent: '0',
                  steamRatingText: '',
                  steamRatingCount: '0',
                  releaseDate: 0,
                  lastChange: 0,
                  dealRating: '0',
                  thumb: g.thumb,
                  store: undefined,
                  salePriceNum: Number(g.cheapest) || 0,
                  normalPriceNum: Number(g.cheapest) || 0,
                  savingsNum: 0,
                  dealRatingNum: 0,
                  metacriticScoreNum: 0,
                  steamRatingNum: 0,
                  releaseDateMs: 0,
                  releaseDateLabel: '—',
                  isFree: Number(g.cheapest) === 0,
                };
              }
            );
          // Filter out any that are already in local results (by dealID)
          const newResults: CommandResult[] = serverDeals
            .filter((d) => !localDealIdsRef.current.has(d.dealID))
            .map((deal) => ({
              deal,
              score: 0.5, // lower than local results
              matches: [],
            }));
          setServerResults(newResults);
        }
      } catch {
        setServerResults([]);
      } finally {
        setServerLoading(false);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(t);
  }, [query]); // Only depend on query — local IDs read from ref

  // Merge local + server results
  const results = React.useMemo<CommandResult[]>(() => {
    return [...localResults, ...serverResults].slice(0, 8);
  }, [localResults, serverResults]);

  // Reset selection when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, []);

  const handleSelect = (result: CommandResult) => {
    saveRecentSearch(query);
    onOpenDetail?.(result.deal);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  const handleRecentSearch = (s: string) => {
    setQuery(s);
    inputRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong overflow-hidden border-border/60 p-0 sm:max-w-2xl sm:rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Search deals</DialogTitle>
          <DialogDescription>
            Fuzzy search across all loaded deals. Use arrow keys to navigate, Enter to open.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative border-b border-border/40">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search deals by title…"
            className="h-14 w-full bg-transparent pl-12 pr-20 text-base placeholder:text-muted-foreground/60 focus:outline-none"
            aria-label="Search deals"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-card/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results / suggestions */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query.trim() ? (
            /* Empty state: recent searches + popular */
            <div className="p-2">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Clock className="size-3" />
                    Recent searches
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleRecentSearch(s)}
                        className="rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Flame className="size-3" />
                Trending searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['Suicide Squad', 'Free', 'NBA', 'Under $5', 'Indie'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleRecentSearch(s)}
                    className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                  >
                    <Hash className="size-2.5" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="grid place-items-center py-12 text-center">
              <Search className="size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium">No deals found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {results.map((result, i) => {
                const { deal } = result;
                const isSelected = i === selectedIndex;
                const has = wishlistHas(deal.dealID);
                return (
                  <li key={deal.dealID}>
                    <button
                      type="button"
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all',
                        isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-accent/20'
                      )}
                    >
                      {/* Cover */}
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-card/60">
                        <Image
                          src={deal.thumb}
                          alt={deal.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* Title + meta */}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold">{deal.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          {deal.store && <span className="truncate">{deal.store.storeName}</span>}
                          {deal.dealRatingNum > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <Star className="size-2.5 fill-amber-400 text-amber-400" />
                              {deal.dealRating}
                            </span>
                          )}
                          {deal.savingsNum > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-primary">
                              <TrendingDown className="size-2.5" />
                              {Math.round(deal.savingsNum)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold text-gradient-emerald">
                          {deal.isFree ? 'FREE' : `$${deal.salePrice}`}
                        </p>
                        {!deal.isFree && deal.normalPriceNum > deal.salePriceNum && (
                          <p className="text-[10px] text-muted-foreground line-through tabular-nums">
                            ${deal.normalPrice}
                          </p>
                        )}
                      </div>

                      {/* Wishlist indicator */}
                      {has && <Heart className="size-3.5 shrink-0 fill-primary text-primary" />}

                      {/* Selected indicator */}
                      {isSelected && (
                        <CornerDownLeft className="size-3.5 shrink-0 text-primary animate-pulse" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border/60 bg-card/60 px-1 py-0.5 font-mono">
                <ArrowUp className="size-2.5" />
              </kbd>
              <kbd className="rounded border border-border/60 bg-card/60 px-1 py-0.5 font-mono">
                <ArrowDown className="size-2.5" />
              </kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border/60 bg-card/60 px-1 py-0.5 font-mono">
                <CornerDownLeft className="size-2.5" />
              </kbd>
              open
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5">
            {serverLoading && (
              <span className="inline-flex items-center gap-1 text-primary">
                <span className="size-1.5 animate-ping rounded-full bg-primary" />
                searching catalog…
              </span>
            )}
            {!serverLoading && `${results.length} results`}
            {serverResults.length > 0 && !serverLoading && (
              <span className="text-muted-foreground/60">
                · {serverResults.length} from catalog
              </span>
            )}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
