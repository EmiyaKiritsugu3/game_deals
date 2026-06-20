// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSearchGamesAction, mockUseQueryState, mockUseQuery, mockUseClickOutside } = vi.hoisted(
  () => ({
    mockSearchGamesAction: vi.fn(),
    mockUseQueryState: vi.fn(),
    mockUseQuery: vi.fn(),
    mockUseClickOutside: vi.fn(),
  })
);

vi.mock('@/actions/search', () => ({
  searchGamesAction: (...args: unknown[]) => mockSearchGamesAction(...args),
}));

vi.mock('nuqs', () => ({
  useQueryState: (...args: unknown[]) => mockUseQueryState(...args),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: (...args: unknown[]) => mockUseClickOutside(...args),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
}));

vi.mock('../Navbar.module.css', () => ({
  default: {
    searchContainer: 'searchContainer',
    searchForm: 'searchForm',
    searchInput: 'searchInput',
    searchButton: 'searchButton',
    searchDropdown: 'searchDropdown',
    dropdownItem: 'dropdownItem',
    dropdownThumb: 'dropdownThumb',
    dropdownInfo: 'dropdownInfo',
    dropdownTitle: 'dropdownTitle',
    dropdownPrice: 'dropdownPrice',
    loading: 'loading',
  },
}));

import { SearchBox } from './SearchBox';

describe('SearchBox', () => {
  let queryValue: string;
  let setQueryMock: ReturnType<typeof vi.fn>;
  const mockRef = { current: document.createElement('div') };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    queryValue = '';
    setQueryMock = vi.fn((val: string) => {
      queryValue = val;
    });
    mockUseQueryState.mockReturnValue([queryValue, setQueryMock]);
    mockUseClickOutside.mockReturnValue(mockRef);
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function renderSearchBox() {
    return render(<SearchBox />);
  }

  function openDropdownWithResults(
    results: Array<Record<string, string>> | undefined,
    isLoading: boolean
  ) {
    queryValue = 'search-query';
    mockUseQueryState.mockReturnValue([queryValue, setQueryMock]);
    mockUseQuery.mockReturnValue({ data: results, isLoading });
    const { container } = renderSearchBox();
    act(() => {
      const input = screen.getByPlaceholderText('Search for games...');
      fireEvent.focus(input);
      vi.advanceTimersByTime(300);
    });
    return container;
  }

  it('renders search input and submit button', () => {
    renderSearchBox();
    expect(screen.getByPlaceholderText('Search for games...')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders the search form with correct role', () => {
    renderSearchBox();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('calls setQuery when typing in input', () => {
    renderSearchBox();
    const input = screen.getByPlaceholderText('Search for games...');
    fireEvent.change(input, { target: { value: 'zelda' } });
    expect(setQueryMock).toHaveBeenCalledWith('zelda');
  });

  it('opens dropdown on input focus', () => {
    openDropdownWithResults(
      [{ gameID: '1', external: 'Zelda', thumb: 't.jpg', cheapest: '29.99' }],
      false
    );
    expect(screen.getByText('Zelda')).toBeInTheDocument();
  });

  it('shows loading state in dropdown', () => {
    openDropdownWithResults(undefined, true);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows "No games found" when results are empty', () => {
    openDropdownWithResults([], false);
    expect(screen.getByText('No games found')).toBeInTheDocument();
  });

  it('displays game results with image, title, and price', () => {
    openDropdownWithResults(
      [{ gameID: '100', external: 'Super Mario', thumb: 'mario.jpg', cheapest: '39.99' }],
      false
    );
    expect(screen.getByText('Super Mario')).toBeInTheDocument();
    expect(screen.getByText('From $39.99')).toBeInTheDocument();
    const img = screen.getByAltText('Super Mario');
    expect(img).toHaveAttribute('src', 'mario.jpg');
  });

  it('renders result links with correct href', () => {
    openDropdownWithResults(
      [{ gameID: '100', external: 'Super Mario', thumb: 'm.jpg', cheapest: '39.99' }],
      false
    );
    const link = screen.getByRole('link', { name: /super mario/i });
    expect(link).toHaveAttribute('href', '/game/100');
  });

  it('debounces query with 300ms delay', () => {
    renderSearchBox();

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('enables search when debounced query has 3+ chars', () => {
    queryValue = 'abc';
    mockUseQueryState.mockReturnValue([queryValue, setQueryMock]);
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

    renderSearchBox();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });

  it('does not enable search when query is less than 3 chars', () => {
    queryValue = 'ab';
    mockUseQueryState.mockReturnValue([queryValue, setQueryMock]);
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

    renderSearchBox();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('hides dropdown when query is less than 3 chars', () => {
    queryValue = 'ab';
    mockUseQueryState.mockReturnValue([queryValue, setQueryMock]);
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

    renderSearchBox();

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('No games found')).not.toBeInTheDocument();
  });

  it('cleans up debounce timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = renderSearchBox();
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('sets search query on form submit via action attribute', () => {
    renderSearchBox();
    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/search');
  });

  it('search input has required and autoComplete off attributes', () => {
    renderSearchBox();
    const input = screen.getByPlaceholderText('Search for games...');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('closes dropdown and clears query when result link is clicked', () => {
    openDropdownWithResults(
      [{ gameID: '100', external: 'Super Mario', thumb: 'm.jpg', cheapest: '39.99' }],
      false
    );
    const link = screen.getByRole('link', { name: /super mario/i });
    fireEvent.click(link);
    expect(setQueryMock).toHaveBeenCalledWith('');
  });

  it('search input has aria-label', () => {
    renderSearchBox();
    expect(screen.getByLabelText('Search games')).toBeInTheDocument();
  });

  it('sets isDropdownOpen to true on input onChange', () => {
    renderSearchBox();
    const input = screen.getByPlaceholderText('Search for games...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(setQueryMock).toHaveBeenCalledWith('test');
  });

  it('hides dropdown when no results and not loading and not empty', () => {
    queryValue = 'xyz';
    mockUseQueryState.mockReturnValue([queryValue, setQueryMock]);
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

    renderSearchBox();
    const input = screen.getByPlaceholderText('Search for games...');
    fireEvent.focus(input);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('search icon is rendered', () => {
    renderSearchBox();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('closes dropdown on click outside', () => {
    mockUseClickOutside.mockReturnValue({ current: document.createElement('div') });

    renderSearchBox();
    expect(mockUseClickOutside).toHaveBeenCalled();
  });

  it('does not show dropdown before debounce completes', () => {
    queryValue = 'abc';
    mockUseQueryState.mockReturnValue([queryValue, setQueryMock]);
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    renderSearchBox();
    const input = screen.getByPlaceholderText('Search for games...');
    fireEvent.focus(input);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('No games found')).not.toBeInTheDocument();
  });
});
