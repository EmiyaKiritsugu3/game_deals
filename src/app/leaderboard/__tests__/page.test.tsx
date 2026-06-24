/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LeaderboardPage from '../page';

const { leaderboardMock } = vi.hoisted(() => ({
  leaderboardMock: vi.fn().mockResolvedValue([
    { userId: 'u-1', xp: 500, badgeCount: 5 },
    { userId: 'u-2', xp: 300, badgeCount: 3 },
    { userId: 'u-3', xp: 100, badgeCount: 1 },
  ]),
}));

vi.mock('@/services/gamification', () => ({
  getLeaderboard: leaderboardMock,
}));

describe('LeaderboardPage', () => {
  it('renders top 3 with medals', async () => {
    render(await LeaderboardPage());

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
    expect(screen.getByText(/Player u-1/)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows empty state when no entries', async () => {
    leaderboardMock.mockResolvedValue([]);

    render(await LeaderboardPage());

    expect(screen.getByText(/Be the first/)).toBeInTheDocument();
  });
});
