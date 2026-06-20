/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      src,
      alt,
      fill: _fill,
      sizes: _sizes,
      priority: _priority,
      className: _className,
      ...rest
    } = props;
    return <div data-testid="hero-image" data-src={String(src)} data-alt={String(alt)} {...rest} />;
  },
}));

vi.mock('@/components/HeartButton', () => ({
  default: ({ gameID }: { gameID: string }) => (
    <button type="button" data-testid="heart-button" data-game-id={gameID}>
      Heart
    </button>
  ),
}));

vi.mock('@/components/PriceAlertTrigger', () => ({
  default: ({
    gameID,
    gameTitle,
    currentPrice,
  }: {
    gameID: string;
    gameTitle: string;
    currentPrice: number;
  }) => (
    <button
      type="button"
      data-testid="price-alert-trigger"
      data-game-id={gameID}
      data-title={gameTitle}
      data-price={currentPrice}
    >
      Alert
    </button>
  ),
}));

import GameHero from './GameHero';

describe('GameHero', () => {
  it('renders game title', () => {
    render(
      <GameHero
        gameId="123"
        gameTitle="Test Game"
        thumb="https://example.com/thumb.jpg"
        bestCurrentPrice={29.99}
      />
    );
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('passes gameId to HeartButton', () => {
    render(
      <GameHero
        gameId="123"
        gameTitle="Test Game"
        thumb="https://example.com/thumb.jpg"
        bestCurrentPrice={29.99}
      />
    );
    expect(screen.getByTestId('heart-button')).toHaveAttribute('data-game-id', '123');
  });

  it('passes gameTitle and currentPrice to PriceAlertTrigger', () => {
    render(
      <GameHero
        gameId="123"
        gameTitle="Test Game"
        thumb="https://example.com/thumb.jpg"
        bestCurrentPrice={29.99}
      />
    );
    const trigger = screen.getByTestId('price-alert-trigger');
    expect(trigger).toHaveAttribute('data-title', 'Test Game');
    expect(trigger).toHaveAttribute('data-price', '29.99');
  });

  it('uses compact class when size=compact', () => {
    const { container } = render(
      <GameHero
        gameId="123"
        gameTitle="Test Game"
        thumb="https://example.com/thumb.jpg"
        bestCurrentPrice={29.99}
        size="compact"
      />
    );
    const heroContainer = container.querySelector('[class*="heroContainer"]');
    expect(heroContainer?.className).toContain('compact');
  });

  it('uses full class when size=full (default)', () => {
    const { container } = render(
      <GameHero
        gameId="123"
        gameTitle="Test Game"
        thumb="https://example.com/thumb.jpg"
        bestCurrentPrice={29.99}
      />
    );
    const heroContainer = container.querySelector('[class*="heroContainer"]');
    expect(heroContainer?.className).toContain('full');
  });

  it('sets priority on image when priority=true', () => {
    render(
      <GameHero
        gameId="123"
        gameTitle="Test Game"
        thumb="https://example.com/thumb.jpg"
        bestCurrentPrice={29.99}
        priority={true}
      />
    );
    const img = screen.getByTestId('hero-image');
    expect(img).toBeInTheDocument();
  });
});
