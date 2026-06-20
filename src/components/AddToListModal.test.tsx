/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom doesn't support HTMLDialogElement.showModal
HTMLDialogElement.prototype.showModal = vi.fn();
HTMLDialogElement.prototype.close = vi.fn();

const mockMutate = vi.fn();
const mockUsePlaylistMutations = vi.fn();
const mockUsePlaylists = vi.fn();

vi.mock('@/hooks/usePlaylistMutations', () => ({
  usePlaylistMutations: (...args: unknown[]) => mockUsePlaylistMutations(...args),
}));

vi.mock('@/hooks/usePlaylists', () => ({
  usePlaylists: (...args: unknown[]) => mockUsePlaylists(...args),
}));

import AddToListModal from './AddToListModal';

describe('AddToListModal', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockUsePlaylistMutations.mockReset();
    mockUsePlaylists.mockReset();
  });

  it('returns null when loading', () => {
    mockUsePlaylistMutations.mockReturnValue({
      addMutation: { isPending: false },
      createMutation: { isPending: false },
    });
    mockUsePlaylists.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<AddToListModal gameId="123" onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows playlists when loaded', () => {
    mockUsePlaylistMutations.mockReturnValue({
      addMutation: { isPending: false },
      createMutation: { isPending: false },
    });
    mockUsePlaylists.mockReturnValue({
      data: [{ id: 'p1', title: 'My List' }],
      isLoading: false,
    });
    render(<AddToListModal gameId="123" onClose={vi.fn()} />);
    expect(screen.getByText('My List')).toBeInTheDocument();
  });

  it('shows "You don\'t have any playlists yet." when empty', () => {
    mockUsePlaylistMutations.mockReturnValue({
      addMutation: { isPending: false },
      createMutation: { isPending: false },
    });
    mockUsePlaylists.mockReturnValue({ data: [], isLoading: false });
    render(<AddToListModal gameId="123" onClose={vi.fn()} />);
    expect(screen.getByText(/don't have any playlists yet/)).toBeInTheDocument();
  });

  it('calls onClose on cancel click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockUsePlaylistMutations.mockReturnValue({
      addMutation: { isPending: false },
      createMutation: { isPending: false },
    });
    mockUsePlaylists.mockReturnValue({ data: [], isLoading: false });
    render(<AddToListModal gameId="123" onClose={onClose} />);
    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows create form with input and button', () => {
    mockUsePlaylistMutations.mockReturnValue({
      addMutation: { isPending: false },
      createMutation: { isPending: false },
    });
    mockUsePlaylists.mockReturnValue({ data: [], isLoading: false });
    render(<AddToListModal gameId="123" onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/New playlist name/)).toBeInTheDocument();
    expect(screen.getByText('Create & Add')).toBeInTheDocument();
  });

  it('disables create button when name is empty', () => {
    mockUsePlaylistMutations.mockReturnValue({
      addMutation: { isPending: false },
      createMutation: { isPending: false },
    });
    mockUsePlaylists.mockReturnValue({ data: [], isLoading: false });
    render(<AddToListModal gameId="123" onClose={vi.fn()} />);
    expect(screen.getByText('Create & Add')).toBeDisabled();
  });
});
