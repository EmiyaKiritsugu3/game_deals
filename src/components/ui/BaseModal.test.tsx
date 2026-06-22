/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BaseModal from './BaseModal';

describe('BaseModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <BaseModal isOpen={false} onClose={vi.fn()}>
        <p>Hidden content</p>
      </BaseModal>
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('renders children when isOpen is true', () => {
    render(
      <BaseModal isOpen={true} onClose={vi.fn()}>
        <p>Visible content</p>
      </BaseModal>
    );
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <BaseModal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </BaseModal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <BaseModal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </BaseModal>
    );

    // The overlay is the parent of the dialog element
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement;
    expect(overlay).toBeInTheDocument();

    /* v8 ignore next 3 */
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when modal content is clicked (stopPropagation)', () => {
    const onClose = vi.fn();
    render(
      <BaseModal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </BaseModal>
    );

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps focus: Tab from last focusable element wraps to first (close button)', () => {
    render(
      <BaseModal isOpen={true} onClose={vi.fn()}>
        <button type="button">Middle</button>
        <button type="button">Last</button>
      </BaseModal>
    );

    const closeBtn = screen.getByRole('button', { name: 'Close modal' });
    const lastBtn = screen.getByText('Last');

    // Focus the last button, then Tab should wrap to first (close button)
    lastBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(closeBtn);
  });

  it('traps focus: Shift+Tab from first focusable element wraps to last', () => {
    render(
      <BaseModal isOpen={true} onClose={vi.fn()}>
        <button type="button">Middle</button>
        <button type="button">Last</button>
      </BaseModal>
    );

    const closeBtn = screen.getByRole('button', { name: 'Close modal' });
    const lastBtn = screen.getByText('Last');

    // Focus the close button (first focusable), then Shift+Tab should wrap to last
    closeBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(lastBtn);
  });

  it('has accessible name via aria-label prop', () => {
    render(
      <BaseModal isOpen={true} onClose={vi.fn()} ariaLabel="Custom dialog label">
        <p>Content</p>
      </BaseModal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Custom dialog label');
  });

  it('falls back to title for aria-label when ariaLabel is not provided', () => {
    render(
      <BaseModal isOpen={true} onClose={vi.fn()} title="Dialog Title">
        <p>Content</p>
      </BaseModal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Dialog Title');
  });

  it('renders title heading when title prop is provided', () => {
    render(
      <BaseModal isOpen={true} onClose={vi.fn()} title="My Modal Title">
        <p>Content</p>
      </BaseModal>
    );
    expect(screen.getByText('My Modal Title')).toBeInTheDocument();
  });

  it('does not render title heading when title prop is omitted', () => {
    render(
      <BaseModal isOpen={true} onClose={vi.fn()}>
        <p>Content</p>
      </BaseModal>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <BaseModal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </BaseModal>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
