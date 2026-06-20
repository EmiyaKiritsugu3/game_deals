/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GameStatsRow from './GameStatsRow';

const defaultProps = {
  bestCurrentPrice: 29.99,
  isFree: false,
  bestRawPrice: '29.99',
  cheapestEver: 9.99,
  isCurrentlyAtHL: false,
  costPerHour: '$0.50',
  playtimeMain: 20,
};

describe('GameStatsRow', () => {
  it('renders price when not free', () => {
    render(<GameStatsRow {...defaultProps} />);
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('shows "FREE" when bestCurrentPrice=0', () => {
    render(<GameStatsRow {...defaultProps} bestCurrentPrice={0} />);
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('shows "FREE" when isFree=true', () => {
    render(<GameStatsRow {...defaultProps} isFree={true} />);
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('shows historical low price', () => {
    render(<GameStatsRow {...defaultProps} />);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('shows "LIVE HL" badge when isCurrentlyAtHL=true', () => {
    render(<GameStatsRow {...defaultProps} isCurrentlyAtHL={true} />);
    expect(screen.getByText('LIVE HL')).toBeInTheDocument();
  });

  it('does not show "LIVE HL" when isCurrentlyAtHL=false', () => {
    render(<GameStatsRow {...defaultProps} isCurrentlyAtHL={false} />);
    expect(screen.queryByText('LIVE HL')).not.toBeInTheDocument();
  });

  it('renders cost per hour', () => {
    render(<GameStatsRow {...defaultProps} />);
    expect(screen.getByText('$0.50')).toBeInTheDocument();
  });

  it('renders playtime', () => {
    render(<GameStatsRow {...defaultProps} />);
    expect(screen.getByText(/20h campaign/)).toBeInTheDocument();
  });
});
