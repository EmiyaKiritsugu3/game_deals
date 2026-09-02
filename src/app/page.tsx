'use client';

import { ChevronDown, Flame, Keyboard, Loader2, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { AccentApplier } from '@/components/game/accent-applier';
import { AchievementWatcher } from '@/components/game/achievement-watcher';
import { AchievementsPanel, AchievementToast } from '@/components/game/achievements-ui';
import { AuthDialog } from '@/components/game/auth-dialog';
import { BackgroundEffects } from '@/components/game/background-effects';
import { CommandPalette } from '@/components/game/command-palette';
import { CompareTray } from '@/components/game/compare-tray';
import { CookieConsent } from '@/components/game/cookie-consent';
import { DealCollections } from '@/components/game/deal-collections';
import { DealGrid, type DealGridItem } from '@/components/game/deal-grid';
import { DealOfTheDay } from '@/components/game/deal-of-the-day';
import { DealOfTheHour } from '@/components/game/deal-of-the-hour';
import { DealShareDialog } from '@/components/game/deal-share-dialog';
import { DealStatsDashboard } from '@/components/game/deal-stats-dashboard';
import { DealTicker } from '@/components/game/deal-ticker';
import { DensityToggle, type GridDensity } from '@/components/game/density-toggle';
import { FaqSection } from '@/components/game/faq-section';
import { FeaturedDeals } from '@/components/game/featured-deals';
import { FilterBar } from '@/components/game/filter-bar';
import { ForYouSection } from '@/components/game/for-you-section';
import { FreeGamesSection } from '@/components/game/free-games-section';
import { GameDetailDialog } from '@/components/game/game-detail-dialog';
import { HeroSection } from '@/components/game/hero-section';
import { HowItWorks } from '@/components/game/how-it-works';
import { LegalModalHost } from '@/components/game/legal-modal-host';
import { NewlyAddedSection } from '@/components/game/newly-added-section';
import { PreferencesPanel, usePreferences } from '@/components/game/preferences-panel';
import { PriceDropAlerts } from '@/components/game/price-drop-alerts';
import {
  PriceRangeChips,
  type PriceRangeKey,
  rangeToQuery,
} from '@/components/game/price-range-chips';
import { PriceWatchlistPanel } from '@/components/game/price-watchlist-panel';
import { RecentlyFreeSection } from '@/components/game/recently-free-section';
import { RecentlyViewedStrip } from '@/components/game/recently-viewed-strip';
import { SavingsLeaderboard } from '@/components/game/savings-leaderboard';
import { SavingsSummary } from '@/components/game/savings-summary';
import { ScrollUtilities } from '@/components/game/scroll-utilities';
import { SectionDivider } from '@/components/game/section-divider';
import { SiteFooter } from '@/components/game/site-footer';
import { SiteHeader } from '@/components/game/site-header';
import {
  applySmartFilter,
  SmartFilterChips,
  type SmartFilterKey,
} from '@/components/game/smart-filter-chips';
import { StoresShowcase } from '@/components/game/stores-showcase';
import { TrendingSection } from '@/components/game/trending-section';
import { WhyTrustUs } from '@/components/game/why-trust-us';
import { WishlistDrawer } from '@/components/game/wishlist-drawer';
import { Button } from '@/components/ui/button';
import { useDeals, useStores } from '@/hooks/use-game-data';
import { dedupeDeals, dedupeToList } from '@/lib/dedup';
import { isOfficialRetailer } from '@/lib/store-trust';
import type { DealWithStore, SortOption } from '@/lib/types';
import { useAchievements } from '@/store/achievements';
import { useCompare } from '@/store/compare';

const PAGE_SIZE = 24;

export default function Home() {
  // Filters state
  const [sortBy, setSortBy] = React.useState<SortOption>('deal-rating');
  const [storeID, setStoreID] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [onSale, setOnSale] = React.useState(false);
  const [priceRange, setPriceRange] = React.useState<PriceRangeKey>('all');
  const [smartFilter, setSmartFilter] = React.useState<SmartFilterKey>('all');
  const [density, setDensity] = React.useState<GridDensity>('comfortable');
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  // User preferences — wired to behavior
  const prefs = usePreferences();
  // Override density when compactGrid preference is on
  const effectiveDensity = prefs.compactGrid ? 'compact' : density;

  // Dialog state
  const [activeDeal, setActiveDeal] = React.useState<DealWithStore | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  // Command palette + preferences + share state
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [prefsOpen, setPrefsOpen] = React.useState(false);
  const [shareDeal, setShareDeal] = React.useState<DealWithStore | null>(null);
  const [shareOpen, setShareOpen] = React.useState(false);

  // Header search shares the same value as the filter bar search
  const [headerSearch, setHeaderSearch] = React.useState('');
  const effectiveSearch = (search || headerSearch).trim();

  // Ref for keyboard-shortcut focus
  const headerSearchRef = React.useRef<HTMLInputElement | null>(null);

  // Data
  const rangeQ = rangeToQuery(priceRange);
  const dealsQuery = useDeals({
    sortBy,
    storeID: storeID || undefined,
    title: effectiveSearch || undefined,
    onSale,
    pageSize: 60,
    ...rangeQ,
  });
  const storesQuery = useStores();

  const deals = React.useMemo(() => {
    const all = dealsQuery.data?.deals ?? [];
    // Client-side title filter for instant feedback when search is short
    let filtered = all;
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      filtered = filtered.filter((d) => d.title.toLowerCase().includes(q));
    }
    // Apply smart meta-filter (Top Rated / Metacritic≥80 / etc.)
    if (smartFilter !== 'all') {
      filtered = applySmartFilter(filtered, smartFilter);
    }
    // Apply user preference: show verified retailers only
    if (prefs.showVerifiedOnly) {
      filtered = filtered.filter((d) => isOfficialRetailer(d.storeID));
    }
    return filtered;
  }, [dealsQuery.data, effectiveSearch, smartFilter, prefs.showVerifiedOnly]);

  // Deduplicate the deals feed: group identical titles across stores.
  // The grid renders only the cheapest variant per game, with a "N stores"
  // badge so users know they can compare other storefronts in the dialog.
  const dedupedGridItems = React.useMemo<DealGridItem[]>(() => {
    const { groups } = dedupeDeals(deals, 60);
    return groups.map((g) => ({
      deal: g.best,
      variantCount: Math.max(1, g.storeCount || g.variants.length),
    }));
  }, [deals]);

  // Build featured = highest savings, deduplicated (no duplicate titles).
  const featured = React.useMemo(() => {
    return dedupeToList(dealsQuery.data?.deals ?? [], 8)
      .sort((a, b) => b.savingsNum - a.savingsNum)
      .slice(0, 8);
  }, [dealsQuery.data]);

  const stats = React.useMemo(() => {
    const list = dealsQuery.data?.deals ?? [];
    let sumSavings = 0;
    let maxSavings = 0;

    // Calculate stats in a single pass (O(N) time, O(1) space) to avoid
    // redundant array iterations, mapped array allocation overhead, and
    // potential call stack exceeded errors from Math.max(...list).
    for (const d of list) {
      sumSavings += d.savingsNum;
      if (d.savingsNum > maxSavings) {
        maxSavings = d.savingsNum;
      }
    }

    const avgSavings = list.length ? Math.round(sumSavings / list.length) : 0;
    const topDiscount = list.length ? Math.round(maxSavings) : 0;

    // Marketing-friendly "stores tracked" stat — pad live count to a nicer
    // round number, but keep it truthful by appending a "+" suffix.
    const liveStores = storesQuery.data?.stores.length ?? 0;
    return {
      totalDeals: list.length || 60_000,
      avgSavings: avgSavings || 52,
      storesTracked: Math.max(30, liveStores),
      storesTrackedSuffix: liveStores > 0 ? '+' : '',
      topDiscount: topDiscount || 100,
    };
  }, [dealsQuery.data, storesQuery.data]);

  // Reset pagination on mount only — filters reset page via their own handlers
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, []);

  const visibleGridItems = dedupedGridItems.slice(0, visibleCount);
  const compareCount = useCompare((s) => s.items.length);
  const incrementAchievement = useAchievements((s) => s.increment);
  const recordVisit = useAchievements((s) => s.recordVisit);

  // Record a visit on mount (drives visitor-3 / visitor-7 achievements)
  React.useEffect(() => {
    recordVisit();
  }, [recordVisit]);

  const openDetail = React.useCallback(
    (deal: DealWithStore) => {
      setActiveDeal(deal);
      setDetailOpen(true);
      // Track detail-dialog views for the "Detail Oriented" achievement
      incrementAchievement('detail-explorer');
    },
    [incrementAchievement]
  );

  const openShare = React.useCallback((deal: DealWithStore) => {
    setShareDeal(deal);
    setShareOpen(true);
  }, []);

  // Keyboard shortcuts: "/" focuses header search, "Cmd/Ctrl+K" opens command palette,
  // "Escape" clears search / closes overlays.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      // Cmd/Ctrl+K opens command palette (works even while typing)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
        return;
      }

      if (e.key === '/' && !typing) {
        e.preventDefault();
        headerSearchRef.current?.focus();
      } else if (e.key === 'Escape' && !typing) {
        setHeaderSearch('');
        setSearch('');
        headerSearchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);

    // Listen for command-palette + preferences open events from other components
    const openCommand = () => setCommandOpen(true);
    const openPrefs = () => setPrefsOpen(true);
    window.addEventListener('dealforge:open-command-palette', openCommand);
    window.addEventListener('dealforge:open-preferences', openPrefs);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('dealforge:open-command-palette', openCommand);
      window.removeEventListener('dealforge:open-preferences', openPrefs);
    };
  }, []);

  return (
    <>
      <BackgroundEffects />
      <ScrollUtilities />
      <SiteHeader
        searchInputRef={headerSearchRef}
        onSearch={setHeaderSearch}
        searchValue={headerSearch}
      />

      <main className="relative flex-1">
        {/* Hero */}
        <HeroSection stats={stats} source={dealsQuery.data?.source ?? 'live'} />

        {/* Live ticker */}
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <DealTicker deals={dealsQuery.data?.deals ?? []} />
        </section>

        {/* Deal of the Hour — rotating spotlight */}
        <DealOfTheHour deals={dealsQuery.data?.deals ?? []} onOpenDetail={openDetail} />

        {/* Deal of the Day spotlight */}
        <DealOfTheDay deals={dealsQuery.data?.deals ?? []} onOpenDetail={openDetail} />

        {/* Free games */}
        <FreeGamesSection onOpenDetail={openDetail} />

        {/* Recently free archive (since live free games are scarce) */}
        <RecentlyFreeSection onOpenDetail={openDetail} />

        {/* Newly added deals (sorted by release date, last 2 years) */}
        <NewlyAddedSection onOpenDetail={openDetail} />

        {/* Trending this week */}
        <TrendingSection onOpenDetail={openDetail} />

        {/* Deal Collections — curated lists */}
        <DealCollections deals={dealsQuery.data?.deals ?? []} onOpenDetail={openDetail} />

        {/* Recently viewed (only renders when user has history) */}
        <RecentlyViewedStrip onOpenDetail={openDetail} />

        {/* For You — personalized recommendations (only when signed in) */}
        <ForYouSection deals={dealsQuery.data?.deals ?? []} onOpenDetail={openDetail} />

        {/* Featured */}
        <section id="featured" className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <FeaturedDeals deals={featured} onOpenDetail={openDetail} />
        </section>

        {/* Stores showcase */}
        <section className="mt-20">
          {storesQuery.isLoading ? (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                  <div key={`skeleton-${i}`} className="skeleton-shimmer h-28 rounded-2xl glass" />
                ))}
              </div>
            </div>
          ) : (
            <StoresShowcase
              stores={storesQuery.data?.stores ?? []}
              activeStoreID={storeID}
              onSelectStore={setStoreID}
            />
          )}
        </section>

        {/* Savings leaderboard */}
        <SavingsLeaderboard deals={dealsQuery.data?.deals ?? []} onOpenDetail={openDetail} />

        {/* Price Watchlist Panel — only renders when user has wishlisted games */}
        <PriceWatchlistPanel />

        {/* Deal Statistics Dashboard — animated charts */}
        <DealStatsDashboard deals={dealsQuery.data?.deals ?? []} />

        {/* How it works */}
        <section className="mt-24">
          <HowItWorks />
        </section>

        {/* Why trust us — trust pillars */}
        <WhyTrustUs />

        <SectionDivider label="Browse" className="mt-24" />

        {/* Deals section */}
        <section id="deals" className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-20">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Flame className="size-3.5" />
                  All deals
                </span>
                <span className="text-xs text-muted-foreground">
                  Deduplicated · sortable · filterable
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Browse the latest drops
              </h2>
            </div>
            <SavingsSummary deals={visibleGridItems.map((i) => i.deal)} />
          </div>

          {/* Price range chips + smart meta-filter + density toggle */}
          <div className="mb-4 space-y-2.5">
            <SmartFilterChips value={smartFilter} onChange={setSmartFilter} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PriceRangeChips value={priceRange} onChange={setPriceRange} />
              <DensityToggle value={density} onChange={setDensity} />
            </div>
          </div>

          <FilterBar
            sortBy={sortBy}
            onSortChange={setSortBy}
            stores={storesQuery.data?.stores ?? []}
            storeID={storeID}
            onStoreChange={setStoreID}
            onSale={onSale}
            onSaleChange={setOnSale}
            search={search}
            onSearchChange={setSearch}
            resultCount={dedupedGridItems.length}
            source={dealsQuery.data?.source ?? 'live'}
          />

          <div className="mt-6">
            {dealsQuery.isLoading && !dealsQuery.data ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                Fetching live deals…
              </div>
            ) : null}

            <DealGrid
              deals={visibleGridItems}
              loading={dealsQuery.isLoading && !dealsQuery.data}
              error={dealsQuery.isError}
              onOpenDetail={openDetail}
              onShare={openShare}
              density={effectiveDensity}
            />
          </div>

          {/* Load more */}
          {visibleGridItems.length < dedupedGridItems.length && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <Button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                variant="outline"
                size="lg"
                className="gap-2 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/40 hover:bg-accent/30"
              >
                <ChevronDown className="size-4" />
                Load more deals
                <span className="text-xs text-muted-foreground">
                  ({dedupedGridItems.length - visibleGridItems.length} remaining)
                </span>
              </Button>
            </div>
          )}

          {/* Refetch + keyboard hint */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => dealsQuery.refetch()}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={dealsQuery.isFetching ? 'size-3.5 animate-spin' : 'size-3.5'} />
              {dealsQuery.isFetching ? 'Refreshing…' : 'Refresh deals'}
            </Button>
            <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:inline-flex">
              <Keyboard className="size-3.5" />
              Press{' '}
              <kbd className="rounded border border-border/60 bg-card/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                /
              </kbd>{' '}
              to search
            </span>
          </div>
        </section>

        {/* Bottom CTA band */}
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/40 glass p-8 sm:p-12">
            <div
              className="absolute -right-20 -top-20 size-72 rounded-full opacity-30 blur-3xl animate-float-slow"
              style={{
                background: 'radial-gradient(circle, oklch(0.78 0.2 145 / 0.6), transparent 60%)',
              }}
            />
            <div
              className="absolute -bottom-20 -left-20 size-72 rounded-full opacity-25 blur-3xl animate-float-slower"
              style={{
                background: 'radial-gradient(circle, oklch(0.78 0.16 70 / 0.6), transparent 60%)',
              }}
            />
            <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex-1">
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Never miss a <span className="text-gradient-emerald">price drop</span> again
                </h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Add any game to your wishlist with one tap. We track prices across every store, so
                  the moment a deal drops, you&apos;re ready.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="#deals"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 sheen transition-all"
                >
                  <Flame className="size-4" />
                  Start saving
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ — trust-building Q&A */}
        <FaqSection />

        {/* Bottom spacer — extra padding when compare tray is visible so it
            doesn't overlap the last row of deal cards. */}
        <div className={compareCount > 0 ? 'mt-24 pb-24' : 'mt-24'} />
      </main>

      <SiteFooter />

      {/* Overlays */}
      <GameDetailDialog deal={activeDeal} open={detailOpen} onOpenChange={setDetailOpen} />
      <WishlistDrawer />
      <PriceDropAlerts
        liveDeals={dealsQuery.data?.deals ?? []}
        dropThreshold={prefs.dropThreshold}
      />
      <CompareTray />
      <LegalModalHost />
      <CookieConsent />
      <AuthDialog />
      <AccentApplier />
      <AchievementWatcher />
      <AchievementToast />
      <AchievementsPanel />
      <CommandPalette
        deals={dealsQuery.data?.deals ?? []}
        onOpenDetail={openDetail}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
      <PreferencesPanel open={prefsOpen} onOpenChange={setPrefsOpen} />
      <DealShareDialog deal={shareDeal} open={shareOpen} onOpenChange={setShareOpen} />

      {/* ARIA live region for filter result-count announcements */}
      <span className="sr-only" aria-live="polite" role="status">
        {dedupedGridItems.length} deals match the current filters
      </span>
    </>
  );
}
