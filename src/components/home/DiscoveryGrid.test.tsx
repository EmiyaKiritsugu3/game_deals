/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DiscoveryGrid from './DiscoveryGrid';

const { mockCollections } = vi.hoisted(() => ({
  mockCollections: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/data/collections', () => ({
  get COLLECTIONS() {
    return mockCollections();
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('DiscoveryGrid', () => {
  it('renders section heading', () => {
    mockCollections.mockReturnValue([
      { slug: 'test', title: 'Test', description: '', emoji: '🎮', gameIDs: ['1'] },
    ]);
    render(<DiscoveryGrid />);
    expect(screen.getByText('Discover Games')).toBeInTheDocument();
  });

  it('renders all collection cards', () => {
    mockCollections.mockReturnValue([
      {
        slug: 'best-coop-under-20',
        title: 'Best Co-op Games Under $20',
        description: 'Grab a friend.',
        emoji: '🤝',
        gameIDs: ['612', '128'],
      },
      {
        slug: 'rpg-essentials-under-15',
        title: 'RPG Essentials Under $15',
        description: 'Hundreds of hours.',
        emoji: '⚔️',
        gameIDs: ['146091'],
      },
    ]);
    render(<DiscoveryGrid />);
    expect(screen.getByText('Best Co-op Games Under $20')).toBeInTheDocument();
    expect(screen.getByText('RPG Essentials Under $15')).toBeInTheDocument();
  });

  it('renders collection emojis', () => {
    mockCollections.mockReturnValue([
      {
        slug: 'best-coop-under-20',
        title: 'Best Co-op Games Under $20',
        description: 'Grab a friend.',
        emoji: '🤝',
        gameIDs: ['612', '128'],
      },
    ]);
    render(<DiscoveryGrid />);
    expect(screen.getByLabelText('Best Co-op Games Under $20')).toHaveTextContent('🤝');
  });

  it('renders game count per collection', () => {
    mockCollections.mockReturnValue([
      {
        slug: 'best-coop-under-20',
        title: 'Best Co-op Games Under $20',
        description: 'Grab a friend.',
        emoji: '🤝',
        gameIDs: ['612', '128'],
      },
      {
        slug: 'rpg-essentials-under-15',
        title: 'RPG Essentials Under $15',
        description: 'Hundreds of hours.',
        emoji: '⚔️',
        gameIDs: ['146091'],
      },
    ]);
    render(<DiscoveryGrid />);
    expect(screen.getByText('2 games')).toBeInTheDocument();
    expect(screen.getByText('1 game')).toBeInTheDocument();
  });

  it('links to collection detail page', () => {
    mockCollections.mockReturnValue([
      {
        slug: 'best-coop-under-20',
        title: 'Best Co-op Games Under $20',
        description: 'Grab a friend.',
        emoji: '🤝',
        gameIDs: ['612', '128'],
      },
    ]);
    render(<DiscoveryGrid />);
    const link = screen.getByText('Best Co-op Games Under $20').closest('a');
    expect(link).toHaveAttribute('href', '/collections/best-coop-under-20');
  });

  it('renders All Collections link', () => {
    mockCollections.mockReturnValue([
      { slug: 'test', title: 'Test', description: '', emoji: '🎮', gameIDs: ['1'] },
    ]);
    render(<DiscoveryGrid />);
    const link = screen.getByText('All Collections →');
    expect(link).toHaveAttribute('href', '/collections');
  });

  it('returns null when no collections', () => {
    mockCollections.mockReturnValue([]);
    const { container } = render(<DiscoveryGrid />);
    expect(container.innerHTML).toBe('');
  });
});
