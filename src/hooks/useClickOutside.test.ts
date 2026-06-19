// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  it('fires callback when clicking outside the ref element', () => {
    const callback = vi.fn();
    const innerDiv = document.createElement('div');
    document.body.appendChild(innerDiv);

    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(callback));

    act(() => {
      (result.current as React.RefObject<HTMLDivElement>).current = innerDiv;
    });

    const outsideDiv = document.createElement('div');
    document.body.appendChild(outsideDiv);
    outsideDiv.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(callback).toHaveBeenCalled();

    document.body.removeChild(innerDiv);
    document.body.removeChild(outsideDiv);
  });

  it('does not fire callback when clicking inside the ref element', () => {
    const callback = vi.fn();
    const innerDiv = document.createElement('div');
    const childSpan = document.createElement('span');
    innerDiv.appendChild(childSpan);
    document.body.appendChild(innerDiv);

    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(callback));

    act(() => {
      (result.current as React.RefObject<HTMLDivElement>).current = innerDiv;
    });

    childSpan.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(innerDiv);
  });

  it('responds to mousedown events (not click)', () => {
    const callback = vi.fn();
    const innerDiv = document.createElement('div');
    document.body.appendChild(innerDiv);

    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(callback));

    act(() => {
      (result.current as React.RefObject<HTMLDivElement>).current = innerDiv;
    });

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(callback).not.toHaveBeenCalled();

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(callback).toHaveBeenCalled();

    document.body.removeChild(innerDiv);
  });

  it('no-ops when ref is null', () => {
    const callback = vi.fn();
    renderHook(() => useClickOutside<HTMLDivElement>(callback));

    const div = document.createElement('div');
    document.body.appendChild(div);
    div.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('removes listener on unmount', () => {
    const callback = vi.fn();
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useClickOutside<HTMLDivElement>(callback));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    removeSpy.mockRestore();
  });
});
