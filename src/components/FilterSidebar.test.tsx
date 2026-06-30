/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FilterSidebar from './FilterSidebar';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('./StoreFilter', () => ({
  default: ({
    stores,
    selectedStores,
    onToggle,
    onSelectAll,
    onClearAll,
  }: {
    stores: Array<{ storeID: string; storeName: string }>;
    selectedStores: Set<string>;
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
  }) => (
    <div data-testid="store-filter">
      {stores.map((s) => (
        <button key={s.storeID} onClick={() => onToggle(s.storeID)} type="button">
          {s.storeName}
        </button>
      ))}
      <button onClick={onSelectAll} type="button">
        Select All
      </button>
      <button onClick={onClearAll} type="button">
        Clear All
      </button>
      <span data-testid="selected-count">{selectedStores.size}</span>
    </div>
  ),
}));

const stores = [
  { storeID: '1', storeName: 'Steam' },
  { storeID: '7', storeName: 'GOG' },
];

describe('FilterSidebar', () => {
  it('renders filters header and sidebar', () => {
    render(<FilterSidebar stores={stores} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Max Price')).toBeInTheDocument();
    expect(screen.getByText('Stores')).toBeInTheDocument();
  });

  it('renders store filter with store buttons', () => {
    render(<FilterSidebar stores={stores} />);
    expect(screen.getByText('Steam')).toBeInTheDocument();
    expect(screen.getByText('GOG')).toBeInTheDocument();
  });

  it('toggles store selection', () => {
    render(<FilterSidebar stores={stores} />);
    fireEvent.click(screen.getByText('Steam'));
    expect(screen.getByTestId('selected-count').textContent).toBe('1');
    fireEvent.click(screen.getByText('Steam'));
    expect(screen.getByTestId('selected-count').textContent).toBe('0');
  });

  it('select all selects all stores', () => {
    render(<FilterSidebar stores={stores} />);
    fireEvent.click(screen.getByText('Select All'));
    expect(screen.getByTestId('selected-count').textContent).toBe('2');
  });

  it('clear all clears store selection', () => {
    render(<FilterSidebar stores={stores} />);
    fireEvent.click(screen.getByText('Select All'));
    fireEvent.click(screen.getByText('Clear All'));
    expect(screen.getByTestId('selected-count').textContent).toBe('0');
  });

  it('apply filters pushes to router with params', () => {
    render(<FilterSidebar stores={stores} />);
    fireEvent.change(screen.getByLabelText('Maximum price'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByText('Steam'));
    fireEvent.click(screen.getByText('Apply Filters'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('upperPrice=50'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('storeID=1'));
  });

  it('apply filters without price removes upperPrice', () => {
    render(<FilterSidebar stores={stores} />);
    fireEvent.click(screen.getByText('Steam'));
    fireEvent.click(screen.getByText('Apply Filters'));
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('upperPrice'));
  });

  it('clear filters resets state and pushes clean URL', () => {
    render(<FilterSidebar stores={stores} />);
    fireEvent.click(screen.getByText('Steam'));
    fireEvent.change(screen.getByLabelText('Maximum price'), {
      target: { value: '25' },
    });
    fireEvent.click(screen.getByText('Clear'));
    expect(mockPush).toHaveBeenCalledWith('/search?');
    expect(screen.getByLabelText('Maximum price')).toHaveValue(null);
  });

  it('apply with no stores and no price pushes clean URL', () => {
    render(<FilterSidebar stores={stores} />);
    fireEvent.click(screen.getByText('Apply Filters'));
    expect(mockPush).toHaveBeenCalledWith('/search?');
  });
});
