/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SavedGame } from '@/hooks/useSortedGames';
import WishlistHero from './WishlistHero';

const cssProxy = vi.hoisted(
  () => new Proxy({}, { get: (_: unknown, k: string) => (typeof k === 'string' ? k : '') })
);

vi.mock('./WishlistHero.module.css', () => ({ default: cssProxy }));

const defaultProps = {
  bestDiscountGame: null,
};

describe('WishlistHero', () => {
  it('renders hero title and subtitle', () => {
    render(<WishlistHero {...defaultProps} />);
    expect(screen.getByText('My Dashboard ❤️')).toBeInTheDocument();
    expect(screen.getByText('Manage your favorite games and alerts.')).toBeInTheDocument();
  });

  it('renders hero background when bestDiscountGame has thumb', () => {
    const game = {
      gameID: 'g1',
      title: 'Game',
      thumb: 'https://example.com/bg.jpg',
      salePrice: '5',
      normalPrice: '20',
      savings: 75,
      storeID: '1',
    } as SavedGame;

    const { container } = render(<WishlistHero bestDiscountGame={game} />);
    const allDivs = container.querySelectorAll('div');
    const bgDiv = Array.from(allDivs).find((d) =>
      d.style.backgroundImage?.includes('https://example.com/bg.jpg')
    );
    expect(bgDiv).toBeInTheDocument();
  });

  it('does not render hero background when bestDiscountGame is null', () => {
    const { container } = render(<WishlistHero bestDiscountGame={null} />);
    const allDivs = container.querySelectorAll('div');
    const bgDiv = Array.from(allDivs).find((d) => d.style.backgroundImage);
    expect(bgDiv).toBeUndefined();
  });

  it('does not render hero background when thumb is empty', () => {
    const game = {
      gameID: 'g1',
      title: 'Game',
      thumb: '',
      salePrice: '5',
      normalPrice: '20',
      savings: 75,
      storeID: '1',
    } as SavedGame;

    const { container } = render(<WishlistHero bestDiscountGame={game} />);
    const allDivs = container.querySelectorAll('div');
    const bgDiv = Array.from(allDivs).find((d) => d.style.backgroundImage);
    expect(bgDiv).toBeUndefined();
  });

  it('renders hero overlay element', () => {
    const { container } = render(<WishlistHero {...defaultProps} />);
    const divs = container.querySelectorAll('div');
    const overlayDiv = Array.from(divs).find((d) => d.className.includes('heroOverlay'));
    expect(overlayDiv).toBeInTheDocument();
  });

  it('renders hero content container', () => {
    const { container } = render(<WishlistHero {...defaultProps} />);
    const divs = container.querySelectorAll('div');
    const contentDiv = Array.from(divs).find((d) => d.className.includes('heroContent'));
    expect(contentDiv).toBeInTheDocument();
  });
});
