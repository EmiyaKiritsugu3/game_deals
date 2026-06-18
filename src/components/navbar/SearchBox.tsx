'use client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { searchGamesAction } from '@/actions/search';
import { useClickOutside } from '@/hooks/useClickOutside';
import styles from '../Navbar.module.css';

export function SearchBox() {
  const [query, setQuery] = useQueryState('q', { defaultValue: '' });
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
    <div className={styles.searchContainer} ref={dropdownRef}>
      {/* biome-ignore lint/a11y/useSemanticElements: form with role search is correct for search forms */}
      <form action="/search" className={styles.searchForm} role="search">
        <input
          type="text"
          name="q"
          placeholder="Search for games..."
          className={styles.searchInput}
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
        <button type="submit" className={styles.searchButton}>
          <Search size={20} />
        </button>
      </form>

      {isDropdownOpen && debouncedQuery.length >= 3 && (
        <div className={styles.searchDropdown}>
          {(() => {
            if (isLoading) {
              return <div className={`${styles.dropdownItem} ${styles.loading}`}>Loading...</div>;
            }
            if (results && results.length > 0) {
              return results.map((game) => (
                <Link
                  href={`/game/${game.gameID}`}
                  key={game.gameID}
                  className={styles.dropdownItem}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setQuery('');
                  }}
                >
                  {
                    // biome-ignore lint/performance/noImgElement: search result thumbnails
                    <img src={game.thumb} alt={game.external} className={styles.dropdownThumb} />
                  }
                  <div className={styles.dropdownInfo}>
                    <span className={styles.dropdownTitle}>{game.external}</span>
                    <span className={styles.dropdownPrice}>From ${game.cheapest}</span>
                  </div>
                </Link>
              ));
            }
            return <div className={styles.dropdownItem}>No games found</div>;
          })()}
        </div>
      )}
    </div>
  );
}
