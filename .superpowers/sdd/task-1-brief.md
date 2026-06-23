### Task 1: AddToListButton — interaction & variant test

**Files:**
- Create: `src/components/AddToListButton.test.tsx`
- Mock: `src/components/AddToListModal` (already tested, mock it)

**Interfaces:**
- Consumes: `AddToListButton` component props: `{ gameId: string; variant?: 'icon' | 'full' }`
- Produces: test for event propagation, state toggle, variant rendering

- [ ] **Step 1: Write the test file**

```tsx
/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AddToListButton from './AddToListButton';

vi.mock('./AddToListModal', () => ({
  default: ({ gameId, onClose }: { gameId: string; onClose: () => void }) => (
    <div data-testid="add-to-list-modal">
      <span>{gameId}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('AddToListButton', () => {
  it('renders icon variant by default', () => {
    render(<AddToListButton gameId="123" />);
    const button = screen.getByTitle('Add to Playlist');
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveTextContent('Add to List');
  });

  it('renders full variant with label', () => {
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

  it('closes modal when onClose is called', () => {
    render(<AddToListButton gameId="456" />);
    fireEvent.click(screen.getByTitle('Add to Playlist'));
    expect(screen.getByTestId('add-to-list-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('add-to-list-modal')).not.toBeInTheDocument();
  });

  it('stops event propagation on click', () => {
    const parentClick = vi.fn();
    render(
      // biome-ignore lint/a11y/useKeyEvents: test wrapper
      <div onClick={parentClick}>
        <AddToListButton gameId="123" />
      </div>
    );
    fireEvent.click(screen.getByTitle('Add to Playlist'));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm vitest run src/components/AddToListButton.test.tsx`
Expected: 5 passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/components/AddToListButton.test.tsx
git commit -m "test(components): AddToListButton interaction and variant coverage"
```

---

