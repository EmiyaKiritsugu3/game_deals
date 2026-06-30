/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StoreFilter from '@/components/StoreFilter';

const mockStores = [
  { storeID: '1', storeName: 'Steam' },
  { storeID: '2', storeName: 'GamersGate' },
  { storeID: '3', storeName: 'Green Man Gaming' },
  { storeID: '4', storeName: 'Amazon' },
  { storeID: '5', storeName: 'GameStop' },
  { storeID: '6', storeName: 'Direct2Drive' },
  { storeID: '7', storeName: 'GoG' },
  { storeID: '8', storeName: 'Origin' },
  { storeID: '9', storeName: 'Get Games' },
  { storeID: '10', storeName: 'Shiny Loot' },
  { storeID: '11', storeName: 'Humble Bundle' },
  { storeID: '12', storeName: 'Desura' },
  { storeID: '13', storeName: 'Uplay' },
  { storeID: '14', storeName: 'IndieGameStand' },
  { storeID: '15', storeName: 'Fanatical' },
  { storeID: '16', storeName: 'Gamesrocket' },
  { storeID: '17', storeName: 'Games Republic' },
  { storeID: '18', storeName: 'Sila Games' },
  { storeID: '19', storeName: 'Playfield' },
  { storeID: '20', storeName: 'Imperial Games' },
  { storeID: '21', storeName: 'WinGameStore' },
  { storeID: '22', storeName: 'FunStockDigital' },
  { storeID: '23', storeName: 'GameBillet' },
  { storeID: '24', storeName: 'Voidu' },
  { storeID: '25', storeName: 'Epic Games' },
  { storeID: '26', storeName: 'IndieGala' },
  { storeID: '27', storeName: 'Blizzard Shop' },
  { storeID: '28', storeName: 'Rockstar Shop' },
  { storeID: '29', storeName: 'Mac Game Store' },
  { storeID: '30', storeName: 'Square Enix' },
];

describe('StoreFilter', () => {
  const onToggle = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all stores without a 25-cap limit', () => {
    render(<StoreFilter stores={mockStores} selectedStores={new Set()} onToggle={onToggle} />);

    expect(screen.getByText('Steam')).toBeInTheDocument();
    expect(screen.getByText('Epic Games')).toBeInTheDocument();
    expect(screen.getByText('IndieGala')).toBeInTheDocument();
    expect(screen.getByText('Blizzard Shop')).toBeInTheDocument();
    expect(screen.getByText('Rockstar Shop')).toBeInTheDocument();
    expect(screen.getByText('Square Enix')).toBeInTheDocument();
  });

  it('renders Select All and Clear All buttons', () => {
    render(<StoreFilter stores={mockStores} selectedStores={new Set()} onToggle={onToggle} />);

    expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('has a search input that filters stores by name', () => {
    render(<StoreFilter stores={mockStores} selectedStores={new Set()} onToggle={onToggle} />);

    const searchInput = screen.getByPlaceholderText(/search stores/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'steam' } });

    expect(screen.getByText('Steam')).toBeInTheDocument();
    expect(screen.queryByText('GamersGate')).not.toBeInTheDocument();
    expect(screen.queryByText('Green Man Gaming')).not.toBeInTheDocument();
  });

  it('shows all stores when search is cleared', () => {
    render(<StoreFilter stores={mockStores} selectedStores={new Set()} onToggle={onToggle} />);

    const searchInput = screen.getByPlaceholderText(/search stores/i);
    fireEvent.change(searchInput, { target: { value: 'steam' } });
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(screen.getByText('Steam')).toBeInTheDocument();
    expect(screen.getByText('GamersGate')).toBeInTheDocument();
  });

  it('calls onToggle when a store checkbox is clicked', () => {
    render(
      <StoreFilter stores={mockStores.slice(0, 3)} selectedStores={new Set()} onToggle={onToggle} />
    );

    const steamCheckbox = screen.getByRole('checkbox', { name: 'Steam' });
    fireEvent.click(steamCheckbox);

    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('shows checked state for selected stores', () => {
    render(
      <StoreFilter
        stores={mockStores.slice(0, 3)}
        selectedStores={new Set(['1', '3'])}
        onToggle={onToggle}
      />
    );

    const steamCheckbox = screen.getByRole('checkbox', { name: 'Steam' });
    const gamersgateCheckbox = screen.getByRole('checkbox', { name: 'GamersGate' });
    const gmgCheckbox = screen.getByRole('checkbox', { name: 'Green Man Gaming' });

    expect(steamCheckbox).toBeChecked();
    expect(gamersgateCheckbox).not.toBeChecked();
    expect(gmgCheckbox).toBeChecked();
  });

  it('shows a count of displayed stores', () => {
    render(<StoreFilter stores={mockStores} selectedStores={new Set()} onToggle={onToggle} />);

    expect(screen.getByText(/30 stores/i)).toBeInTheDocument();
  });

  it('shows matching count when filtering', () => {
    render(<StoreFilter stores={mockStores} selectedStores={new Set()} onToggle={onToggle} />);

    const searchInput = screen.getByPlaceholderText(/search stores/i);
    fireEvent.change(searchInput, { target: { value: 'steam' } });

    expect(screen.getByText(/showing.*\d+.*store/i)).toBeInTheDocument();
  });

  it('respects the selected stores count in header', () => {
    render(
      <StoreFilter
        stores={mockStores.slice(0, 3)}
        selectedStores={new Set(['1'])}
        onToggle={onToggle}
      />
    );

    expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
  });
});
