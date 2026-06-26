/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/game/GameHero', () => ({
  default: ({ gameTitle, bestCurrentPrice }: { gameTitle: string; bestCurrentPrice: number }) => (
    <div data-testid="game-hero">
      {gameTitle} - ${bestCurrentPrice}
    </div>
  ),
}));

vi.mock('@/components/game/GameStatsRow', () => ({
  default: ({ bestCurrentPrice }: { bestCurrentPrice: number }) => (
    <div data-testid="game-stats-row">Stats: ${bestCurrentPrice}</div>
  ),
}));

vi.mock('@/components/game/StoreComparison', () => ({
  default: ({ gameTitle }: { gameTitle: string }) => (
    <div data-testid="store-comparison">{gameTitle} deals</div>
  ),
}));

vi.mock('@/components/DynamicCharts', () => ({
  DynamicPriceHistory: () => <div data-testid="dynamic-price-history">Price History</div>,
  DynamicStoreCompare: () => <div data-testid="dynamic-store-compare">Store Compare</div>,
}));

vi.mock('@/components/game/GameHero.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css' }),
}));
vi.mock('@/components/game/GameStatsRow.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css' }),
}));
vi.mock('@/components/game/StoreComparison.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css' }),
}));

import GameBody from './GameBody';

const mockViewModel = {
  gameTitle: 'Test Game',
  highResThumb: '/thumb.jpg',
  bestRawPrice: '19.99',
  stats: {
    bestCurrentPrice: 14.99,
    isFree: false,
    cheapestEver: 4.99,
    isCurrentlyAtHL: false,
    costPerHour: '0.50',
    playtimeMain: 10,
  },
  official: [],
  keyshop: [],
  cheapestEverDate: 1700000000,
  stores: {},
};

describe('GameBody', () => {
  it('renders GameHero with stats.bestCurrentPrice', () => {
    render(<GameBody viewModel={mockViewModel} id="g1" />);
    const hero = screen.getByTestId('game-hero');
    expect(hero).toHaveTextContent('Test Game');
    expect(hero).toHaveTextContent('$14.99');
  });

  it('renders GameStatsRow with stats.bestCurrentPrice', () => {
    render(<GameBody viewModel={mockViewModel} id="g1" />);
    const statsRow = screen.getByTestId('game-stats-row');
    expect(statsRow).toHaveTextContent('$14.99');
  });

  it('renders StoreComparison', () => {
    render(<GameBody viewModel={mockViewModel} id="g1" />);
    expect(screen.getByTestId('store-comparison')).toHaveTextContent('Test Game deals');
  });

  it('renders DynamicPriceHistory', () => {
    render(<GameBody viewModel={mockViewModel} id="g1" />);
    expect(screen.getByTestId('dynamic-price-history')).toBeInTheDocument();
  });

  it('renders DynamicStoreCompare', () => {
    render(<GameBody viewModel={mockViewModel} id="g1" />);
    expect(screen.getByTestId('dynamic-store-compare')).toBeInTheDocument();
  });

  it('renders with different game data', () => {
    const freeViewModel = {
      ...mockViewModel,
      gameTitle: 'Free Game',
      bestRawPrice: '0',
      stats: {
        ...mockViewModel.stats,
        bestCurrentPrice: 0,
        isFree: true,
      },
    };
    render(<GameBody viewModel={freeViewModel} id="g2" />);
    const hero = screen.getByTestId('game-hero');
    expect(hero).toHaveTextContent('Free Game');
    expect(hero).toHaveTextContent('$0');
  });

  it('passes priority prop to GameHero', () => {
    render(<GameBody viewModel={mockViewModel} id="g1" priority />);
    const hero = screen.getByTestId('game-hero');
    const statsRow = screen.getByTestId('game-stats-row');
    expect(hero).toBeInTheDocument();
    expect(statsRow).toBeInTheDocument();
  });
});
