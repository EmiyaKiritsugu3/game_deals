/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./AddToListModal', () => ({
  default: ({ gameId, onClose }: { gameId: string; onClose: () => void }) => (
    <div data-testid="add-to-list-modal">
      <span>{gameId}</span>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('./AddToListButton.module.css', () => ({
  default: { button: 'button', icon: 'icon', full: 'full' },
}));

vi.mock('lucide-react', () => ({
  Plus: (props: { size?: number; strokeWidth?: number }) => (
    <svg data-testid="plus-icon" data-size={props.size} data-strokewidth={props.strokeWidth} />
  ),
}));

import AddToListButton from './AddToListButton';

describe('AddToListButton', () => {
  it('renders icon variant by default', () => {
    render(<AddToListButton gameId="123" />);
    const button = screen.getByTitle('Add to Playlist');
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveTextContent('Add to List');
  });

  it('renders full variant label', () => {
    render(<AddToListButton gameId="123" variant="full" />);
    const button = screen.getByTitle('Add to Playlist');
    expect(button).toHaveTextContent('Add to List');
  });

  it('shows modal on button click', () => {
    render(<AddToListButton gameId="456" />);
    fireEvent.click(screen.getByTitle('Add to Playlist'));
    expect(screen.getByTestId('add-to-list-modal')).toBeInTheDocument();
    expect(screen.getByText('456')).toBeInTheDocument();
  });

  it('closes modal via onClose', () => {
    render(<AddToListButton gameId="789" />);
    fireEvent.click(screen.getByTitle('Add to Playlist'));
    expect(screen.getByTestId('add-to-list-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('add-to-list-modal')).not.toBeInTheDocument();
  });

  it('prevents click propagation', () => {
    const onParentClick = vi.fn();
    render(
      // biome-ignore lint/a11y/noStaticElementInteractions: test wrapper
      // biome-ignore lint/a11y/useKeyWithClickEvents: test wrapper
      <div onClick={onParentClick}>
        <AddToListButton gameId="123" />
      </div>
    );
    fireEvent.click(screen.getByTitle('Add to Playlist'));
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('renders smaller Plus icon for icon variant', () => {
    render(<AddToListButton gameId="1" />);
    const icon = screen.getByTestId('plus-icon');
    expect(icon).toHaveAttribute('data-size', '18');
  });

  it('renders larger Plus icon for full variant', () => {
    render(<AddToListButton gameId="1" variant="full" />);
    const icon = screen.getByTestId('plus-icon');
    expect(icon).toHaveAttribute('data-size', '20');
  });
});
