// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    // biome-ignore lint/suspicious/noExplicitAny: mock component needs flexible props
    div: ({ children, onClick, ref }: any) => (
      // biome-ignore lint/a11y/noStaticElementInteractions: test mock
      // biome-ignore lint/a11y/useKeyWithClickEvents: test mock
      <div ref={ref} onClick={onClick}>
        {children}
      </div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
}));

vi.mock('./SidebarModal.module.css', () => ({
  default: { overlay: 'overlay', sidebar: 'sidebar', closeBtn: 'closeBtn', content: 'content' },
}));

import SidebarModal from './SidebarModal';

beforeEach(() => {
  mockBack.mockClear();
  document.body.style.overflow = '';
});

describe('SidebarModal', () => {
  it('renders children', () => {
    render(
      <SidebarModal>
        <p>Modal content</p>
      </SidebarModal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls router.back when close button clicked', async () => {
    const user = userEvent.setup();
    render(
      <SidebarModal>
        <p>Content</p>
      </SidebarModal>
    );
    await user.click(screen.getByLabelText('Close sidebar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('calls router.back when Escape key pressed', async () => {
    render(
      <SidebarModal>
        <p>Content</p>
      </SidebarModal>
    );
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('sets body overflow to hidden while open', () => {
    render(
      <SidebarModal>
        <p>Content</p>
      </SidebarModal>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow on unmount', () => {
    const { unmount } = render(
      <SidebarModal>
        <p>Content</p>
      </SidebarModal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});
