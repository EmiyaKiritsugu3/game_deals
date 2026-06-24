/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LevelBadge from '../LevelBadge';

describe('LevelBadge', () => {
  it('renders level 5 with XP progress', () => {
    render(<LevelBadge level={5} xp={250} xpToNext={110} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  it('renders progress text', () => {
    render(<LevelBadge level={3} xp={100} xpToNext={70} />);
    expect(screen.getByText(/10 \/ 70/)).toBeInTheDocument();
  });

  it('handles level 0', () => {
    render(<LevelBadge level={0} xp={0} xpToNext={10} />);
    expect(screen.getByText('Level 0')).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 10/)).toBeInTheDocument();
  });
});
