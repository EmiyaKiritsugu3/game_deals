'use client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { searchGamesAction } from '@/actions/search';
import { useClickOutside } from '@/hooks/useClickOutside';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsDropdownOpen(false));

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useQuery<Array<Record<string, string>>>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchGamesAction(debouncedQuery, 5),
    enabled: debouncedQuery.length >= 3,
    staleTime: 60 * 1000,
  });

  return (
    <div className="w-full max-w-[480px] relative" ref={dropdownRef}>
      {/* biome-ignore lint/a11y/useSemanticElements: form with role search is correct for search forms */}
      <form action="/search" className="flex relative items-center" role="search">
        <input
          type="text"
          name="q"
          placeholder="Search for games..."
          className="w-full py-2 pr-4 pl-11 rounded-lg border border-border/50 bg-background text-foreground text-sm outline-none transition-all focus:border-primary/50 focus:bg-card focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_10%,transparent)] [&::placeholder]:text-muted-foreground [&::placeholder]:font-medium peer"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          autoComplete="off"
          required
          aria-label="Search games"
        />
        <button
          type="submit"
          className="absolute left-3 text-muted-foreground flex items-center justify-center peer-focus:text-primary"
        >
          <Search size={20} />
        </button>
      </form>

      {isDropdownOpen && debouncedQuery.length >= 3 && (
        <div
          className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-card border border-border rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden z-[100] flex flex-col"
          aria-live="polite"
        >
          {(() => {
            if (isLoading) {
              return (
                <div className="flex items-center gap-4 px-4 py-3 no-underline text-muted-foreground justify-center py-6">
                  Loading...
                </div>
              );
            }
            if (results && results.length > 0) {
              return results.map((game) => (
                <Link
                  href={`/game/${game.gameID}`}
                  key={game.gameID}
                  className="flex items-center gap-4 px-4 py-3 no-underline text-foreground border-b border-border/50 hover:bg-muted/50 transition-colors last:border-none"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setQuery('');
                  }}
                >
                  {
                    // biome-ignore lint/performance/noImgElement: search result thumbnails
                    <img
                      src={game.thumb}
                      alt={game.external}
                      className="w-[60px] h-[30px] object-cover rounded"
                    />
                  }
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold truncate max-w-[300px]">
                      {game.external}
                    </span>
                    <span className="text-xs text-primary font-bold">From ${game.cheapest}</span>
                  </div>
                </Link>
              ));
            }
            return (
              <div className="flex items-center gap-4 px-4 py-3 no-underline text-foreground border-b border-border/50 hover:bg-muted/50 transition-colors last:border-none">
                No games found
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
